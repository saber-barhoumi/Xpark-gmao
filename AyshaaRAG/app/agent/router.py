"""
Routeur d'intentions — décide QUI répond : small talk, outil (API) ou RAG.

Stratégie hybride, dans cet ordre :
  1. Motifs déterministes trilingues (fr / en / darija) → fiables, instantanés,
     fonctionnent MÊME SANS LLM (production dégradée = production qui marche).
  2. Si aucun motif ne matche et qu'Ollama est disponible → classification LLM
     (un appel JSON court) pour les formulations inattendues.
  3. Sinon → RAG (dont le seuil de confiance donne déjà un « je ne sais pas »
     honnête plutôt qu'une hallucination).

L'extraction d'entités (villes pour le prix, email pour le reset) est
volontairement conservatrice : mieux vaut poser une question de suivi que
deviner faux — comportement d'un vrai employé.
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field

import httpx

from app.config import get_settings
from app.tools.pricing import known_cities, match_city

log = logging.getLogger("ayshaa.router")

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")


@dataclass
class Route:
    kind: str                                   # "tool" | "rag"
    tool: str | None = None
    params: dict = field(default_factory=dict)


# ── 1. Motifs déterministes trilingues ───────────────────────────────────────
# Chaque entrée : (nom d'outil, regex compilées). L'ordre = priorité.

def _rx(*patterns: str) -> list[re.Pattern]:
    return [re.compile(p, re.IGNORECASE) for p in patterns]


TOOL_PATTERNS: list[tuple[str, list[re.Pattern]]] = [
    ("where_is_my_truck", _rx(
        r"\bo[uù] (est|en est) (mon|ma|le|notre) (camion|colis|marchandise|livraison|v[ée]hicule)",
        r"\bsuiv(re|i) (mon|ma|le) (camion|colis|livraison)",
        r"\bwhere('s| is) (my|the|our) (truck|shipment|delivery|cargo|package)",
        r"\btrack (my|the) (truck|shipment|delivery|order)",
        r"\bwin (el |il )?(camion|kamyon|colis)", r"\bفين الكميون", r"\bوين الكميون",
    )),
    ("my_missions", _rx(
        r"\b(mes|ma liste de) missions?\b", r"\bmissions? (actives?|en cours)\b",
        r"\bmy (active )?missions?\b", r"\bshow (me )?my missions?\b",
        r"\bmissi[oö]net?i\b", r"\bمهماتي", r"\bel missions mte3i",
    )),
    ("my_quotations", _rx(
        r"\b(mon|mes|ma) (devis|demandes? de transport|r[ée]servations?)\b",
        r"\bo[uù] en est (mon|ma) (devis|demande|r[ée]servation)",
        r"\bmy (quote|quotation|reservation|transport request)s?\b",
        r"\bdevis mte3i", r"\bعرض السعر متاعي",
    )),
    ("price_estimate", _rx(
        r"\b(combien|quel(le)? (prix|co[uû]t|tarif))\b.*\b(transport|livraison|trajet|camion|co[uû]te)?",
        r"\b(prix|co[uû]t|tarif|estimation)\b.*\b(transport|livraison|trajet|de .+ [aà] .+)",
        r"\bhow much (does|will|is|would)\b", r"\b(price|cost|quote) (for|of|to)\b",
        r"\bch[7h]al\b", r"\b9add?ech\b", r"\bقداش", r"\bبقداش",
    )),
    ("password_reset", _rx(
        r"\b(oubli[ée]?|perdu) (mon |le )?mot de passe\b", r"\bmot de passe (oubli[ée]?|perdu)\b",
        r"\br[ée]initialiser (mon |le )?mot de passe\b",
        r"\bforgot (my )?password\b", r"\breset (my )?password\b",
        r"\bnsit (el )?(mot de passe|password|code)", r"\bنسيت (كلمة|الكود)",
    )),
    ("my_profile", _rx(
        r"\b(mon|voir mon) (compte|profil)\b", r"\bmes informations\b",
        r"\bmy (account|profile)\b", r"\bwho am i\b",
        r"\bcompte mte3i", r"\bحسابي",
    )),
    ("fleet_overview", _rx(
        r"\b(stats?|statistiques?|kpi|tableau de bord)\b.*\b(jour|missions?|flotte)?",
        r"\bcombien de missions (en cours|aujourd)", r"\b[ée]tat de la flotte\b",
        r"\b(dashboard|fleet) (stats?|status|overview)\b", r"\bhow many missions\b",
    )),
]


async def _extract_price_params(message: str) -> dict:
    """« de Tunis à Sfax », « Tunis - Sfax », « from Tunis to Sfax », « mn Tunis l Sfax »
    → {departure, arrival}. Les villes sont validées contre /cities du service de prix."""
    pairs = [
        re.compile(r"(?:de|depuis|from|mn|min)\s+([A-Za-zÀ-ÿ' ]{3,20}?)\s+(?:à|a|vers|to|l|lel)\s+([A-Za-zÀ-ÿ' ]{3,20})", re.IGNORECASE),
        re.compile(r"\b([A-Za-zÀ-ÿ']{3,15})\s*(?:-|→|—)\s*([A-Za-zÀ-ÿ']{3,15})\b"),
    ]
    for rx in pairs:
        if m := rx.search(message):
            dep = await match_city(m.group(1).strip())
            arr = await match_city(m.group(2).strip())
            if dep and arr:
                return {"departure": dep, "arrival": arr}
    # Dernier essai : deux villes connues citées n'importe où dans le message
    found: list[str] = []
    for w in re.findall(r"[A-Za-zÀ-ÿ']{3,15}", message):
        if (c := await match_city(w)) and c not in found:
            found.append(c)
    if len(found) >= 2:
        return {"departure": found[0], "arrival": found[1]}
    return {}


async def route_message(message: str, llm_available: bool) -> Route:
    """Point d'entrée du routeur (voir docstring du module pour la stratégie)."""
    for tool_name, patterns in TOOL_PATTERNS:
        if any(rx.search(message) for rx in patterns):
            params: dict = {}
            if tool_name == "price_estimate":
                params = await _extract_price_params(message)
            elif tool_name == "password_reset":
                if m := EMAIL_RE.search(message):
                    params = {"email": m.group(0)}
            log.info("route pattern → %s %s", tool_name, params)
            return Route(kind="tool", tool=tool_name, params=params)

    if llm_available:
        if (r := await _llm_classify(message)) is not None:
            return r
    return Route(kind="rag")


