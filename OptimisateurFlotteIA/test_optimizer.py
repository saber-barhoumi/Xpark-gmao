"""Smoke test for the optimization engine — run with:  python test_optimizer.py

Scenario (mirrors the FICHE annexe A.1):
- 5 missions demain matin (dont 1 HIGH priority et 1 nécessitant un CAMION)
- 4 véhicules (berline sobre, berline gourmande, camion, van proche révision)
- 4 chauffeurs (1 déjà très chargé cette semaine, 1 seul permis C)

Expected behaviour:
- le camion (permis C) est réservé à la mission HEAVY_TRUCK
- le chauffeur surchargé reçoit moins de missions (équilibrage)
- la berline sobre est préférée à la gourmande (coût carburant)
- le van au-delà de son seuil de révision n'est jamais affecté
"""

from datetime import datetime, timedelta

from models import (DriverIn, MissionIn, OptimizationConstraints,
                    OptimizeRequest, RecentMission, VehicleIn)
from optimizer import optimize

TOMORROW = datetime.now().replace(hour=8, minute=0, second=0, microsecond=0) + timedelta(days=1)

missions = [
    MissionIn(missionId=1, villeDepart="Tunis", villeArrivee="Sousse", distanceKm=143,
              dateDepart=TOMORROW, priorite="HIGH"),
    MissionIn(missionId=2, villeDepart="Tunis", villeArrivee="Sfax", distanceKm=270,
              dateDepart=TOMORROW + timedelta(minutes=30),
              requiredVehicleClass="HEAVY_TRUCK"),
    MissionIn(missionId=3, villeDepart="Tunis", villeArrivee="Nabeul", distanceKm=67,
              dateDepart=TOMORROW + timedelta(hours=1)),
    MissionIn(missionId=4, villeDepart="Tunis", villeArrivee="Bizerte", distanceKm=65,
              dateDepart=TOMORROW + timedelta(hours=5)),
    MissionIn(missionId=5, villeDepart="Tunis", villeArrivee="Kairouan", distanceKm=160,
              dateDepart=TOMORROW + timedelta(hours=2)),
]

vehicles = [
    VehicleIn(idVehicule=10, immatriculation="200 TU 1234", marque="Peugeot", modele="301",
              typeVehicule="BERLINE", typeCarburant="DIESEL", consommationMoyenne=5.8,
              kilometrage=45_000, kilometrageProchainRevision=60_000),
    VehicleIn(idVehicule=11, immatriculation="210 TU 5678", marque="Nissan", modele="Patrol",
              typeVehicule="SUV", typeCarburant="ESSENCE", consommationMoyenne=13.5,
              kilometrage=80_000, kilometrageProchainRevision=95_000),
    VehicleIn(idVehicule=12, immatriculation="220 TU 9012", marque="Iveco", modele="Daily",
              typeVehicule="CAMION", typeCarburant="DIESEL", consommationMoyenne=18.0,
              kilometrage=120_000, kilometrageProchainRevision=140_000),
    VehicleIn(idVehicule=13, immatriculation="230 TU 3456", marque="Renault", modele="Trafic",
              typeVehicule="VAN", typeCarburant="DIESEL", consommationMoyenne=9.5,
              kilometrage=99_950, kilometrageProchainRevision=100_000),  # revision imminente
]

drivers = [
    DriverIn(idEmployee=100, nom="Mohamed Ben Ali", categoriePermis="B"),
    DriverIn(idEmployee=101, nom="Ahmed Trabelsi",  categoriePermis="B"),
    DriverIn(idEmployee=102, nom="Karim Souissi",   categoriePermis="C"),   # seul permis camion
    DriverIn(idEmployee=103, nom="Sami Gharbi",     categoriePermis="D"),
]

# Mohamed a déjà beaucoup travaillé cette semaine (~9h/j la veille)
recent = [
    RecentMission(employeeId=100, vehiculeId=10,
                  dateDepart=TOMORROW - timedelta(days=1),
                  dateRetour=TOMORROW - timedelta(days=1) + timedelta(hours=9),
                  distanceKm=600, statut="TERMINEE"),
]

req = OptimizeRequest(batchId="test-batch", missions=missions, vehicles=vehicles,
                      drivers=drivers, recentMissions=recent,
                      constraints=OptimizationConstraints())

plan = optimize(req)

print(f"\n=== PLAN — score {plan.optimizationScore}/100, "
      f"{plan.metrics.totalMissionsAssigned}/{plan.metrics.totalMissionsReceived} affectées, "
      f"{plan.executionTimeMs} ms ===")
for a in plan.assignments:
    print(f"  Mission {a.missionId}: {a.vehicleImmatriculation} + {a.driverName} "
          f"| fuel {a.estimatedFuelCost} TND | conf {a.assignmentConfidence}")
    print(f"      {a.assignmentReasoning}")
for u in plan.unassignedMissions:
    print(f"  Mission {u.missionId}: NON AFFECTEE ({u.reason}) → {u.suggestedAction}")
print("Warnings:", *plan.warnings, sep="\n  ")
print("Fuel total:", plan.metrics.totalFuelCostEstimated, "TND | workload stdev:",
      plan.metrics.workloadStdDevHours, "h")

# ── Assertions ────────────────────────────────────────────────────────────────
by_mission = {a.missionId: a for a in plan.assignments}

assert 2 in by_mission, "La mission HEAVY_TRUCK doit être affectée"
assert by_mission[2].vehicleId == 12, "Mission 2 doit recevoir le camion"
assert by_mission[2].driverId == 102, "Mission 2 doit recevoir le chauffeur permis C"

assert all(a.vehicleId != 13 for a in plan.assignments), \
    "Le van au seuil de révision ne doit jamais être affecté"

assert plan.metrics.assignmentSuccessRate >= 0.8, "Au moins 4/5 missions affectées"
assert plan.executionTimeMs < 5000, "Latence < 5s (FICHE §6.1)"
print("\nALL ASSERTIONS PASSED")
