"""OptimisateurFlotteIA — hybrid 3-phase optimization engine (FICHE §8.1).

Phase 1 — Greedy heuristic        (initial feasible solution, < 100 ms)
Phase 2 — Genetic Algorithm       (global exploration, time-boxed)
Phase 3 — Local Search (swap/2-opt style reassignment, time-boxed)

The assignment problem here is a constrained variant of the Vehicle Routing
Problem (NP-Hard, §6.2): we look for a *good* plan in seconds, not the exact
optimum in hours.
"""

import logging
import random
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

import constraints as C
import scoring as S
from models import (AssignmentOut, DriverIn, MetricsOut, MissionIn,
                    OptimizeRequest, OptimizeResponse, UnassignedOut,
                    VehicleIn)

logger = logging.getLogger("fleet-optimizer")

Pair = Tuple[int, int]                 # (vehicle_idx, driver_idx)
Solution = Dict[int, Optional[Pair]]   # mission_idx → pair | None

GA_POPULATION = 40
GA_MAX_GENERATIONS = 60
GA_TIME_BUDGET_S = 1.5
LS_TIME_BUDGET_S = 0.8
GA_MUTATION_RATE = 0.15
GA_ELITE = 2


class OptimizationContext:
    """Precomputed data shared by all phases."""

    def __init__(self, req: OptimizeRequest):
        self.req = req
        self.missions = req.missions
        self.vehicles = req.vehicles
        self.drivers = req.drivers
        self.cons = req.constraints

        self.duration_min = [C.mission_duration_min(m, self.cons) for m in self.missions]
        self.intervals = [C.mission_interval(m, self.cons) for m in self.missions]

        # Driver hours already worked on each mission's day + busy windows,
        # computed from the recent-missions history sent by the caller.
        self.base_hours: Dict[int, float] = {i: 0.0 for i in range(len(self.drivers))}
        self.driver_busy: Dict[int, List[tuple]] = {i: [] for i in range(len(self.drivers))}
        self.vehicle_busy: Dict[int, List[tuple]] = {i: [] for i in range(len(self.vehicles))}
        self._load_history()

        # Static feasibility (licence, class, revision threshold) per mission
        self.feasible_pairs: List[List[Pair]] = []
        for m_idx, mission in enumerate(self.missions):
            pairs = []
            for v_idx, vehicle in enumerate(self.vehicles):
                if not C.class_ok(vehicle, mission):
                    continue
                if not C.maintenance_ok(vehicle, mission.distanceKm):
                    continue
                for d_idx, driver in enumerate(self.drivers):
                    if C.license_ok(driver, vehicle):
                        pairs.append((v_idx, d_idx))
            self.feasible_pairs.append(pairs)

        self.scorer = S.GlobalScorer(self.missions, self.vehicles, self.drivers,
                                     self.base_hours, self.duration_min)

    def _load_history(self):
        driver_by_id = {d.idEmployee: i for i, d in enumerate(self.drivers)}
        vehicle_by_id = {v.idVehicule: i for i, v in enumerate(self.vehicles)}
        batch_days = {m.dateDepart.date() for m in self.missions}

        for rm in self.req.recentMissions:
            if rm.statut.upper() == "ANNULEE":
                continue
            if rm.dateRetour and rm.dateRetour > rm.dateDepart:
                hours = (rm.dateRetour - rm.dateDepart).total_seconds() / 3600.0
            elif rm.distanceKm > 0:
                hours = rm.distanceKm / self.cons.averageSpeedKmh
            else:
                hours = 1.0
            hours = min(hours, self.cons.driverMaxWorkHoursPerDay)

            d_idx = driver_by_id.get(rm.employeeId) if rm.employeeId else None
            if d_idx is not None:
                # weekly hours feed workload balance; same-day hours feed HARD #4
                if rm.dateDepart.date() in batch_days:
                    self.base_hours[d_idx] += hours
                    end = rm.dateRetour or rm.dateDepart
                    self.driver_busy[d_idx].append((rm.dateDepart, end))
                else:
                    self.base_hours[d_idx] += hours / 7.0  # smoothed weekly load

            v_idx = vehicle_by_id.get(rm.vehiculeId) if rm.vehiculeId else None
            if v_idx is not None and rm.dateDepart.date() in batch_days and rm.dateRetour:
                self.vehicle_busy[v_idx].append((rm.dateDepart, rm.dateRetour))

    # ── Dynamic feasibility (depends on the partial solution) ────────────────

    def dynamically_feasible(self, solution: Solution, m_idx: int, pair: Pair) -> bool:
        v_idx, d_idx = pair
        interval = self.intervals[m_idx]
        mission_hours = self.duration_min[m_idx] / 60.0

        hours = self.base_hours.get(d_idx, 0.0)
        v_busy = list(self.vehicle_busy[v_idx])
        d_busy = list(self.driver_busy[d_idx])
        for other_idx, other_pair in solution.items():
            if other_idx == m_idx or other_pair is None:
                continue
            ov, od = other_pair
            if od == d_idx:
                hours += self.duration_min[other_idx] / 60.0
                d_busy.append(self.intervals[other_idx])
            if ov == v_idx:
                v_busy.append(self.intervals[other_idx])

        if not C.hours_ok(hours, mission_hours, self.cons):
            return False
        if not C.schedule_ok(interval, d_busy):
            return False
        if not C.schedule_ok(interval, v_busy):
            return False
        return True

    def repair(self, solution: Solution) -> Solution:
        """Drops assignments that became infeasible (used after GA crossover)."""
        repaired: Solution = {i: None for i in solution}
        order = sorted(solution.keys(),
                       key=lambda i: (-S.PRIORITY_WEIGHT.get(
                           self.missions[i].priorite.upper(), 1.0),
                           self.missions[i].dateDepart))
        for m_idx in order:
            pair = solution[m_idx]
            if pair is not None and self.dynamically_feasible(repaired, m_idx, pair):
                repaired[m_idx] = pair
        return repaired

    # ── Local pair score (greedy + confidence) ────────────────────────────────

    def pair_score(self, m_idx: int, pair: Pair, solution: Solution) -> float:
        v_idx, d_idx = pair
        mission = self.missions[m_idx]
        vehicle = self.vehicles[v_idx]
        driver = self.drivers[d_idx]

        max_fuel = self.scorer.max_fuel_per_mission[m_idx]
        fuel_norm = S.fuel_cost(mission, vehicle) / max_fuel if max_fuel > 0 else 0.0

        hours = self.base_hours.get(d_idx, 0.0) + sum(
            self.duration_min[i] / 60.0
            for i, p in solution.items() if p is not None and p[1] == d_idx)
        load_norm = min(1.0, hours / self.cons.driverMaxWorkHoursPerDay)

        return (0.55 * (1.0 - fuel_norm)
                + 0.30 * (1.0 - load_norm)
                + 0.15 * S.preference_score(driver, vehicle))


