"""Tests unitaires du scorer et de l'aggregator — run: python test_iboa.py
(sans dépendances externes : ni RabbitMQ ni PostgreSQL requis)
"""

from datetime import datetime, timezone

from aggregator import Aggregator
from models import BusinessEvent, OwnerPreferences
from scorer import classify, object_key, score_event

NOW = datetime.now(timezone.utc)


def evt(etype, severity="MEDIUM", data=None, ctx=None):
    return BusinessEvent(
        eventId=f"evt-{etype}-{id(data)}", timestamp=NOW, eventType=etype,
        severity=severity, sourceService="test",
        eventData=data or {}, context=ctx or {})


# ── Scoring (FICHE §5.1) ─────────────────────────────────────────────────────

# Panne véhicule "exemple fiche" : base 70 + mission 20 + PREMIUM 15 + coût 10 → 100 CRITIQUE
s = score_event(evt("xpark.fleet.vehicle-breakdown", "HIGH",
                    data={"vehicleId": 45, "estimatedRepairCost": 450,
                          "currentMission": {"missionId": 9876}},
                    ctx={"clientImportance": "PREMIUM"}))
assert s.classification == "CRITIQUE", f"attendu CRITIQUE, obtenu {s.classification} ({s.criticityScore})"
assert s.criticityScore >= 85
print(f"OK panne critique: {s.criticityScore}/100 CRITIQUE — {s.scoreBreakdown}")

# Panne simple sans contexte : base 70 + HIGH 10 = 80 IMPORTANT
s = score_event(evt("xpark.fleet.vehicle-breakdown", "HIGH", data={"vehicleId": 9}))
assert s.classification == "IMPORTANT", s.criticityScore
print(f"OK panne simple: {s.criticityScore}/100 IMPORTANT")

# Mission terminée : base 15 → INFO
s = score_event(evt("xpark.mission.task-completed", "LOW", data={"missionId": 1}))
assert s.classification == "INFO", s.criticityScore
print(f"OK mission terminée: {s.criticityScore}/100 INFO")

# Cash flow critique : base 90 → CRITIQUE
s = score_event(evt("xpark.finance.cash-flow-critical", "CRITICAL"))
assert s.classification == "CRITIQUE"
print(f"OK cash-flow: {s.criticityScore}/100 CRITIQUE")

# Nouveau client stratégique gros contrat: 30 + 15 + 20 = 65 IMPORTANT
s = score_event(evt("xpark.client.new-client", "LOW",
                    data={"contractMonthlyValue": 6000, "strategic": True}))
assert s.classification == "IMPORTANT", s.criticityScore
print(f"OK nouveau client stratégique: {s.criticityScore}/100 IMPORTANT")

# Classification bornes
assert classify(85) == "CRITIQUE" and classify(84) == "IMPORTANT"
assert classify(60) == "IMPORTANT" and classify(59) == "NORMAL"
assert classify(30) == "NORMAL" and classify(29) == "INFO"
print("OK bornes de classification 85/60/30")

# object_key
assert object_key(evt("x", data={"vehicleId": 45})) == "vehicleId=45"
assert object_key(evt("x", data={"missionId": 9})) == "missionId=9"
assert object_key(evt("x")) == "global"
print("OK object_key")


# ── Aggregation (FICHE §5.2) ─────────────────────────────────────────────────

prefs = OwnerPreferences()
agg = Aggregator()

# Jeu de donnees volontairement complet : il sert aussi aux tests de
# formatage plus bas, qui verifient la traduction de chaque intitule.
breakdown = score_event(evt("xpark.fleet.vehicle-breakdown", "HIGH",
                            data={"vehicleId": 45,
                                  "vehicleImmatriculation": "TN-1234-ABC",
                                  "breakdownDescription": "Moteur ne démarre plus",
                                  "currentDriver": "Ahmed Karim",
                                  "estimatedRepairCost": 450,
                                  "currentMission": {"missionId": 1}},
                            ctx={"clientImportance": "PREMIUM"}))

# R3: CRITIQUE → envoi immédiat
assert agg.decide(breakdown, "vehicleId=45", 0, prefs) == "SEND_NOW"
# R1: même panne même véhicule < 15 min → dédupliqué
assert agg.decide(breakdown, "vehicleId=45", 1, prefs) == "SUPPRESS_DUPLICATE"
# Autre véhicule → passe
assert agg.decide(breakdown, "vehicleId=46", 1, prefs) == "SEND_NOW"
print("OK R1 déduplication + R3 envoi immédiat CRITIQUE")

