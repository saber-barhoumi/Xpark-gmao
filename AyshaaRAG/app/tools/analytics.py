"""
Outil analytique — statistiques temps réel pour le STAFF.

Réservé aux rôles de direction (le RBAC est celui des APIs : un client qui
demande « les stats » recevra un refus propre, son JWT n'ayant pas accès à
GET /api/missions ni GET /api/vehicules).

Agrège deux endpoints existants — aucun endpoint nouveau, aucune duplication
de logique métier :
  GET mission-api /api/missions     → répartition par statut
  GET fleet-api   /api/vehicules    → flotte par statut
"""
from __future__ import annotations

from collections import Counter

from app.config import get_settings
from app.tools.base import ToolContext, ToolResult, api_get


class FleetOverviewTool:
    name = "fleet_overview"
    description = ("Statistiques temps réel (staff uniquement) : missions par statut, "
                   "état de la flotte. Ex : « combien de missions en cours ? », "
                   "« stats du jour », « fleet status ».")
    requires_auth = True

    async def run(self, ctx: ToolContext) -> ToolResult:
        s = get_settings()
        rm = await api_get(f"{s.mission_api_url}/api/missions", ctx)
        rm.raise_for_status()
        missions = rm.json()
        par_statut = Counter(m.get("statut", "?") for m in missions)

        vehicules: Counter = Counter()
        try:
            rv = await api_get(f"{s.fleet_api_url}/api/vehicules", ctx,
                               params={"pageSize": 1000})
            body = rv.json()
            for v in (body.get("data") or body.get("items") or []):
                vehicules[v.get("statut", "?")] += 1
        except Exception:
            pass                        # la flotte est un bonus, pas un bloqueur

        return ToolResult(ok=True, data={
            "missionsTotal": len(missions),
            "missionsParStatut": dict(par_statut),
            "vehiculesParStatut": dict(vehicules),
        })
