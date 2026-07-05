"""E2E IBOA contre la stack Docker — run: python test_e2e_iboa.py

Vérifie le pipeline complet :
  événement → RabbitMQ (exchange xpark.ai) → scoring → agrégation
  → alerte (simulée) → persistence PostgreSQL → API dashboard → rapports PDF/Excel
"""

import json
import time
import urllib.request

BASE = "http://localhost:5008"


def call(method: str, path: str, body=None):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        raw = res.read()
        ctype = res.headers.get("Content-Type", "")
        return res.status, (json.loads(raw) if "json" in ctype else raw)


# ── 1. Health ─────────────────────────────────────────────────────────────────
status, health = call("GET", "/health")
assert status == 200 and health["status"] == "healthy"
assert health["rabbitmqConnected"] is True, "IBOA doit être connecté à RabbitMQ"
print(f"1. Health OK — RabbitMQ connecté, WhatsApp={health['whatsappMode']}, Email={health['emailMode']}")

# ── 1b. Configurer le propriétaire AVANT les alertes ─────────────────────────
status, prefs = call("GET", "/preferences")
prefs["whatsappNumber"] = "+21699000111"
prefs["email"] = "proprietaire@xpark.tn"
status, _ = call("PUT", "/preferences", prefs)
assert status == 200
print("1b. Préférences propriétaire configurées (WhatsApp + Email)")

# ── 2. Panne critique (exemple FICHE §3.1) → alerte WhatsApp + Email ─────────
status, res = call("POST", "/test-event", {
    "eventType": "xpark.fleet.vehicle-breakdown", "severity": "HIGH",
    "eventData": {
        "vehicleId": 4545, "vehicleImmatriculation": "TN-1234-ABC",
        "breakdownDescription": "Moteur ne démarre plus (test E2E)",
        "estimatedRepairCost": 450.0,
        "currentMission": {"missionId": 9876, "clientName": "TransFlow Logistics"}},
    "context": {"clientImportance": "PREMIUM"}})
assert status == 200 and res["published"]
event_id = res["eventId"]
print(f"2. Événement critique publié sur le bus: {event_id}")

time.sleep(2)  # laisser le consumer traiter

status, body = call("GET", "/events?limit=10")
evt = next((e for e in body["events"] if e["eventId"] == event_id), None)
assert evt, "l'événement doit être persisté"
assert evt["classification"] == "CRITIQUE", f"attendu CRITIQUE: {evt}"
assert evt["criticityScore"] >= 85
print(f"3. Scoring OK: {evt['criticityScore']}/100 CRITIQUE — {evt['scoreBreakdown']}")

status, body = call("GET", "/alerts?limit=10")
mine = [a for a in body["alerts"] if a["eventId"] == event_id]
channels = {a["deliveryChannel"] for a in mine}
assert "WHATSAPP" in channels and "EMAIL" in channels, f"canaux: {channels}"
assert all(a["alertStatus"] in ("SENT", "SENT_SIMULATED") for a in mine), mine
wa = next(a for a in mine if a["deliveryChannel"] == "WHATSAPP")
assert "ALERTE CRITIQUE" in wa["messageContent"], "le message WhatsApp doit être formaté"
print(f"4. Alertes émises sur {sorted(channels)} — statuts {[a['alertStatus'] for a in mine]}")

# ── 3. Déduplication (§5.2 R1): même panne même véhicule → SUPPRESSED ────────
status, res2 = call("POST", "/test-event", {
    "eventType": "xpark.fleet.vehicle-breakdown", "severity": "HIGH",
    "eventData": {"vehicleId": 4545, "vehicleImmatriculation": "TN-1234-ABC",
                  "estimatedRepairCost": 450.0,
                  "currentMission": {"missionId": 9876}},
    "context": {"clientImportance": "PREMIUM"}})
time.sleep(2)
status, body = call("GET", "/alerts?limit=10")
dup = [a for a in body["alerts"] if a["eventId"] == res2["eventId"]]
assert dup and all(a["alertStatus"] == "SUPPRESSED" for a in dup), dup
print("5. Déduplication OK: doublon supprimé (aucun spam)")

# ── 4. Événement INFO → rapport quotidien seulement, pas d'alerte ────────────
status, res3 = call("POST", "/test-event", {
    "eventType": "xpark.mission.task-completed", "severity": "LOW",
    "eventData": {"missionId": 777001, "destination": "Sousse", "coutTotal": 120.5}})
time.sleep(2)
status, body = call("GET", "/alerts?limit=20")
assert not any(a["eventId"] == res3["eventId"] for a in body["alerts"]), \
    "INFO ne doit générer aucune alerte"
status, body = call("GET", "/events?limit=20")
evt3 = next(e for e in body["events"] if e["eventId"] == res3["eventId"])
assert evt3["classification"] == "INFO"
print("6. INFO OK: persisté pour le rapport quotidien, aucune alerte envoyée")

# ── 5. Stats + rapports PDF/Excel ─────────────────────────────────────────────
status, stats = call("GET", "/stats")
assert stats["eventsByClassification"].get("CRITIQUE", 0) >= 1
print(f"7. Stats du jour: {stats['eventsByClassification']}")

status, pdf = call("GET", "/reports/daily.pdf")
assert status == 200 and bytes(pdf[:4]) == b"%PDF", "PDF invalide"
status, xlsx = call("GET", "/reports/daily.xlsx")
assert status == 200 and bytes(xlsx[:2]) == b"PK", "Excel invalide"
print(f"8. Rapport PDF ({len(pdf)} octets) + Excel ({len(xlsx)} octets) générés")

# ── 6. Préférences persistées ─────────────────────────────────────────────────
status, saved = call("GET", "/preferences")
assert saved["whatsappNumber"] == "+21699000111"
print("9. Préférences propriétaire persistées")

print("\nALL IBOA E2E TESTS PASSED")
