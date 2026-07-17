"""
AyshaaAgent — l'employée virtuelle de XPARK (LLM + RAG + Tool Calling).

C'est l'unique objet que l'API connaisse désormais. Pour chaque message :

    message ── small talk ? ──────────────► réponse persona
        │
        ├─ routeur d'intentions (agent/router.py)
        │       │
        │       ├─ "tool"  ► exécution API (tools/) au nom de l'utilisateur
        │       │           └─ mise en mots : gabarits trilingues (toujours)
        │       │                            + LLM disponible ? reformulation naturelle
        │       │
        │       └─ "rag"   ► pipeline RAG existant (Qdrant + BM25 + seuil de
        │                    confiance + Ollama/extractif) — inchangé
        ▼
    mémoire de session (SQLite) + réponse {texte, langue, sources, intent}

Garantie anti-hallucination : les réponses « données vivantes » proviennent
exclusivement des APIs (le LLM ne fait que reformuler des faits fournis) et
les réponses « connaissance » exclusivement de la base documentaire (seuil de
confiance → « je ne sais pas » honnête).
"""
from __future__ import annotations

import logging
import time
from typing import AsyncIterator

from app.agent.language import detect_language
from app.agent.router import Route, route_message
from app.agent.smalltalk import detect_intent, reply_smalltalk
from app.core.logging import log_event
from app.core.metrics import CHAT_LATENCY, CHAT_MESSAGES
from app.prompts.library import SUGGESTIONS
from app.prompts.tool_answers import API_ERROR, AUTH_REQUIRED, FOLLOWUPS, FORMATTERS
from app.rag.pipeline import AyshaaPipeline
from app.tools.analytics import FleetOverviewTool
from app.tools.base import ToolContext, ToolRegistry
from app.tools.iam import MyProfileTool, PasswordResetTool
from app.tools.missions import MyMissionsTool, MyQuotationsTool
from app.tools.pricing import PriceEstimateTool
from app.tools.tracking import WhereIsMyTruckTool

log = logging.getLogger("ayshaa.agent")


def build_registry() -> ToolRegistry:
    reg = ToolRegistry()
    for tool in (MyMissionsTool(), MyQuotationsTool(), WhereIsMyTruckTool(),
                 PriceEstimateTool(), MyProfileTool(), PasswordResetTool(),
                 FleetOverviewTool()):
        reg.register(tool)
    return reg