# R3: INFO → rapport quotidien seulement
info = score_event(evt("xpark.mission.task-completed", "LOW", data={"missionId": 2}))
assert agg.decide(info, "missionId=2", 1, prefs) == "DAILY_REPORT_ONLY"
print("OK R3 INFO → rapport quotidien")

# NORMAL → batch horaire
normal = score_event(evt("xpark.client.new-client", "LOW", data={"clientId": 7}))
assert normal.classification == "NORMAL"
assert agg.decide(normal, "clientId=7", 1, prefs) == "BATCH"
assert len(agg.batch_queue) == 1
print("OK R3 NORMAL → batch horaire")

# R2: 3+ événements même type en 30 min → regroupement (IMPORTANT non-critique)
agg2 = Aggregator()
delayed = lambda i: score_event(evt("xpark.mission.task-delayed", "HIGH",
                                    data={"missionId": 100 + i}))
assert agg2.decide(delayed(1), "missionId=101", 0, prefs) == "SEND_NOW"
assert agg2.decide(delayed(2), "missionId=102", 1, prefs) == "SEND_NOW"
assert agg2.decide(delayed(3), "missionId=103", 2, prefs) == "BATCH"   # 3e → regroupé
print("OK R2 regroupement thématique (3+ même type)")

# R4: fatigue — plus de 20 alertes/jour → batch sauf CRITIQUE
agg3 = Aggregator()
important = score_event(evt("xpark.fleet.insurance-expired", "HIGH", data={"vehicleId": 5}))
assert important.classification == "IMPORTANT"
assert agg3.decide(important, "vehicleId=5", 25, prefs) == "BATCH"
critique = score_event(evt("xpark.finance.cash-flow-critical", "CRITICAL"))
assert agg3.decide(critique, "global", 25, prefs) == "SEND_NOW"
print("OK R4 fatigue alertes (batch sauf CRITIQUE)")


# ── Formatters ────────────────────────────────────────────────────────────────

import formatters

#  Le destinataire est un exploitant : ce qu'il lit doit etre en francais
#  metier. Ces assertions verifient la traduction ET l'absence de jargon.

wa = formatters.format_whatsapp(breakdown)
assert "PANNE DE VÉHICULE" in wa, wa
assert "Immatriculation : TN-1234-ABC" in wa, wa
assert "xpark.fleet" not in wa, "nom technique d'evenement visible sur WhatsApp"

subject, html = formatters.format_email(breakdown)
assert "Panne de véhicule" in subject and "traitement immédiat" in subject, subject
assert "<table" in html

#  Intitules francais imposes, et non les noms de champs du flux.
for attendu in ("Immatriculation", "Description de la panne", "Identifiant véhicule",
                "Chauffeur assigné", "Coût estimé des réparations (TND)"):
    assert attendu in html, "intitule manquant : " + attendu

#  Aucune trace de debug : ni nom technique, ni service source, ni addition.
for interdit in ("xpark.fleet", "TestConsole", "Service source", "vehicleImmatriculation",
                 "breakdownDescription", "estimatedRepairCost", "+70", "Base "):
    assert interdit not in html, "jargon technique dans le courriel : " + interdit

#  Le niveau de gravite est explique en clair, pas par une somme.
assert "Pourquoi ce niveau de gravité" in html
assert "une mission en cours est directement affectée" in html
assert "Action recommandée" in html

#  Le logo est appele par piece jointe liee, jamais par une adresse web.
assert "cid:xpark-logo" in html
assert "<!--" not in html, "commentaire de gabarit laisse dans le message"

sub_b, html_b = formatters.format_batch_email([normal, info])
assert "2 faits" in sub_b, sub_b
assert "cid:xpark-logo" in html_b

pdf = formatters.build_daily_pdf([], [], {"eventsByClassification": {}})
assert pdf[:4] == b"%PDF"
xlsx = formatters.build_daily_excel([], [], {"eventsByClassification": {}, "alerts": []})
assert xlsx[:2] == b"PK"
print("OK formatters WhatsApp / Email / batch / PDF / Excel")


# ── Assets et gabarits ────────────────────────────────────────────────────────

import templates

assert templates.couleurs()["couleur-accent"] == "#C11425"
assert "Immatriculation" in templates.libelles()["champs"].values()
#  Un evenement inconnu ne doit pas faire echouer le formatage.
inconnu = formatters.format_email(score_event(evt("xpark.zzz.jamais-vu", "LOW")))
assert inconnu[1].count("{{") == 0, "marqueur non substitue pour un type inconnu"
print("OK assets : charte, libellés, gabarits, type inconnu")

print("\nALL IBOA UNIT TESTS PASSED")
