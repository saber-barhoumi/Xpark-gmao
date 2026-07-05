// Types miroir des modèles Pydantic d'OptimisateurFlotteIA (port 8001)

export interface OptimizerMission {
    missionId: number;
    villeDepart: string;
    villeArrivee: string;
    distanceKm: number;
    dateDepart: string;                 // ISO
    requiredVehicleClass?: string;      // LIGHT_VEHICLE | VAN | FOURGON | HEAVY_TRUCK
    priorite?: string;                  // LOW | NORMAL | HIGH | URGENT
    objetMission?: string;
}

export interface OptimizerVehicle {
    idVehicule: number;
    immatriculation: string;
    marque: string;
    modele: string;
    typeVehicule: string;               // GMAO enum (BERLINE, CAMION…)
    typeCarburant: string;
    consommationMoyenne: number;
    kilometrage: number;
    nombrePlaces: number;
    chargeUtileKg: number;
    kilometrageProchainRevision?: number;
    dateProchaineRevision?: string;
}

export interface OptimizerDriver {
    idEmployee: number;
    nom: string;
    numeroMatricule?: string;
    categoriePermis?: string;
}

export interface OptimizerRecentMission {
    employeeId?: number | null;
    vehiculeId?: number | null;
    dateDepart: string;
    dateRetour?: string | null;
    distanceKm: number;
    statut: string;
}

export interface OptimizeRequest {
    batchId?: string;
    missions: OptimizerMission[];
    vehicles: OptimizerVehicle[];
    drivers: OptimizerDriver[];
    recentMissions: OptimizerRecentMission[];
}

export interface OptimizerAssignment {
    missionId: number;
    vehicleId: number;
    driverId: number;
    vehicleImmatriculation: string;
    driverName: string;
    estimatedDurationMin: number;
    estimatedFuelCost: number;
    estimatedDistance: number;
    assignmentConfidence: number;       // 0..1
    assignmentReasoning: string;
    estimatedDepartureTime: string;
    estimatedArrivalTime: string;
}

export interface OptimizerUnassigned {
    missionId: number;
    reason: string;
    suggestedAction: string;
}

export interface OptimizerMetrics {
    totalFuelCostEstimated: number;
    totalMissionsAssigned: number;
    totalMissionsReceived: number;
    assignmentSuccessRate: number;
    averageDriverWorkloadHours: number;
    workloadStdDevHours: number;
    optimizationAlgorithm: string;
}

export interface OptimizePlan {
    optimizationId: string;
    batchId: string;
    timestamp: string;
    executionTimeMs: number;
    optimizationScore: number;          // 0..100
    assignments: OptimizerAssignment[];
    unassignedMissions: OptimizerUnassigned[];
    metrics: OptimizerMetrics;
    warnings: string[];
}