class AyshaaAgent:
    """Façade agent : possède le pipeline RAG et le registre d'outils."""

    def __init__(self) -> None:
        self.pipeline = AyshaaPipeline()
        self.tools = build_registry()

    # Délégations conservées pour les routes system/admin existantes
    def startup_index(self) -> dict: return self.pipeline.startup_index()
    def reindex(self) -> dict: return self.pipeline.reindex()
    def greeting(self, lang: str) -> dict: return self.pipeline.greeting(lang)

    async def health(self) -> dict:
        h = await self.pipeline.health()
        h["components"]["tools"] = [t["name"] for t in self.tools.catalog()]
        return h

    # ── Cœur de l'agent ──────────────────────────────────────────────────────

    async def answer(self, session_id: str | None, message: str,
                     auth_token: str | None = None) -> dict:
        # 1. Small talk (bonjour/merci/ça va) → persona, jamais le RAG
        if (st := self.pipeline._smalltalk(session_id, message)) is not None:
            st["intent"] = "smalltalk"
            return st

        # 2. Routage : outil temps réel ou connaissance documentaire ?
        lang = detect_language(message)
        route = await route_message(message, await self.pipeline.ollama.is_available())

        if route.kind == "tool":
            return await self._answer_tool(session_id, message, lang, route, auth_token)

        # 3. RAG (comportement historique, inchangé)
        result = await self.pipeline.answer(session_id, message)
        result["intent"] = "rag"
        return result

    async def _answer_tool(self, session_id: str | None, message: str, lang: str,
                           route: Route, auth_token: str | None) -> dict:
        start = time.perf_counter()
        sid = session_id or self.pipeline.memory.new_session()
        ctx = ToolContext(lang=lang, auth_token=auth_token, session_id=sid)
        result = await self.tools.execute(route.tool or "", ctx, **route.params)

        if result.error == "auth_required":
            text = AUTH_REQUIRED[lang]
        elif result.error == "missing_params":
            # Question de suivi (comportement d'employé : demander, pas deviner)
            text = FOLLOWUPS.get(route.tool or "", API_ERROR)[lang]
        elif not result.ok and result.error != "not_found":
            text = API_ERROR[lang]
        else:
            text = FORMATTERS[route.tool](result.data, lang)   # type: ignore[index]
            # Reformulation naturelle par le LLM quand il est là — les FAITS
            # restent ceux de l'API (le gabarit est fourni comme source unique).
            if await self.pipeline.ollama.is_available():
                text = await self._polish(message, text, lang) or text

        self.pipeline.memory.append(sid, "user", message)
        self.pipeline.memory.append(sid, "assistant", text)
        latency = time.perf_counter() - start
        CHAT_MESSAGES.labels(lang=lang, provider=f"tool:{route.tool}").inc()
        CHAT_LATENCY.observe(latency)
        log_event(log, "chat_answered", lang=lang, provider=f"tool:{route.tool}",
                  latency_ms=round(latency * 1000), ok=result.ok, error=result.error)

        return {
            "session_id": sid, "answer": text, "lang": lang,
            "provider": f"tool:{route.tool}", "intent": "tool",
            "tool": route.tool, "sources": [],
            "suggestions": SUGGESTIONS.get(lang, SUGGESTIONS["fr"])[:3],
        }

    async def _polish(self, question: str, factual: str, lang: str) -> str | None:
        """Demande au LLM de rendre la réponse plus naturelle SANS ajouter de faits."""
        import httpx
        from app.config import get_settings
        s = get_settings()
        lang_name = {"fr": "français", "en": "English", "ar": "الدارجة التونسية"}[lang]
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.post(f"{s.ollama_url}/api/chat", json={
                    "model": s.ollama_model,
                    "messages": [
                        {"role": "system", "content":
                         f"Tu es Ayshaa, employée XPARK. Reformule la réponse factuelle en {lang_name}, "
                         "ton chaleureux et professionnel. INTERDIT d'ajouter, retirer ou modifier "
                         "le moindre chiffre, lien ou fait. Garde les emojis et les listes."},
                        {"role": "user", "content": f"Question : {question}\nRéponse factuelle :\n{factual}"},
                    ],
                    "stream": False, "options": {"temperature": 0.3, "num_predict": 400},
                })
                out = r.json()["message"]["content"].strip()
                # Garde-fou : si le LLM a « perdu » un chiffre clé, on garde le gabarit
                import re
                nums = re.findall(r"\d{2,}", factual)
                if all(n in out for n in nums[:4]):
                    return out
        except Exception:
            pass
        return None

    # ── Streaming SSE ────────────────────────────────────────────────────────

    async def answer_stream(self, session_id: str | None, message: str,
                            auth_token: str | None = None) -> AsyncIterator[dict]:
        """Outils : réponse en un bloc (l'appel API est déjà rapide).
        RAG : streaming token par token du pipeline (inchangé)."""
        lang = detect_language(message)
        if detect_intent(message) is None:
            route = await route_message(message, await self.pipeline.ollama.is_available())
            if route.kind == "tool":
                result = await self._answer_tool(session_id, message, lang, route, auth_token)
                yield {"event": "meta", "data": {"session_id": result["session_id"],
                                                 "lang": result["lang"]}}
                yield {"event": "token", "data": {"t": result["answer"]}}
                yield {"event": "done", "data": {"sources": [], "provider": result["provider"],
                                                 "suggestions": result["suggestions"]}}
                return
        async for event in self.pipeline.answer_stream(session_id, message):
            yield event
