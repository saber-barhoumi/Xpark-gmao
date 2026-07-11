"""
Routes d'administration — protégées par X-Admin-Key (voir core/security.py).

POST /api/v1/admin/reindex : réindexation à chaud après édition de knowledge/.
GET  /api/v1/admin/stats   : volumétrie (chunks, points Qdrant, mémoire purgée).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.core.security import require_admin_key
from app.models.schemas import ReindexResponse

router = APIRouter(prefix="/api/v1/admin", tags=["admin"],
                   dependencies=[Depends(require_admin_key)])


@router.post("/reindex", response_model=ReindexResponse)
async def reindex(request: Request):
    return request.app.state.pipeline.reindex()


@router.get("/stats")
async def stats(request: Request):
    pipeline = request.app.state.pipeline
    purged = pipeline.memory.purge_expired()
    return {
        "bm25_chunks": pipeline.lexical.size,
        "qdrant_points": pipeline.store.count(),
        "memory_rows_purged": purged,
    }
