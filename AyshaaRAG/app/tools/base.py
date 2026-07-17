"""
Socle du Tool Calling — le contrat commun à tous les outils d'Ayshaa.

Un outil = une capacité « temps réel » de l'agent : interroger une API XPARK
(missions, suivi GPS, prix, profil…) au lieu de répondre de mémoire. Chaque
outil déclare :
  • name / description   → utilisés par le routeur d'intentions et le LLM ;
  • requires_auth        → l'outil agit AU NOM de l'utilisateur connecté
                           (le JWT du portail est transmis tel quel, Ayshaa
                           n'a aucun pouvoir propre : RBAC = celui des APIs) ;
  • run(ctx, **params)   → retourne un ToolResult (données structurées),
                           JAMAIS du texte final : la mise en mots est faite
                           par l'orchestrateur (LLM ou gabarits trilingues).

Sécurité : les outils sont en LECTURE seule ou déclenchent des actions déjà
exposées aux clients (ex. recover-password). Aucun outil n'écrit de données
métier — l'agent informe, il ne modifie pas les missions.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Protocol

import httpx

from app.config import get_settings

log = logging.getLogger("ayshaa.tools")


@dataclass
class ToolContext:
    """Ce que l'agent sait de l'appelant au moment d'exécuter un outil."""
    lang: str = "fr"
    auth_token: str | None = None       # JWT du portail (client / staff), optionnel
    session_id: str | None = None

    @property
    def auth_headers(self) -> dict:
        return {"Authorization": f"Bearer {self.auth_token}"} if self.auth_token else {}


@dataclass
class ToolResult:
    """Résultat structuré d'un outil — l'orchestrateur le met en mots."""
    ok: bool
    data: Any = None
    error: str | None = None            # code court : auth_required | api_error | not_found | missing_params
    missing_params: list[str] = field(default_factory=list)


class Tool(Protocol):
    name: str
    description: str
    requires_auth: bool
    async def run(self, ctx: ToolContext, **params) -> ToolResult: ...


async def api_get(url: str, ctx: ToolContext, **kwargs) -> httpx.Response:
    """GET avec le JWT de l'utilisateur et le timeout global des outils."""
    async with httpx.AsyncClient(timeout=get_settings().tools_timeout) as client:
        return await client.get(url, headers=ctx.auth_headers, **kwargs)


async def api_post(url: str, ctx: ToolContext, json: dict | None = None) -> httpx.Response:
    async with httpx.AsyncClient(timeout=get_settings().tools_timeout) as client:
        return await client.post(url, headers=ctx.auth_headers, json=json)


class ToolRegistry:
    """Annuaire des outils — l'unique point d'accès de l'orchestrateur."""

    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        self._tools[tool.name] = tool

    def get(self, name: str) -> Tool | None:
        return self._tools.get(name)

    def catalog(self) -> list[dict]:
        """Descriptif compact (pour le prompt de classification LLM et /health)."""
        return [{"name": t.name, "description": t.description,
                 "requires_auth": t.requires_auth} for t in self._tools.values()]

    async def execute(self, name: str, ctx: ToolContext, **params) -> ToolResult:
        tool = self._tools.get(name)
        if tool is None:
            return ToolResult(ok=False, error="not_found")
        if tool.requires_auth and not ctx.auth_token:
            return ToolResult(ok=False, error="auth_required")
        try:
            return await tool.run(ctx, **params)
        except httpx.HTTPStatusError as exc:
            log.warning("tool %s → HTTP %s", name, exc.response.status_code)
            if exc.response.status_code in (401, 403):
                return ToolResult(ok=False, error="auth_required")
            return ToolResult(ok=False, error="api_error")
        except Exception as exc:                      # réseau, timeout, JSON…
            log.warning("tool %s failed: %s", name, exc)
            return ToolResult(ok=False, error="api_error")
