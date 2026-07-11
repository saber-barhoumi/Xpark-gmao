"""
Routes système — sondes et observabilité (non rate-limitées).

GET /health  : état agrégé + détail par composant (qdrant, embeddings, llm).
GET /metrics : exposition Prometheus.
"""
from __future__ import annotations

from fastapi import APIRouter, Request, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.models.schemas import HealthResponse

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
async def health(request: Request):
    return await request.app.state.pipeline.health()


@router.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
