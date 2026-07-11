"""
Routes conversationnelles — le contrat consommé par le widget frontoffice.

POST /api/v1/chat         → réponse complète (JSON)
POST /api/v1/chat/stream  → Server-Sent Events (meta → token* → done)
GET  /api/v1/greeting     → message d'accueil + suggestions dans la langue voulue

SSE plutôt que WebSocket : flux unidirectionnel serveur→client, passe les
proxies/CDN sans configuration, reconnexion native — le bon outil pour du
streaming de tokens.
"""
from __future__ import annotations

import json

from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest, ChatResponse, GreetingResponse

router = APIRouter(prefix="/api/v1", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request):
    pipeline = request.app.state.pipeline
    return await pipeline.answer(req.session_id, req.message.strip())


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest, request: Request):
    pipeline = request.app.state.pipeline

    async def sse():
        async for event in pipeline.answer_stream(req.session_id, req.message.strip()):
            yield f"event: {event['event']}\ndata: {json.dumps(event['data'], ensure_ascii=False)}\n\n"

    return StreamingResponse(sse(), media_type="text/event-stream",
                             headers={"X-Accel-Buffering": "no"})  # pas de buffering nginx


@router.get("/greeting", response_model=GreetingResponse)
async def greeting(request: Request, lang: str = Query(default="fr", pattern="^(fr|en|ar)$")):
    return request.app.state.pipeline.greeting(lang)
