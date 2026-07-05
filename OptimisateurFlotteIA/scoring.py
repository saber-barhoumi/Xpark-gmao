"""Multi-objective scoring (FICHE_TECHNIQUE §5.2 / §5.3).

Score_Optimization =
      0.40 × (1 - FuelCost_Normalized)
    + 0.30 × OnTimeAssignment_Score        (adaptation of TravelTime_Normalized:
                                            departure times are fixed, so the time
                                            objective becomes "assign every mission
                                            inside its window")
    + 0.15 × WorkloadBalance_Score         = 1 / (1 + Variance(HoursPerDriver))
    + 0.10 × (1 - IdleTime_Penalty)
    + 0.05 × PreferenceScore

Fuel prices and GMAO fuel mapping are identical to CalculateurPrixTrajetIA so
both AI services produce consistent cost figures.
"""

from statistics import pvariance, pstdev
from typing import Dict, List, Optional

from constraints import vehicle_class, GMAO_VEHICLE_MAP
from models import DriverIn, MissionIn, VehicleIn

# Same constants as CalculateurPrixTrajetIA/main.py
GMAO_FUEL_MAP: Dict[str, str] = {
    "DIESEL":     "Diesel",
    "ESSENCE":    "Petrol",
    "HYBRIDE":    "Diesel",
    "ELECTRIQUE": "Diesel",
    "GPL":        "Petrol",
}
FUEL_PRICE: Dict[str, float] = {"Diesel": 1.85, "Petrol": 1.99}

DEFAULT_FUEL_CONSUMPTION: Dict[str, float] = {
    "LIGHT_VEHICLE": 7.5,
    "VAN":           11.0,
    "FOURGON":       13.0,
    "HEAVY_TRUCK":   32.0,
}

PRIORITY_WEIGHT: Dict[str, float] = {"LOW": 0.5, "NORMAL": 1.0, "HIGH": 1.5, "URGENT": 2.0}


def fuel_consumption(vehicle: VehicleIn) -> float:
    if vehicle.consommationMoyenne and vehicle.consommationMoyenne > 0:
        return vehicle.consommationMoyenne
    return DEFAULT_FUEL_CONSUMPTION[vehicle_class(vehicle)]


def fuel_cost(mission: MissionIn, vehicle: VehicleIn) -> float:
    """Estimated fuel cost in TND for this mission with this vehicle."""
    fuel = GMAO_FUEL_MAP.get(vehicle.typeCarburant.upper(), "Diesel")
    return round(mission.distanceKm * fuel_consumption(vehicle) / 100.0 * FUEL_PRICE[fuel], 2)


def preference_score(driver: DriverIn, vehicle: VehicleIn) -> float:
    """Soft §5.2 'Respect Driver Preferences' — we have no stored preferences,
    so reward exact licence/vehicle fit (a B-licence driver in a light vehicle
    is a better match than a CE-licence driver 'wasted' on a berline)."""
    cat = (driver.categoriePermis or "B").upper()
    vtype = vehicle.typeVehicule.upper()
    exact = {
        "A": vtype == "MOTO",
        "B": vtype in ("BERLINE", "SUV", "UTILITAIRE", "VAN", "AUTRE"),
        "BE": vtype in ("BERLINE", "SUV", "UTILITAIRE", "VAN", "AUTRE"),
        "E": vtype in ("BERLINE", "SUV", "UTILITAIRE", "VAN", "AUTRE"),
        "C": vtype == "CAMION",
        "CE": vtype == "CAMION",
        "D": vtype in ("MINIBUS", "BUS"),
    }.get(cat, False)
    return 1.0 if exact else 0.5


def workload_balance_score(hours_per_driver: List[float]) -> float:
    """§5.3 — WorkloadBalance_Score = 1 / (1 + Variance(HoursPerDriver))."""
    if len(hours_per_driver) < 2:
        return 1.0
    return 1.0 / (1.0 + pvariance(hours_per_driver))


def workload_stdev(hours_per_driver: List[float]) -> float:
    if len(hours_per_driver) < 2:
        return 0.0
    return pstdev(hours_per_driver)