# ── 2. Classification LLM (secours pour les formulations libres) ─────────────

_CLASSIFY_PROMPT = """Tu es le routeur de l'assistante XPARK (transport, Tunisie).
Classe le message utilisateur dans UNE catégorie et réponds UNIQUEMENT en JSON compact :
{{"route":"rag"}} — question de connaissance générale sur XPARK (services, tarifs expliqués, FAQ, société)
{{"route":"tool","tool":"where_is_my_truck"}} — position/suivi de SA livraison en cours
{{"route":"tool","tool":"my_missions"}} — SES missions/transports
{{"route":"tool","tool":"my_quotations"}} — SES devis/demandes/réservations
{{"route":"tool","tool":"price_estimate","departure":"Ville","arrival":"Ville"}} — demande de prix chiffrée entre deux villes
{{"route":"tool","tool":"password_reset"}} — mot de passe oublié
{{"route":"tool","tool":"my_profile"}} — son compte/profil
{{"route":"tool","tool":"fleet_overview"}} — statistiques internes (staff)

Message : {msg}
JSON :"""


async def _llm_classify(message: str) -> Route | None:
    s = get_settings()
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            r = await client.post(f"{s.ollama_url}/api/chat", json={
                "model": s.ollama_model,
                "messages": [{"role": "user",
                              "content": _CLASSIFY_PROMPT.format(msg=message[:300])}],
                "stream": False,
                "options": {"temperature": 0, "num_predict": 60},
                "format": "json",
            })
            data = json.loads(r.json()["message"]["content"])
    except Exception as exc:
        log.debug("llm classify unavailable: %s", exc)
        return None

    if data.get("route") == "tool" and data.get("tool"):
        params = {}
        if data["tool"] == "price_estimate":
            dep = await match_city(str(data.get("departure", "")))
            arr = await match_city(str(data.get("arrival", "")))
            if dep and arr:
                params = {"departure": dep, "arrival": arr}
        log.info("route llm → %s %s", data["tool"], params)
        return Route(kind="tool", tool=data["tool"], params=params)
    return Route(kind="rag") if data.get("route") == "rag" else None
