"""
Outil de tarification — le MÊME CalculateurPrixTrajetIA (:8000) que le
formulaire de réservation et le back office : une seule logique de prix
dans tout XPARK (cohérence garantie, voir frontoffice aiService).

Public (pas d'auth) : GET /cities · GET /distance · POST /predict.
La liste des villes est mise en cache pour l'extraction d'entités du routeur.
"""
from __future__ import annotations

import time
import unicodedata

import httpx

from app.config import get_settings
from app.tools.base import ToolContext, ToolResult

_cities_cache: tuple[float, list[str]] = (0.0, [])


def _fold(s: str) -> str:
    """minuscules + sans accents — pour comparer « Béja » et « beja »."""
    return "".join(c for c in unicodedata.normalize("NFD", s.lower())
                   if unicodedata.category(c) != "Mn")


async def known_cities() -> list[str]:
    """Villes connues du modèle de prix (cache 10 min) — sert aussi au routeur."""
    global _cities_cache
    ts, cities = _cities_cache
    if cities and time.monotonic() - ts < 600:
        return cities
    try:
        async with httpx.AsyncClient(timeout=get_settings().tools_timeout) as client:
            r = await client.get(f"{get_settings().pricing_api_url}/cities")
            cities = r.json().get("cities", [])
            _cities_cache = (time.monotonic(), cities)
    except Exception:
        pass
    return _cities_cache[1]


async def match_city(word: str) -> str | None:
    """Rapproche un mot du message d'une ville connue (insensible aux accents)."""
    folded = _fold(word)
    for c in await known_cities():
        if _fold(c) == folded:
            return c
    return None


class PriceEstimateTool:
    name = "price_estimate"
    description = ("Estimation du prix d'un transport entre deux villes tunisiennes "
                   "via l'IA de tarification XPARK. Paramètres : departure, arrival, "
                   "vehicle_type (optionnel). Ex : « combien coûte Tunis-Sfax ? ».")
    requires_auth = False

    async def run(self, ctx: ToolContext, departure: str | None = None,
                  arrival: str | None = None, vehicle_type: str | None = None) -> ToolResult:
        missing = [p for p, v in (("departure", departure), ("arrival", arrival)) if not v]
        if missing:
            return ToolResult(ok=False, error="missing_params", missing_params=missing)

        s = get_settings()
        from datetime import datetime, timedelta
        payload = {
            "departure": departure, "arrival": arrival,
            "date_depart": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT09:00"),
            "vehicle_type_gmao": vehicle_type or "CAMION",
            "has_autoroute": True, "cargo_weight": 0, "passenger_count": 1,
        }
        async with httpx.AsyncClient(timeout=s.tools_timeout) as client:
            r = await client.post(f"{s.pricing_api_url}/predict", json=payload)
        if r.status_code == 404:
            return ToolResult(ok=False, error="not_found",
                              data={"departure": departure, "arrival": arrival})
        r.raise_for_status()
        d = r.json()
        return ToolResult(ok=True, data={
            "departure": departure, "arrival": arrival,
            "prix": d.get("predicted_cost_tnd"),
            "distanceKm": d.get("distance_km"),
            "dureeH": d.get("travel_hours"),
            "vehicule": d.get("vehicle_type_used"),
            "carburant": d.get("fuel_cost_tnd"),
            "peage": d.get("toll_cost_tnd"),
        })
