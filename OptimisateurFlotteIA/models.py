"""Pydantic I/O models for OptimisateurFlotteIA.

Input mirrors the data already exposed by Mission.API / Fleet.API / IAM.API
(the frontend gathers it and posts a self-contained payload).
Output mirrors the FICHE_TECHNIQUE §4 "OptimizationPlanGenerated" contract.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ── Input ─────────────────────────────────────────────────────────────────────

class MissionIn(BaseModel):
    missionId: int
    villeDepart: str = ""
    villeArrivee: str = ""
    distanceKm: float = 0.0
    dateDepart: datetime
    dureeEstimeeMin: Optional[int] = None          # computed from distance if absent
    requiredVehicleClass: Optional[str] = None     # LIGHT_VEHICLE | VAN | FOURGON | HEAVY_TRUCK
    priorite: str = "NORMAL"                       # LOW | NORMAL | HIGH | URGENT
    objetMission: str = ""


class VehicleIn(BaseModel):
    idVehicule: int
    immatriculation: str = ""
    marque: str = ""
    modele: str = ""
    typeVehicule: str = "BERLINE"                  # GMAO enum (BERLINE, CAMION, VAN…)
    typeCarburant: str = "DIESEL"                  # GMAO enum (DIESEL, ESSENCE…)
    consommationMoyenne: float = 0.0               # L/100km
    kilometrage: float = 0.0
    nombrePlaces: int = 0
    chargeUtileKg: float = 0.0
    kilometrageProchainRevision: Optional[float] = None
    dateProchaineRevision: Optional[datetime] = None


class DriverIn(BaseModel):
    idEmployee: int
    nom: str = ""
    numeroMatricule: str = ""
    categoriePermis: Optional[str] = None          # A | B | C | D | E | BE | CE


class RecentMission(BaseModel):
    """Mission history entry used to compute driver workload (last 7 days)."""
    employeeId: Optional[int] = None
    vehiculeId: Optional[int] = None
    dateDepart: datetime
    dateRetour: Optional[datetime] = None
    distanceKm: float = 0.0
    statut: str = ""


class OptimizationConstraints(BaseModel):
    driverMaxWorkHoursPerDay: float = 10.0         # legal limit (FICHE §5.1-4)
    pauseBetweenMissionsMin: int = 15              # mandatory pause (FICHE §5.1-8)
    averageSpeedKmh: float = 75.0                  # same speed model as CalculateurPrixTrajetIA
    prioritizeMinFuelConsumption: bool = True
    balanceWorkloadEqually: bool = True


class OptimizeRequest(BaseModel):
    batchId: str = ""
    missions: List[MissionIn]
    vehicles: List[VehicleIn]
    drivers: List[DriverIn]
    recentMissions: List[RecentMission] = Field(default_factory=list)
    constraints: OptimizationConstraints = Field(default_factory=OptimizationConstraints)


# ── Output (FICHE_TECHNIQUE §4) ──────────────────────────────────────────────

class AssignmentOut(BaseModel):
    missionId: int
    vehicleId: int
    driverId: int
    vehicleImmatriculation: str = ""
    driverName: str = ""
    estimatedDurationMin: int
    estimatedFuelCost: float
    estimatedDistance: float
    assignmentConfidence: float                    # 0..1
    assignmentReasoning: str
    estimatedDepartureTime: datetime
    estimatedArrivalTime: datetime


class UnassignedOut(BaseModel):
    missionId: int
    reason: str                                    # NO_FEASIBLE_VEHICLE | NO_FEASIBLE_DRIVER | …
    suggestedAction: str


class MetricsOut(BaseModel):
    totalFuelCostEstimated: float
    totalMissionsAssigned: int
    totalMissionsReceived: int
    assignmentSuccessRate: float
    averageDriverWorkloadHours: float
    workloadStdDevHours: float
    optimizationAlgorithm: str = "GREEDY+GA+LOCAL_SEARCH v1.0"


class OptimizeResponse(BaseModel):
    optimizationId: str
    batchId: str
    timestamp: datetime
    executionTimeMs: int
    optimizationScore: float                       # 0..100 (FICHE §5.3)
    assignments: List[AssignmentOut]
    unassignedMissions: List[UnassignedOut]
    metrics: MetricsOut
    warnings: List[str]
