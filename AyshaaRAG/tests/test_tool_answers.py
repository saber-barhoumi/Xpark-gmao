"""Formatteurs de résultats d'outils — réponses correctes dans les 3 langues, sans LLM."""
from app.prompts.tool_answers import (AUTH_REQUIRED, FORMATTERS, fmt_my_missions,
                                      fmt_price_estimate, fmt_where_is_my_truck)

MISSIONS = [{"id": 28, "statut": "EN_COURS", "depart": "Bab Bhar",
             "arrivee": "Hammam Sousse", "chauffeur": "Mohamed Ben Ali", "vehicule": "120"}]
PRICE = {"departure": "Tunis", "arrival": "Sfax", "prix": 382.56,
         "distanceKm": 269.1, "dureeH": 3.59, "carburant": 159.31, "peage": 14.8}
TRUCK_LIVE = {"missionId": 28, "depart": "Bab Bhar", "arrivee": "Hammam Sousse",
              "chauffeur": "Mohamed Ben Ali", "vehicule": "120", "hasFix": True,
              "isFresh": True, "latitude": 36.79, "longitude": 10.17, "speedKmh": 72.0}


def test_all_tools_have_formatter():
    for name in ("my_missions", "my_quotations", "where_is_my_truck",
                 "price_estimate", "my_profile", "password_reset", "fleet_overview"):
        assert name in FORMATTERS


def test_missions_trilingual():
    for lang, marker in (("fr", "mission"), ("en", "mission"), ("ar", "مهمة")):
        out = fmt_my_missions(MISSIONS, lang)
        assert "#28" in out and "Mohamed Ben Ali" in out and marker in out


def test_price_keeps_figures():
    for lang in ("fr", "en", "ar"):
        out = fmt_price_estimate(PRICE, lang)
        assert "383" in out and "269" in out and "Tunis" in out and "Sfax" in out


def test_truck_live_gps_link():
    out = fmt_where_is_my_truck(TRUCK_LIVE, "fr")
    assert "36.79" in out and "🛰️" in out and "maps.google.com" in out


def test_truck_no_active():
    out = fmt_where_is_my_truck({"noActive": True, "pending": 2}, "en")
    assert "2" in out


def test_auth_required_trilingual():
    assert set(AUTH_REQUIRED) == {"fr", "en", "ar"}
    assert all(len(v) > 20 for v in AUTH_REQUIRED.values())