class GlobalScorer:
    """Evaluates a full solution against the §5.3 objective function.

    A solution is a dict {mission_index: (vehicle_index, driver_index) | None}.
    """

    def __init__(self, missions: List[MissionIn], vehicles: List[VehicleIn],
                 drivers: List[DriverIn], base_hours: Dict[int, float],
                 duration_min: List[int]):
        self.missions = missions
        self.vehicles = vehicles
        self.drivers = drivers
        self.base_hours = base_hours          # driver idx → hours already worked today
        self.duration_min = duration_min      # per-mission duration
        # Worst plausible fuel cost per mission = most thirsty compatible figure,
        # used to normalise FuelCost (§5.3 FuelCost_Normalized = actual / max expected)
        self.max_fuel_per_mission = [
            max((fuel_cost(m, v) for v in vehicles), default=1.0) or 1.0
            for m in missions
        ]
        self.total_priority = sum(
            PRIORITY_WEIGHT.get(m.priorite.upper(), 1.0) for m in missions) or 1.0

    def evaluate(self, solution: Dict[int, Optional[tuple]]) -> float:
        """Returns the global score in [0, 100]."""
        total_fuel, max_fuel = 0.0, 0.0
        assigned_priority = 0.0
        pref_scores: List[float] = []
        hours = {d_idx: h for d_idx, h in self.base_hours.items()}
        driver_intervals: Dict[int, List[tuple]] = {}

        for m_idx, pair in solution.items():
            mission = self.missions[m_idx]
            max_fuel += self.max_fuel_per_mission[m_idx]
            if pair is None:
                # An unassigned mission is charged its worst-case fuel cost so
                # that dropping expensive missions can never beat assigning them
                # (external subcontracting / opportunity cost).
                total_fuel += self.max_fuel_per_mission[m_idx]
                continue
            v_idx, d_idx = pair
            total_fuel += fuel_cost(mission, self.vehicles[v_idx])
            assigned_priority += PRIORITY_WEIGHT.get(mission.priorite.upper(), 1.0)
            pref_scores.append(preference_score(self.drivers[d_idx], self.vehicles[v_idx]))
            hours[d_idx] = hours.get(d_idx, 0.0) + self.duration_min[m_idx] / 60.0
            driver_intervals.setdefault(d_idx, []).append(
                (mission.dateDepart, self.duration_min[m_idx]))

        # 0.40 — fuel
        fuel_norm = total_fuel / max_fuel if max_fuel > 0 else 0.0
        # 0.30 — on-time assignment weighted by priority (HIGH/URGENT first, §5.2)
        on_time = assigned_priority / self.total_priority
        # 0.15 — workload balance across ALL available drivers
        all_hours = [hours.get(i, self.base_hours.get(i, 0.0))
                     for i in range(len(self.drivers))]
        balance = workload_balance_score(all_hours)
        # 0.10 — idle time between consecutive missions of the same driver
        idle_penalty = self._idle_penalty(driver_intervals)
        # 0.05 — preferences
        pref = sum(pref_scores) / len(pref_scores) if pref_scores else 0.5

        score = (0.40 * (1.0 - fuel_norm)
                 + 0.30 * on_time
                 + 0.15 * balance
                 + 0.10 * (1.0 - idle_penalty)
                 + 0.05 * pref)
        return round(score * 100.0, 2)

    def _idle_penalty(self, driver_intervals: Dict[int, List[tuple]]) -> float:
        """IdleTime_Penalty = total gap minutes / total span minutes."""
        total_gap, total_span = 0.0, 0.0
        for intervals in driver_intervals.values():
            if len(intervals) < 2:
                continue
            ordered = sorted(intervals, key=lambda t: t[0])
            for (start_a, dur_a), (start_b, _) in zip(ordered, ordered[1:]):
                gap = (start_b - start_a).total_seconds() / 60.0 - dur_a
                total_gap += max(0.0, gap)
            span = ((ordered[-1][0] - ordered[0][0]).total_seconds() / 60.0
                    + ordered[-1][1])
            total_span += max(1.0, span)
        return min(1.0, total_gap / total_span) if total_span > 0 else 0.0
