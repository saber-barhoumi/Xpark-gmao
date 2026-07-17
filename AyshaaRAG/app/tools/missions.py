"""
Outils Mission.API — les missions et devis DE L'UTILISATEUR CONNECTÉ.

Réutilise les endpoints clients existants (RBAC côté API, jamais contourné) :
  GET /api/missions/my                 → missions du client (JWT requis)
  GET /api/missions/demandes/my        → demandes de transport / devis du client
"""
from __future__ import annotations

from app.config import get_settings
from app.tools.base import ToolContext, ToolResult, api_get


class MyMissionsTool:
    name = "my_missions"
    description = ("Missions de transport de l'utilisateur connecté : statut, trajet, "
                   "dates, chauffeur, véhicule. Ex : « mes missions », « my active missions ».")
    requires_auth = True

    async def run(self, ctx: ToolContext, statut: str | None = None) -> ToolResult:
        r = await api_get(f"{get_settings().mission_api_url}/api/missions/my", ctx)
        r.raise_for_status()
        missions = r.json()
        if statut:
            missions = [m for m in missions if m.get("statut") == statut]
        # Compact : uniquement ce qui sert la réponse (pas de fuite de champs internes)
        return ToolResult(ok=True, data=[{
            "id": m.get("idMission"),
            "statut": m.get("statut"),
            "depart": m.get("villeDepart"),
            "arrivee": m.get("villeArrivee") or m.get("destination"),
            "dateDepart": m.get("dateDepart"),
            "chauffeur": m.get("chauffeurNom"),
            "vehicule": m.get("vehiculeImmatriculation"),
        } for m in missions[:10]])


class MyQuotationsTool:
    name = "my_quotations"
    description = ("Demandes de transport / devis de l'utilisateur : statut du devis "
                   "(à chiffrer, envoyé, accepté), prix propose. Ex : « où en est mon devis ? ».")
    requires_auth = True

    async def run(self, ctx: ToolContext) -> ToolResult:
        r = await api_get(f"{get_settings().mission_api_url}/api/missions/demandes/my", ctx)
        r.raise_for_status()
        return ToolResult(ok=True, data=[{
            "id": d.get("idTransportRequest"),
            "statut": d.get("statut"),
            "depart": d.get("villeDepart"),
            "arrivee": d.get("villeArrivee"),
            "estimationIA": d.get("aiEstimatedPrice"),
            "prixDevis": d.get("finalPrice"),
            "missionId": d.get("missionId"),
        } for d in r.json()[:10]])
