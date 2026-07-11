"""
Ayshaa RAG — point d'entrée FastAPI.

Assemblage : logging JSON → middlewares (CORS restreint, rate-limit,
en-têtes sécurité) → routes → pipeline construit dans le lifespan
(indexation de la base de connaissances au démarrage).
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_admin import router as admin_router
from app.api.routes_chat import router as chat_router
from app.api.routes_system import router as system_router
from app.config import get_settings
from app.core.errors import register_error_handlers
from app.core.logging import setup_logging
from app.core.ratelimit import RateLimitMiddleware
from app.core.security import SecurityHeadersMiddleware
from app.rag.pipeline import AyshaaPipeline

log = logging.getLogger("ayshaa.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    pipeline = AyshaaPipeline()
    pipeline.startup_index()
    app.state.pipeline = pipeline
    log.info("Ayshaa ready")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(settings.log_level)

    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description="Assistante virtuelle RAG de XPARK — trilingue (fr / en / darija).",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "X-Admin-Key"],
    )
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)

    register_error_handlers(app)
    app.include_router(chat_router)
    app.include_router(admin_router)
    app.include_router(system_router)
    return app


app = create_app()
