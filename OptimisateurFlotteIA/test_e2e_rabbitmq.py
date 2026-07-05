"""E2E test: frontend flow → Mission.API → RabbitMQ → OptimisateurFlotteIA → plan → assign."""
import base64, hashlib, hmac, json, time, urllib.request, urllib.error

BASE = "http://localhost:5003/api"
KEY = b"XparkGMAO_SuperSecret_JWT_Key_2024_MustBe32CharsAtLeast!"

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def make_jwt() -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "sub": "1", "email": "e2e@test.tn", "role": "ADMIN",
        "userId": "1", "nom": "Test", "prenom": "E2E",
        "jti": "e2e-test", "exp": now + 3600, "iss": "XparkGMAO", "aud": "XparkGMAO",
    }
    signing = f"{b64url(json.dumps(header).encode())}.{b64url(json.dumps(payload).encode())}"
    sig = hmac.new(KEY, signing.encode(), hashlib.sha256).digest()
    return f"{signing}.{b64url(sig)}"

TOKEN = make_jwt()

def call(method: str, path: str, body=None):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read() or b"null")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"null")

# ── 1. Create 2 unassigned missions (auto-assign wizard flow) ────────────────
created = []
for i, (dep, arr, dist, req_class) in enumerate([
        ("Tunis", "Sousse", 143.0, "LIGHT_VEHICLE"),
        ("Tunis", "Sfax", 270.0, "HEAVY_TRUCK")]):
    status, mission = call("POST", "/missions", {
        # Non-overlapping so the single truck-licensed driver can CHAIN both missions
        "dateDepart": "2026-07-06T08:00:00" if i == 0 else "2026-07-06T13:00:00",
        "destination": arr, "kilometrageDepart": 0,
        "objetMission": f"E2E RabbitMQ test mission {i+1}",
        "villeDepart": dep, "villeArrivee": arr,
        "distanceEstimee": dist, "coutEstime": 100.0,
        "aiVehiculeTypeUsed": req_class,
        "bonCarburantAccorde": False, "verificationDocuments": False,
        "carteAutorouteRemise": False,
    })
    assert status == 201, f"create failed: {status} {mission}"
    assert mission["statut"] == "EN_ATTENTE", f"expected EN_ATTENTE got {mission['statut']}"
    assert mission["employeeId"] is None and mission["vehiculeId"] is None
    created.append(mission["idMission"])
print(f"1. Created missions EN_ATTENTE (unassigned): {created}")

# ── 2. Trigger optimization (publishes to RabbitMQ) ──────────────────────────
vehicles = [
    {"idVehicule": 14, "immatriculation": "115TUN114", "typeVehicule": "CAMION",
     "typeCarburant": "DIESEL", "consommationMoyenne": 12, "kilometrage": 20220},
    {"idVehicule": 15, "immatriculation": "120", "typeVehicule": "CAMION",
     "typeCarburant": "DIESEL", "consommationMoyenne": 20, "kilometrage": 4000},
]
drivers = [
    {"idEmployee": 1, "nom": "Saber BRH", "categoriePermis": "B"},
    {"idEmployee": 4, "nom": "kamel bouaziz", "categoriePermis": "C"},
]
status, res = call("POST", "/missions/optimize", {"vehicles": vehicles, "drivers": drivers})
assert status == 202, f"optimize trigger failed: {status} {res}"
batch_id = res["batchId"]
print(f"2. Optimization requested via RabbitMQ — batchId={batch_id}")

# ── 3. Poll for the plan (event round-trip) ──────────────────────────────────
plan = None
for attempt in range(30):
    time.sleep(1)
    status, body = call("GET", f"/missions/optimize/{batch_id}")
    if status == 200:
        plan = body
        break
    assert status == 202, f"unexpected poll status {status}: {body}"
assert plan, "plan never arrived (RabbitMQ round-trip failed)"
assert "error" not in plan, f"optimizer returned error: {plan.get('error')}"
print(f"3. Plan received after event round-trip: score={plan['optimizationScore']}, "
      f"{plan['metrics']['totalMissionsAssigned']}/{plan['metrics']['totalMissionsReceived']} assigned, "
      f"{plan['executionTimeMs']} ms engine time")
for a in plan["assignments"]:
    print(f"   Mission {a['missionId']} -> {a['vehicleImmatriculation']} + {a['driverName']} "
          f"(conf {a['assignmentConfidence']})")
for u in plan["unassignedMissions"]:
    print(f"   Mission {u['missionId']} UNASSIGNED: {u['reason']}")

# The HEAVY_TRUCK mission must get a CAMION + permis C driver
heavy = next((a for a in plan["assignments"] if a["missionId"] == created[1]), None)
assert heavy is not None, "HEAVY_TRUCK mission not assigned"
assert heavy["driverId"] == 4, "HEAVY_TRUCK mission must go to the permis-C driver"
# Both missions must be assigned (chained on the same driver, non-overlapping)
assert plan["metrics"]["totalMissionsAssigned"] == 2, "both missions should be assigned"

# ── 4. Apply one assignment and verify EN_COURS ──────────────────────────────
a = heavy
status, updated = call("PUT", f"/missions/{a['missionId']}/assign", {
    "vehiculeId": a["vehicleId"], "employeeId": a["driverId"],
    "vehiculeImmatriculation": a["vehicleImmatriculation"],
    "chauffeurNom": a["driverName"],
})
assert status == 200, f"assign failed: {status} {updated}"
assert updated["statut"] == "EN_COURS" and updated["vehiculeId"] == a["vehicleId"]
print(f"4. Assignment applied: mission {a['missionId']} EN_COURS with vehicle "
      f"{updated['vehiculeImmatriculation']} + {updated['chauffeurNom']}")

# ── 5. Cleanup test missions ─────────────────────────────────────────────────
for mid in created:
    status, _ = call("DELETE", f"/missions/{mid}")
    assert status == 200, f"cleanup failed for mission {mid}"
print(f"5. Cleanup done (deleted missions {created})")

print("\nALL E2E RABBITMQ ASSERTIONS PASSED")
