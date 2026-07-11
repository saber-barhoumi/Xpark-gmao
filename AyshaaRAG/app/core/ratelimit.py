"""
Rate limiting par IP — fenêtre glissante en mémoire.

Portée : instance unique (1 worker). Pour un scaling horizontal, remplacer le
stockage par Redis (documenté dans docs/deployment.md) ; l'interface ne change
pas. Seules les routes de chat sont limitées : /health et /metrics doivent
rester accessibles aux sondes.
"""
import time
from collections import defaultdict, deque

from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.config import get_settings

LIMITED_PREFIXES = ("/api/v1/chat",)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith(LIMITED_PREFIXES):
            limit = get_settings().rate_limit_rpm
            ip = (request.headers.get("x-forwarded-for") or request.client.host or "?").split(",")[0].strip()
            now = time.monotonic()
            window = self._hits[ip]
            while window and now - window[0] > 60:
                window.popleft()
            if len(window) >= limit:
                return JSONResponse(status_code=429, content={
                    "error": "rate_limited",
                    "detail": "Trop de messages — patientez une minute.",
                })
            window.append(now)
        return await call_next(request)
