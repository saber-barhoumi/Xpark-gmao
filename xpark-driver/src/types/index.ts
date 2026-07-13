/** Types partagés — alignés sur les DTO du backend XPARK GMAO. */

export type MissionStatut = "EN_ATTENTE" | "EN_COURS" | "TERMINEE" | "ANNULEE"

/** Utilisateur connecté (décodé de la réponse de login IAM.API). */
export interface AuthUser {
    userId: number
    email: string
    nom: string
    prenom: string
    role: string
    token: string
}

/** Mission telle que renvoyée par Mission.API (GET /missions/driver). */
export interface Mission {
    idMission: number
    dateDepart: string
    dateRetour?: string
    destination: string
    statut: MissionStatut
    objetMission?: string
    coutTotal?: number
    coutEstimeAI?: number
    distanceKm?: number
    villeDepart?: string
    villeArrivee?: string
    vehiculeId?: number
    vehiculeImmatriculation?: string
    chauffeurNom?: string
    clientNom?: string
    clientIdUtilisateur?: number
    aiVehiculeTypeUsed?: string
}

/** Position GPS à envoyer au backend (POST /tracking/ping). */
export interface PingPayload {
    missionId: number
    vehiculeId?: number
    latitude: number
    longitude: number
    speedKmh?: number
    heading?: number
    accuracy?: number
    recordedAt: string
}
