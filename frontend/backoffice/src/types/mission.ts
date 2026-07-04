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
    vehiculeImmatriculation?: string;
    chauffeurNom?: string;
    dateCreation: string;
    // Logistics Checklist
    bonCarburantAccorde: boolean;
    numeroBonCarburant?: string;
    verificationDocuments: boolean;
    carteAutorouteRemise: boolean;
}

export interface CreateMissionDto {
    dateDepart: string;
    dateRetour?: string;
    destination: string;
    kilometrageDepart: number;
    objetMission: string;
    vehiculeId: number;
    employeeId: number;
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
