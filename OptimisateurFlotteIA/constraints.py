"""Hard constraints (FICHE_TECHNIQUE §5.1).

A mission can NEVER be assigned to a (vehicle, driver) pair that violates one
of these rules. Soft preferences (fuel, workload…) live in scoring.py.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from models import DriverIn, MissionIn, OptimizationConstraints, VehicleIn

# Same GMAO → model-class mapping as CalculateurPrixTrajetIA/main.py
GMAO_VEHICLE_MAP: Dict[str, str] = {
    "BERLINE":    "LIGHT_VEHICLE",
    "SUV":        "LIGHT_VEHICLE",
    "MOTO":       "LIGHT_VEHICLE",
    "AUTRE":      "LIGHT_VEHICLE",
    "UTILITAIRE": "FOURGON",
    "MINIBUS":    "VAN",
    "VAN":        "VAN",
    "CAMION":     "HEAVY_TRUCK",
    "BUS":        "HEAVY_TRUCK",
}

# Capacity ranking: a vehicle can serve a mission requiring its class or below
CLASS_RANK: Dict[str, int] = {
    "LIGHT_VEHICLE": 1,
    "VAN":           2,
    "FOURGON":       3,
    "HEAVY_TRUCK":   4,
}

# Which GMAO vehicle types each licence category is allowed to drive.
# Simplified Tunisian licence hierarchy: C/D/E holders also hold B rights.
_LIGHT = {"BERLINE", "SUV", "UTILITAIRE", "VAN", "AUTRE"}
LICENSE_COVERS: Dict[str, set] = {
    "A":  {"MOTO"},
    "B":  _LIGHT,
    "BE": _LIGHT,
    "E":  _LIGHT,
    "C":  _LIGHT | {"CAMION"},
    "CE": _LIGHT | {"CAMION"},
    "D":  _LIGHT | {"MINIBUS", "BUS"},
}


def vehicle_class(vehicle: VehicleIn) -> str:
    return GMAO_VEHICLE_MAP.get(vehicle.typeVehicule.upper(), "LIGHT_VEHICLE")


def class_ok(vehicle: VehicleIn, mission: MissionIn) -> bool:
    """HARD #2 — vehicle capacity class must cover the mission requirement."""
    if not mission.requiredVehicleClass:
        return True
    required = CLASS_RANK.get(mission.requiredVehicleClass.upper())
    if required is None:
        return True
    return CLASS_RANK[vehicle_class(vehicle)] >= required


def license_ok(driver: DriverIn, vehicle: VehicleIn) -> bool:
    """HARD #3 — driver licence category must cover the vehicle type."""
    cat = (driver.categoriePermis or "B").upper()
    allowed = LICENSE_COVERS.get(cat, _LIGHT)
    return vehicle.typeVehicule.upper() in allowed


def maintenance_ok(vehicle: VehicleIn, mission_distance: float) -> bool:
    """HARD #1 — vehicle must not cross its revision threshold during the mission.

    The /vehicules/disponibles endpoint already excludes EN_MAINTENANCE /
    HORS_SERVICE; here we additionally block vehicles whose odometer would
    exceed the next-revision kilometre threshold.
    """
    if vehicle.kilometrageProchainRevision and vehicle.kilometrageProchainRevision > 0:
        if vehicle.kilometrage + mission_distance > vehicle.kilometrageProchainRevision:
            return False
    return True


def mission_duration_min(mission: MissionIn, cons: OptimizationConstraints) -> int:
    """Estimated mission duration in minutes (same speed model as the predictor)."""
    if mission.dureeEstimeeMin and mission.dureeEstimeeMin > 0:
        return mission.dureeEstimeeMin
    if mission.distanceKm > 0:
        return max(15, round(mission.distanceKm / cons.averageSpeedKmh * 60))
    return 60  # conservative default when distance unknown


def mission_interval(
    mission: MissionIn, cons: OptimizationConstraints
) -> Tuple[datetime, datetime]:
    """Occupation window [départ, arrivée + pause] (HARD #8)."""
    start = mission.dateDepart
    end = start + timedelta(minutes=mission_duration_min(mission, cons)
                            + cons.pauseBetweenMissionsMin)
    return start, end


def overlaps(a: Tuple[datetime, datetime], b: Tuple[datetime, datetime]) -> bool:
    return a[0] < b[1] and b[0] < a[1]


def schedule_ok(
    interval: Tuple[datetime, datetime],
    busy: List[Tuple[datetime, datetime]],
) -> bool:
    """HARD #5/#8 — no chronological overlap with existing occupations."""
    return not any(overlaps(interval, other) for other in busy)


def hours_ok(
    hours_already: float,
    mission_hours: float,
    cons: OptimizationConstraints,
) -> bool:
    """HARD #4 — legal daily work-hour limit (default 10h/day)."""
    return hours_already + mission_hours <= cons.driverMaxWorkHoursPerDay + 1e-9
