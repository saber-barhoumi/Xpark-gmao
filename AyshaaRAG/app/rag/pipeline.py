"""
AyshaaPipeline — l'orchestrateur : le seul objet que l'API connaisse.

Flux d'une question (docs/sequence-diagrams.md) :
    message → détection de langue → retrieval hybride (RRF)
            → seuil de confiance → provider (Ollama ⭢ extractif)
            → mémoire (append) → réponse {texte, langue, sources, suggestions}

Le pipeline est construit une fois au démarrage (lifespan FastAPI) et porte
l'état process-local : index BM25, service d'embeddings, mémoire, providers.
"""
from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import AsyncIterator

from app.config import get_settings
from app.core.logging import log_event
from app.core.metrics import CHAT_LATENCY, CHAT_MESSAGES, CHAT_NO_ANSWER
from app.rag.chunking import load_knowledge_base
from app.rag.embeddings import EmbeddingService
from app.rag.language import detect_language
from app.rag.lexical import LexicalIndex
from app.rag.memory import SqliteStore
from app.rag.prompts import GREETINGS, NO_ANSWER, SUGGESTIONS
from app.rag.providers import ExtractiveProvider, OllamaProvider
from app.rag.retriever import HybridRetriever
from app.rag.smalltalk import detect_intent, reply_smalltalk, strip_greeting_prefix
from app.rag.vectorstore import QdrantStore

log = logging.getLogger("ayshaa.pipeline")


