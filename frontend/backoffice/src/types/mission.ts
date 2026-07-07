export enum StatutMission {
    EN_ATTENTE = 'EN_ATTENTE',
    EN_COURS = 'EN_COURS',
    TERMINEE = 'TERMINEE',
    ANNULEE = 'ANNULEE'
}

export interface Mission {
    idMission: number;
    dateDepart: string;
    dateRetour?: string;
    destination: string;
    statut: StatutMission;
    kilometrageDepart: number;
    kilometrageRetour: number;
    objetMission: string;
    coutTotal: number;
    distance: number;
    // Null when the mission is EN_ATTENTE waiting for OptimisateurFlotteIA
    employeeId?: number | null;
    vehiculeId?: number | null;
    vehiculeImmatriculation?: string;
    chauffeurNom?: string;
    // Client (frontoffice) à l'origine de la réservation
    clientIdUtilisateur?: number | null;
    clientNom?: string | null;
    dateCreation: string;
    // Logistics Checklist
    bonCarburantAccorde: boolean;
    numeroBonCarburant?: string;
    verificationDocuments: boolean;
    carteAutorouteRemise: boolean;
    // Route + AI snapshot (stored at creation)
    villeDepart?: string;
    villeArrivee?: string;
    distanceKm?: number;
    coutEstimeAI?: number;
    aiVehiculeTypeUsed?: string;
}

export interface CreateMissionDto {
    dateDepart: string;
    dateRetour?: string;
    destination: string;
    kilometrageDepart: number;
    objetMission: string;
    // Omit vehicle+driver to create the mission EN_ATTENTE (auto-assignment by OptimisateurFlotteIA)
    vehiculeId?: number;
    vehiculeImmatriculation?: string;
    employeeId?: number;
    chauffeurNom?: string;
    bonCarburantAccorde: boolean;
    numeroBonCarburant?: string;
    verificationDocuments: boolean;
    carteAutorouteRemise: boolean;
    villeDepart?: string;
    villeArrivee?: string;
    distanceEstimee?: number;
    coutEstime?: number;
    aiVehiculeTypeUsed?: string;
}

export interface CloseMissionDto {
    kilometrageRetour: number;
}

/** One assignment produced by OptimisateurFlotteIA, applied to a mission EN_ATTENTE */
export interface AssignMissionDto {
    vehiculeId: number;
    employeeId: number;
    vehiculeImmatriculation?: string;
    chauffeurNom?: string;
    kilometrageDepart?: number;
    coutEstime?: number;
}