# ── Phase 1 — Greedy ──────────────────────────────────────────────────────────

def greedy(ctx: OptimizationContext) -> Solution:
    solution: Solution = {i: None for i in range(len(ctx.missions))}
    order = sorted(range(len(ctx.missions)),
                   key=lambda i: (-S.PRIORITY_WEIGHT.get(
                       ctx.missions[i].priorite.upper(), 1.0),
                       ctx.missions[i].dateDepart))
    for m_idx in order:
        best, best_score = None, -1.0
        for pair in ctx.feasible_pairs[m_idx]:
            if not ctx.dynamically_feasible(solution, m_idx, pair):
                continue
            score = ctx.pair_score(m_idx, pair, solution)
            if score > best_score:
                best, best_score = pair, score
        solution[m_idx] = best
    return solution


# ── Phase 2 — Genetic Algorithm ───────────────────────────────────────────────

def genetic(ctx: OptimizationContext, seed: Solution) -> Solution:
    n = len(ctx.missions)
    if n == 0:
        return seed

    def random_solution() -> Solution:
        sol: Solution = {i: None for i in range(n)}
        for m_idx in random.sample(range(n), n):
            candidates = [p for p in ctx.feasible_pairs[m_idx]
                          if ctx.dynamically_feasible(sol, m_idx, p)]
            if candidates:
                sol[m_idx] = random.choice(candidates)
        return sol

    def mutate(sol: Solution) -> Solution:
        child = dict(sol)
        for m_idx in range(n):
            if random.random() < GA_MUTATION_RATE and ctx.feasible_pairs[m_idx]:
                child[m_idx] = random.choice(ctx.feasible_pairs[m_idx] + [None])
        return ctx.repair(child)

    def crossover(a: Solution, b: Solution) -> Solution:
        child = {i: (a[i] if random.random() < 0.5 else b[i]) for i in range(n)}
        return ctx.repair(child)

    population = [seed] + [random_solution() for _ in range(GA_POPULATION - 1)]
    fitness = [ctx.scorer.evaluate(s) for s in population]
    deadline = time.monotonic() + GA_TIME_BUDGET_S

    for gen in range(GA_MAX_GENERATIONS):
        if time.monotonic() > deadline:
            logger.info("GA stopped at generation %d (time budget)", gen)
            break
        ranked = sorted(zip(fitness, range(len(population))),
                        key=lambda t: t[0], reverse=True)
        next_pop = [population[i] for _, i in ranked[:GA_ELITE]]

        def tournament() -> Solution:
            picks = random.sample(range(len(population)), min(3, len(population)))
            return population[max(picks, key=lambda i: fitness[i])]

        while len(next_pop) < GA_POPULATION:
            child = crossover(tournament(), tournament())
            if random.random() < 0.5:
                child = mutate(child)
            next_pop.append(child)

        population = next_pop
        fitness = [ctx.scorer.evaluate(s) for s in population]

    best_idx = max(range(len(population)), key=lambda i: fitness[i])
    return population[best_idx]


