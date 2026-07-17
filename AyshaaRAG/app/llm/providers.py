"""
Providers de génération — orchestration LLM avec dégradation gracieuse.

Deux implémentations derrière la même interface :

 • OllamaProvider — LLM local (par défaut qwen2.5:3b-instruct, bon en
   français/anglais/arabe). Streaming natif. Aucun coût, aucune donnée ne
   sort de l'infrastructure — argument fort pour une entreprise.

 • ExtractiveProvider — repli SANS LLM : compose une réponse à partir des
   meilleurs chunks (déjà dans la langue de l'utilisateur, la KB étant
   trilingue). Le service reste utile même sans GPU/modèle : c'est une
   implémentation complète, pas un stub.

Le pipeline choisit : Ollama si activé ET joignable (health mis en cache
30 s, pattern circuit-breaker simplifié), sinon extractif.
"""
from __future__ import annotations

import json
import logging
import random
import re
import time
from typing import AsyncIterator, Protocol

import httpx

from app.config import get_settings
from app.core.metrics import COMPONENT_ERRORS
from app.prompts.library import EXTRACTIVE_INTRO, NO_ANSWER, build_llm_messages

log = logging.getLogger("ayshaa.providers")


class GenerationProvider(Protocol):
    name: str
    async def generate(self, question: str, chunks: list[dict],
                       history: list[dict], lang: str) -> str: ...
    def stream(self, question: str, chunks: list[dict],
               history: list[dict], lang: str) -> AsyncIterator[str]: ...


# ── Ollama ───────────────────────────────────────────────────────────────────

class OllamaProvider:
    name = "ollama"

    def __init__(self) -> None:
        self._healthy_until = 0.0
        self._known_healthy = False

    async def is_available(self) -> bool:
        """Health mis en cache 30 s pour ne pas sonder Ollama à chaque message."""
        s = get_settings()
        if not s.llm_enabled:
            return False
        if time.monotonic() < self._healthy_until:
            return self._known_healthy
        try:
            async with httpx.AsyncClient(timeout=3) as client:
                r = await client.get(f"{s.ollama_url}/api/tags")
                models = [m.get("name", "") for m in r.json().get("models", [])]
                self._known_healthy = r.status_code == 200 and any(
                    m.startswith(s.ollama_model.split(":")[0]) for m in models)
        except Exception:
            self._known_healthy = False
        self._healthy_until = time.monotonic() + 30
        return self._known_healthy

    async def generate(self, question, chunks, history, lang) -> str:
        parts = [tok async for tok in self.stream(question, chunks, history, lang)]
        return "".join(parts)

    async def stream(self, question, chunks, history, lang) -> AsyncIterator[str]:
        s = get_settings()
        payload = {
            "model": s.ollama_model,
            "messages": build_llm_messages(question, chunks, history, lang),
            "stream": True,
            "options": {"temperature": 0.3, "num_predict": 512},
        }
        try:
            async with httpx.AsyncClient(timeout=s.ollama_timeout) as client:
                async with client.stream("POST", f"{s.ollama_url}/api/chat", json=payload) as r:
                    r.raise_for_status()
                    async for line in r.aiter_lines():
                        if not line.strip():
                            continue
                        data = json.loads(line)
                        token = data.get("message", {}).get("content", "")
                        if token:
                            yield token
                        if data.get("done"):
                            return
        except Exception as exc:
            COMPONENT_ERRORS.labels(component="ollama").inc()
            log.warning("ollama stream failed: %s", exc)
            self._known_healthy = False
            self._healthy_until = time.monotonic() + 30
            raise


# ── Extractif (repli sans LLM) ───────────────────────────────────────────────

_BREADCRUMB_RE = re.compile(r"^\[[^\]]*\]\n?")
_KEYWORDS_RE = re.compile(r"\n?\[mots-clés:[^\]]*\]\s*$")


class ExtractiveProvider:
    name = "extractive"

    @staticmethod
    def _compose(question: str, chunks: list[dict], lang: str) -> str:
        if not chunks:
            return NO_ANSWER.get(lang, NO_ANSWER["fr"])
        # Privilégier les chunks déjà dans la langue de l'utilisateur
        same_lang = [c for c in chunks if c.get("lang") == lang]
        pool = same_lang or chunks

        # UN chunk fort ; un 2e uniquement s'il traite du MÊME sujet avec un
        # score proche (évite les réponses « collées » sans rapport entre elles).
        best = [pool[0]]
        if (len(pool) > 1 and pool[1].get("topic") == pool[0].get("topic")
                and pool[1].get("rrf_score", 0) >= 0.8 * pool[0].get("rrf_score", 1)):
            best.append(pool[1])

        bodies = []
        for c in best:
            body = _BREADCRUMB_RE.sub("", c["text"])
            body = _KEYWORDS_RE.sub("", body).strip()
            body = body.replace("**", "")   # markdown brut → texte lisible (écran + voix)
            bodies.append(body[:900])
        intro = random.choice(EXTRACTIVE_INTRO.get(lang, EXTRACTIVE_INTRO["fr"]))
        return f"{intro}\n\n" + "\n\n".join(bodies)

    async def generate(self, question, chunks, history, lang) -> str:
        return self._compose(question, chunks, lang)

    async def stream(self, question, chunks, history, lang) -> AsyncIterator[str]:
        """Streaming simulé par phrases — même UX côté widget quel que soit le provider."""
        text = self._compose(question, chunks, lang)
        for piece in re.split(r"(?<=[.!?؟\n])\s+", text):
            if piece:
                yield piece + " "