class AyshaaPipeline:
    def __init__(self) -> None:
        self.embeddings = EmbeddingService()
        self.store = QdrantStore()
        self.lexical = LexicalIndex()
        self.retriever = HybridRetriever(self.store, self.lexical, self.embeddings)
        self.memory = SqliteStore()
        self.ollama = OllamaProvider()
        self.extractive = ExtractiveProvider()

    # ── Indexation ───────────────────────────────────────────────────────────

    def startup_index(self) -> dict:
        """Au démarrage : BM25 toujours reconstruit ; Qdrant réindexé si vide."""
        chunks = load_knowledge_base(Path(get_settings().knowledge_dir))
        self.lexical.build(chunks)
        stats = {"chunks": len(chunks), "qdrant_indexed": False, "dense": False}

        if self.store.ping():
            if self.store.count() < len(chunks):
                vectors = self.embeddings.embed_documents([c.text for c in chunks])
                if vectors:
                    self.store.reindex(chunks, vectors)
                    stats["qdrant_indexed"] = True
            stats["dense"] = self.embeddings.available or self.embeddings.load()
        else:
            log.warning("qdrant unreachable at startup — lexical-only retrieval")

        self.memory.purge_expired()
        log_event(log, "startup_index_done", **stats)
        return stats

    def reindex(self) -> dict:
        """Réindexation complète à chaud (POST /admin/reindex après édition de la KB)."""
        chunks = load_knowledge_base(Path(get_settings().knowledge_dir))
        self.lexical.build(chunks)
        indexed = 0
        vectors = self.embeddings.embed_documents([c.text for c in chunks])
        if vectors and self.store.ping():
            indexed = self.store.reindex(chunks, vectors)
        return {"chunks": len(chunks), "qdrant_indexed": indexed}

    # ── Conversation ─────────────────────────────────────────────────────────

    def greeting(self, lang: str) -> dict:
        lang = lang if lang in GREETINGS else "fr"
        return {"message": GREETINGS[lang], "suggestions": SUGGESTIONS[lang], "lang": lang}

    def _smalltalk(self, session_id: str | None, message: str):
        """Couche conversationnelle AVANT le RAG : bonjour/merci/ça va… reçoivent
        une réponse naturelle d'accueil, jamais un passage de la base documentaire.
        Retourne None si le message est une vraie question."""
        intent = detect_intent(message)
        if not intent:
            return None
        sid = session_id or self.memory.new_session()
        lang = detect_language(message)
        text, with_suggestions = reply_smalltalk(intent, lang)
        self.memory.append(sid, "user", message)
        self.memory.append(sid, "assistant", text)
        CHAT_MESSAGES.labels(lang=lang, provider="persona").inc()
        log_event(log, "chat_answered", lang=lang, provider="persona",
                  intent=intent, msg_chars=len(message))
        return {
            "session_id": sid, "answer": text, "lang": lang, "provider": "persona",
            "sources": [],
            "suggestions": SUGGESTIONS.get(lang, SUGGESTIONS["fr"])[:3] if with_suggestions else [],
        }

    async def _prepare(self, session_id: str | None, message: str):
        """Étapes communes chat/stream : session, langue, retrieval, provider, historique."""
        s = get_settings()
        sid = session_id or self.memory.new_session()
        lang = detect_language(message)
        # « Bonjour, ma question… » → seule la question part au retrieval
        chunks = self.retriever.retrieve(strip_greeting_prefix(message), lang)

        # Confiance : preuve lexicale (BM25 a matché des termes de la question)
        # OU similarité sémantique suffisante — sinon repli honnête "je ne sais pas".
        confident = any(
            "bm25" in c.get("origins", {}) or c.get("origins", {}).get("dense", 0) >= s.min_confidence
            for c in chunks
        )
        if not confident:
            chunks = []
        history = self.memory.history(sid, s.memory_max_turns)
        use_ollama = bool(chunks) and await self.ollama.is_available()
        provider = self.ollama if use_ollama else self.extractive
        return sid, lang, chunks, history, provider

    async def answer(self, session_id: str | None, message: str) -> dict:
        if (st := self._smalltalk(session_id, message)) is not None:
            return st
        start = time.perf_counter()
        sid, lang, chunks, history, provider = await self._prepare(session_id, message)

        if not chunks:
            text = NO_ANSWER.get(lang, NO_ANSWER["fr"])
            CHAT_NO_ANSWER.labels(lang=lang).inc()
            provider_name = "none"
        else:
            try:
                text = await provider.generate(message, chunks, history, lang)
                provider_name = provider.name
            except Exception:
                text = await self.extractive.generate(message, chunks, history, lang)
                provider_name = self.extractive.name

        self.memory.append(sid, "user", message)
        self.memory.append(sid, "assistant", text)

        latency = time.perf_counter() - start
        CHAT_MESSAGES.labels(lang=lang, provider=provider_name).inc()
        CHAT_LATENCY.observe(latency)
        log_event(log, "chat_answered", lang=lang, provider=provider_name,
                  latency_ms=round(latency * 1000), msg_chars=len(message),
                  sources=len(chunks))

        return {
            "session_id": sid, "answer": text, "lang": lang,
            "provider": provider_name,
            "sources": [{"title": c.get("title", ""), "section": c.get("section", ""),
                         "topic": c.get("topic", "")} for c in chunks],
            "suggestions": SUGGESTIONS.get(lang, SUGGESTIONS["fr"])[:3],
        }

    async def answer_stream(self, session_id: str | None, message: str) -> AsyncIterator[dict]:
        """Événements SSE : meta (session/lang) → token* → done (sources, suggestions)."""
        if (st := self._smalltalk(session_id, message)) is not None:
            yield {"event": "meta", "data": {"session_id": st["session_id"], "lang": st["lang"]}}
            yield {"event": "token", "data": {"t": st["answer"]}}
            yield {"event": "done", "data": {"sources": [], "suggestions": st["suggestions"],
                                             "provider": "persona"}}
            return
        start = time.perf_counter()
        sid, lang, chunks, history, provider = await self._prepare(session_id, message)
        yield {"event": "meta", "data": {"session_id": sid, "lang": lang}}

        full: list[str] = []
        if not chunks:
            text = NO_ANSWER.get(lang, NO_ANSWER["fr"])
            CHAT_NO_ANSWER.labels(lang=lang).inc()
            provider_name = "none"
            full.append(text)
            yield {"event": "token", "data": {"t": text}}
        else:
            provider_name = provider.name
            try:
                async for token in provider.stream(message, chunks, history, lang):
                    full.append(token)
                    yield {"event": "token", "data": {"t": token}}
            except Exception:
                provider_name = self.extractive.name
                full.clear()
                async for token in self.extractive.stream(message, chunks, history, lang):
                    full.append(token)
                    yield {"event": "token", "data": {"t": token}}

        text = "".join(full).strip()
        self.memory.append(sid, "user", message)
        self.memory.append(sid, "assistant", text)

        latency = time.perf_counter() - start
        CHAT_MESSAGES.labels(lang=lang, provider=provider_name).inc()
        CHAT_LATENCY.observe(latency)
        log_event(log, "chat_answered", lang=lang, provider=provider_name,
                  latency_ms=round(latency * 1000), msg_chars=len(message),
                  sources=len(chunks), streamed=True)

        yield {"event": "done", "data": {
            "sources": [{"title": c.get("title", ""), "section": c.get("section", "")} for c in chunks],
            "suggestions": SUGGESTIONS.get(lang, SUGGESTIONS["fr"])[:3],
            "provider": provider_name,
        }}

    # ── Santé ────────────────────────────────────────────────────────────────

    async def health(self) -> dict:
        qdrant_ok = self.store.ping()
        return {
            "status": "ok" if (qdrant_ok or self.lexical.size) else "degraded",
            "components": {
                "qdrant": "up" if qdrant_ok else "down",
                "embeddings": "up" if self.embeddings.available else "lexical-only",
                "bm25_chunks": self.lexical.size,
                "qdrant_points": self.store.count() if qdrant_ok else 0,
                "llm": "up" if await self.ollama.is_available() else "extractive-fallback",
            },
        }