# ── Phase 3 — Local Search ────────────────────────────────────────────────────

def local_search(ctx: OptimizationContext, solution: Solution) -> Solution:
    best = dict(solution)
    best_score = ctx.scorer.evaluate(best)
    deadline = time.monotonic() + LS_TIME_BUDGET_S
    improved = True

    while improved and time.monotonic() < deadline:
        improved = False

        # Move 1 — try to place unassigned missions
        for m_idx, pair in list(best.items()):
            if pair is not None:
                continue
            for candidate in ctx.feasible_pairs[m_idx]:
                if ctx.dynamically_feasible(best, m_idx, candidate):
                    trial = dict(best); trial[m_idx] = candidate
                    score = ctx.scorer.evaluate(trial)
                    if score > best_score:
                        best, best_score, improved = trial, score, True
                        break

        # Move 2 — reassign each mission to a better pair (2-opt style)
        for m_idx, pair in list(best.items()):
            if time.monotonic() > deadline:
                break
            for candidate in ctx.feasible_pairs[m_idx]:
                if candidate == pair:
                    continue
                trial = dict(best); trial[m_idx] = None
                if not ctx.dynamically_feasible(trial, m_idx, candidate):
                    continue
                trial[m_idx] = candidate
                score = ctx.scorer.evaluate(trial)
                if score > best_score:
                    best, best_score, improved = trial, score, True
                    break

    return best


# ── Explainability (FICHE §1.3 / A.2) ────────────────────────────────────────

def build_reasoning(ctx: OptimizationContext, m_idx: int, pair: Pair) -> str:
    v_idx, d_idx = pair
    mission, vehicle, driver = ctx.missions[m_idx], ctx.vehicles[v_idx], ctx.drivers[d_idx]

    avg_cons = (sum(S.fuel_consumption(v) for v in ctx.vehicles)
                / max(1, len(ctx.vehicles)))
    cons_v = S.fuel_consumption(vehicle)
    cost = S.fuel_cost(mission, vehicle)

    projected = ctx.base_hours.get(d_idx, 0.0) + ctx.duration_min[m_idx] / 60.0
    avg_load = (sum(ctx.base_hours.values()) / max(1, len(ctx.drivers)))

    reasons = [
        f"Véhicule {vehicle.immatriculation or vehicle.idVehicule} "
        f"({vehicle.typeVehicule}) : {cons_v:.1f} L/100km "
        f"(moyenne flotte {avg_cons:.1f}) → carburant estimé {cost:.2f} TND",
        f"Chauffeur {driver.nom or driver.idEmployee} : charge projetée "
        f"{projected:.1f}h / {ctx.cons.driverMaxWorkHoursPerDay:.0f}h "
        f"(charge moyenne équipe {avg_load:.1f}h) → équilibrage respecté",
        f"Permis {(driver.categoriePermis or 'B')} compatible {vehicle.typeVehicule}",
    ]
    if mission.requiredVehicleClass:
        reasons.append(f"Classe requise {mission.requiredVehicleClass} couverte "
                       f"par {C.vehicle_class(vehicle)}")
    return " ; ".join(reasons)


def unassignment_reason(ctx: OptimizationContext, solution: Solution, m_idx: int) -> Tuple[str, str]:
    if not ctx.feasible_pairs[m_idx]:
        mission = ctx.missions[m_idx]
        has_vehicle = any(C.class_ok(v, mission) and C.maintenance_ok(v, mission.distanceKm)
                          for v in ctx.vehicles)
        if not has_vehicle:
            return "NO_FEASIBLE_VEHICLE", "Ajouter un véhicule compatible ou reporter la mission"
        return "NO_FEASIBLE_DRIVER", "Aucun chauffeur avec le permis requis — vérifier les permis"

    # Feasible statically but not dynamically → hours or schedule conflict
    mission_hours = ctx.duration_min[m_idx] / 60.0
    if all(not C.hours_ok(
            ctx.base_hours.get(d, 0.0)
            + sum(ctx.duration_min[i] / 60.0 for i, p in solution.items()
                  if p is not None and p[1] == d),
            mission_hours, ctx.cons)
            for _, d in ctx.feasible_pairs[m_idx]):
        return "DRIVER_HOURS_EXCEEDED", "Tous les chauffeurs atteignent la limite légale de 10h"
    return "SCHEDULE_CONFLICT", "Décaler l'heure de départ ou libérer une ressource"


