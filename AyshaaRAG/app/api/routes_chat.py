"""
Routes conversationnelles — le contrat consommé par le widget frontoffice.

POST /api/v1/chat          → réponse complète (JSON)
POST /api/v1/chat/stream   → Server-Sent Events (meta → token* → done)
GET  /api/v1/greeting      → message d'accueil + suggestions dans la langue voulue
GET  /api/v1/speech/config → configuration STT/TTS du widget (voir app/speech)

SSE plutôt que WebSocket : flux unidirectionnel serveur→client, passe les
proxies/CDN sans configuration, reconnexion native — le bon outil pour du
streaming de tokens.
"""
from __future__ import annotations

import json

from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest, ChatResponse, GreetingResponse
from app.speech.config import SPEECH_CONFIG

router = APIRouter(prefix="/api/v1", tags=["chat"])


def _bearer(request: Request) -> str | None:
    """JWT du portail transmis par le widget — donne à l'agent les capacités
    de l'utilisateur (Tool Calling au nom de l'appelant, RBAC des APIs)."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    return auth.removeprefix("Bearer ").strip() or None


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request):
    agent = request.app.state.agent
    return await agent.answer(req.session_id, req.message.strip(),
                              auth_token=_bearer(request))


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest, request: Request):
    agent = request.app.state.agent
    token = _bearer(request)

    async def sse():
        async for event in agent.answer_stream(req.session_id, req.message.strip(),
                                               auth_token=token):
            yield f"event: {event['event']}\ndata: {json.dumps(event['data'], ensure_ascii=False)}\n\n"

    return StreamingResponse(sse(), media_type="text/event-stream",
                             headers={"X-Accel-Buffering": "no"})  # pas de buffering nginx


@router.get("/greeting", response_model=GreetingResponse)
async def greeting(request: Request, lang: str = Query(default="fr", pattern="^(fr|en|ar)$")):
    return request.app.state.pipeline.greeting(lang)


@router.get("/speech/config")
async def speech_config():
    """Configuration vocale consommée par le widget (locales STT, voix TTS, modes)."""
    return SPEECH_CONFIG
