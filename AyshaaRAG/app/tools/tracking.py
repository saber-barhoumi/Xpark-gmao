"""
Outil de suivi temps réel — « Où est mon camion ? ».

Enchaîne deux endpoints existants (aucune logique dupliquée) :
  1. GET /api/missions/my                     → mission EN_COURS du client
  2. GET /api/tracking/mission/{id}/live      → dernier fix GPS (app XPARK Driver)

`CanRead` côté Mission.API autorise le client propriétaire : Ayshaa transmet
simplement le JWT, elle ne voit que ce que l'utilisateur verrait lui-même.
"""
from __future__ import annotations

from app.config import get_settings
from app.tools.base import ToolContext, ToolResult, api_get


class WhereIsMyTruckTool:
    name = "where_is_my_truck"
    description = ("Position GPS en direct du camion de la mission EN COURS de "
                   "l'utilisateur + fraîcheur du signal. Ex : « où est mon camion ? », "
                   "« where is my truck », « win el camion »." )
    requires_auth = True

    async def run(self, ctx: ToolContext) -> ToolResult:
        s = get_settings()
        r = await api_get(f"{s.mission_api_url}/api/missions/my", ctx)
        r.raise_for_status()
        actives = [m for m in r.json() if m.get("statut") == "EN_COURS"]
        if not actives:
            en_attente = [m for m in r.json() if m.get("statut") == "EN_ATTENTE"]
            return ToolResult(ok=True, data={"noActive": True,
                                             "pending": len(en_attente)})

        m = actives[0]
        live = await api_get(
            f"{s.mission_api_url}/api/tracking/mission/{m['idMission']}/live", ctx)
        fix = live.json() if live.status_code == 200 else {}
        return ToolResult(ok=True, data={
            "missionId": m.get("idMission"),
            "depart": m.get("villeDepart"),
            "arrivee": m.get("villeArrivee") or m.get("destination"),
            "chauffeur": m.get("chauffeurNom"),
            "vehicule": m.get("vehiculeImmatriculation"),
            "hasFix": bool(fix.get("hasFix")),
            "isFresh": bool(fix.get("isFresh")),
            "latitude": fix.get("latitude"),
            "longitude": fix.get("longitude"),
            "speedKmh": fix.get("speedKmh"),
            "ageSeconds": fix.get("ageSeconds"),
        })