# ── Entry point ───────────────────────────────────────────────────────────────

def optimize(req: OptimizeRequest) -> OptimizeResponse:
    started = time.monotonic()
    ctx = OptimizationContext(req)

    solution = greedy(ctx)
    logger.info("Phase 1 (greedy)      : score %.2f", ctx.scorer.evaluate(solution))
    solution = genetic(ctx, solution)
    logger.info("Phase 2 (genetic)     : score %.2f", ctx.scorer.evaluate(solution))
    solution = local_search(ctx, solution)
    final_score = ctx.scorer.evaluate(solution)
    logger.info("Phase 3 (local search): score %.2f", final_score)

    assignments: List[AssignmentOut] = []
    unassigned: List[UnassignedOut] = []
    warnings: List[str] = []
    total_fuel = 0.0
    projected_hours = dict(ctx.base_hours)

    for m_idx, pair in sorted(solution.items(),
                              key=lambda kv: ctx.missions[kv[0]].dateDepart):
        mission = ctx.missions[m_idx]
        if pair is None:
            reason, action = unassignment_reason(ctx, solution, m_idx)
            unassigned.append(UnassignedOut(
                missionId=mission.missionId, reason=reason, suggestedAction=action))
            continue

        v_idx, d_idx = pair
        vehicle, driver = ctx.vehicles[v_idx], ctx.drivers[d_idx]
        cost = S.fuel_cost(mission, vehicle)
        total_fuel += cost
        duration = ctx.duration_min[m_idx]
        projected_hours[d_idx] = projected_hours.get(d_idx, 0.0) + duration / 60.0

        # Confidence = local score of the chosen pair vs the best alternative
        scores = [ctx.pair_score(m_idx, p, solution) for p in ctx.feasible_pairs[m_idx]]
        chosen = ctx.pair_score(m_idx, pair, solution)
        confidence = round(min(1.0, chosen / max(scores)), 2) if scores and max(scores) > 0 else 0.5

        assignments.append(AssignmentOut(
            missionId=mission.missionId,
            vehicleId=vehicle.idVehicule,
            driverId=driver.idEmployee,
            vehicleImmatriculation=vehicle.immatriculation,
            driverName=driver.nom,
            estimatedDurationMin=duration,
            estimatedFuelCost=cost,
            estimatedDistance=mission.distanceKm,
            assignmentConfidence=confidence,
            assignmentReasoning=build_reasoning(ctx, m_idx, pair),
            estimatedDepartureTime=mission.dateDepart,
            estimatedArrivalTime=ctx.intervals[m_idx][1],
        ))

        if projected_hours[d_idx] > 0.85 * ctx.cons.driverMaxWorkHoursPerDay:
            warnings.append(
                f"Chauffeur {driver.nom or driver.idEmployee} atteint "
                f"{projected_hours[d_idx]:.1f}h / {ctx.cons.driverMaxWorkHoursPerDay:.0f}h — proche de la limite légale")
        if (vehicle.kilometrageProchainRevision
                and vehicle.kilometrage + mission.distanceKm
                    > 0.9 * vehicle.kilometrageProchainRevision):
            warnings.append(
                f"Véhicule {vehicle.immatriculation or vehicle.idVehicule} approche "
                f"du seuil de révision ({vehicle.kilometrage + mission.distanceKm:.0f} km "
                f"/ {vehicle.kilometrageProchainRevision:.0f} km)")

    n_received = len(ctx.missions)
    n_assigned = len(assignments)
    workloads = [projected_hours.get(i, 0.0) for i in range(len(ctx.drivers))]

    elapsed_ms = int((time.monotonic() - started) * 1000)
    logger.info("Optimization done: %d/%d missions assigned in %d ms (score %.1f)",
                n_assigned, n_received, elapsed_ms, final_score)

    return OptimizeResponse(
        optimizationId=f"opt-{uuid.uuid4().hex[:12]}",
        batchId=req.batchId or f"batch-{datetime.now(timezone.utc):%Y-%m-%d-%H%M}",
        timestamp=datetime.now(timezone.utc),
        executionTimeMs=elapsed_ms,
        optimizationScore=final_score,
        assignments=assignments,
        unassignedMissions=unassigned,
        metrics=MetricsOut(
            totalFuelCostEstimated=round(total_fuel, 2),
            totalMissionsAssigned=n_assigned,
            totalMissionsReceived=n_received,
            assignmentSuccessRate=round(n_assigned / n_received, 3) if n_received else 1.0,
            averageDriverWorkloadHours=round(sum(workloads) / len(workloads), 2) if workloads else 0.0,
            workloadStdDevHours=round(S.workload_stdev(workloads), 2),
        ),
        warnings=warnings,
    )
