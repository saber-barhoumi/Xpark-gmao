"""Routeur d'intentions — les motifs trilingues doivent router sans LLM ni réseau."""
import asyncio
import time

import app.tools.pricing as pricing
from app.agent.router import route_message

# Villes injectées dans le cache : aucun appel réseau pendant les tests
pricing._cities_cache = (time.monotonic() + 3600, ["Tunis", "Sfax", "Sousse", "Béja"])


def route(msg: str):
    return asyncio.run(route_message(msg, llm_available=False))


# ── Suivi du camion (fr / en / darija) ───────────────────────────────────────

def test_tracking_fr():
    assert route("Où est mon camion ?").tool == "where_is_my_truck"

def test_tracking_en():
    assert route("where is my truck right now?").tool == "where_is_my_truck"

def test_tracking_darija():
    assert route("win el camion mte3i").tool == "where_is_my_truck"


# ── Missions / devis ─────────────────────────────────────────────────────────

def test_missions_fr():
    assert route("montre-moi mes missions en cours").tool == "my_missions"

def test_missions_en():
    assert route("show my active missions").tool == "my_missions"

def test_quotations_fr():
    assert route("où en est mon devis ?").tool == "my_quotations"


# ── Prix + extraction de villes ──────────────────────────────────────────────

def test_price_with_cities_fr():
    r = route("combien coûte un transport de Tunis à Sfax ?")
    assert r.tool == "price_estimate"
    assert r.params == {"departure": "Tunis", "arrival": "Sfax"}

def test_price_accent_insensitive():
    r = route("prix du trajet de Beja à Sousse")
    assert r.params.get("departure") == "Béja" and r.params.get("arrival") == "Sousse"

def test_price_dash_syntax():
    assert route("how much is Tunis - Sfax?").params == {"departure": "Tunis", "arrival": "Sfax"}

def test_price_darija_no_cities_asks_followup():
    r = route("ch7al el prix?")
    assert r.tool == "price_estimate" and r.params == {}


# ── Compte ───────────────────────────────────────────────────────────────────

def test_password_fr_extracts_email():
    r = route("j'ai oublié mon mot de passe, mon email est ali@xpark.tn")
    assert r.tool == "password_reset" and r.params == {"email": "ali@xpark.tn"}

def test_profile_en():
    assert route("show my profile please").tool == "my_profile"


# ── Les questions de connaissance restent au RAG ─────────────────────────────

def test_knowledge_goes_to_rag():
    assert route("Quels services propose XPARK ?").kind == "rag"

def test_generic_english_rag():
    assert route("what payment methods do you accept?").kind == "rag"
