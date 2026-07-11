"""
Sécurité du service :
 - endpoints admin protégés par clé (X-Admin-Key, comparaison temps constant) ;
 - en-têtes de sécurité sur toutes les réponses ;
 - le service est PUBLIC en lecture chat (visiteurs du site) mais borné par
   le rate-limit (core/ratelimit.py) et la validation stricte des entrées.
"""
import hmac

from fastapi import Header, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.config import get_settings


async def require_admin_key(x_admin_key: str = Header(default="")) -> None:
    """Dépendance FastAPI pour les routes /admin/*."""
    expected = get_settings().admin_api_key
    if not hmac.compare_digest(x_admin_key.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Clé admin invalide.")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Cache-Control", "no-store")
        return response
