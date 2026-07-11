"""
Gestion d'erreurs uniforme : toute erreur sort en JSON {error, detail, request_id}.

Hiérarchie volontairement courte — un service RAG a peu de classes d'échec :
entrée invalide (422 géré par FastAPI), dépendance indisponible (503),
non autorisé (401/403), et le reste (500, loggé avec stack trace).
"""
import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

log = logging.getLogger("ayshaa.errors")


class DependencyUnavailable(Exception):
    """Qdrant / Ollama / embeddings injoignables — le client peut réessayer."""

    def __init__(self, component: str, detail: str = ""):
        self.component = component
        self.detail = detail
        super().__init__(f"{component} unavailable: {detail}")


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DependencyUnavailable)
    async def dep_handler(request: Request, exc: DependencyUnavailable):
        rid = str(uuid.uuid4())[:8]
        log.warning("dependency unavailable", extra={"extra_fields": {
            "request_id": rid, "component": exc.component, "detail": exc.detail}})
        return JSONResponse(status_code=503, content={
            "error": "service_degraded",
            "detail": f"Le composant {exc.component} est momentanément indisponible.",
            "request_id": rid,
        })

    @app.exception_handler(Exception)
    async def unhandled_handler(request: Request, exc: Exception):
        rid = str(uuid.uuid4())[:8]
        log.exception("unhandled error", extra={"extra_fields": {"request_id": rid}})
        return JSONResponse(status_code=500, content={
            "error": "internal_error",
            "detail": "Une erreur interne est survenue.",
            "request_id": rid,
        })
