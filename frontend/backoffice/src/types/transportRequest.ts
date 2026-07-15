/** Cycle de vie d'une demande de transport (devis) — miroir de l'enum Mission.API. */
export enum StatutDemandeTransport {
    PENDING_QUOTATION = 'PENDING_QUOTATION',
    QUOTATION_SENT = 'QUOTATION_SENT',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

/** Comment le prix final du devis a été déterminé. */
export enum MethodePrix {
    AI_PRICE = 'AI_PRICE',
    MODIFIED = 'MODIFIED',
    MANUAL = 'MANUAL',
}

export interface TransportRequest {
    idTransportRequest: number
    clientIdUtilisateur: number
    clientNom?: string | null
    dateSouhaitee: string
    villeDepart: string
    villeArrivee: string
    cargoDescription: string
    cargoWeightKg: number
    passengerCount: number
    vehicleTypeRequested?: string | null
    distanceKm: number
    aiEstimatedPrice: number
    aiPriceRangeMin: number
    aiPriceRangeMax: number
    aiVehicleTypeRecommended?: string | null
    statut: StatutDemandeTransport
    finalPrice?: number | null
    pricingMethod?: MethodePrix | null
    adminNote?: string | null
    quotedByUserId?: number | null
    quotedByName?: string | null
    dateQuotationEnvoyee?: string | null
    clientCancelReason?: string | null
    clientRejectionReason?: string | null
    dateClientReponse?: string | null
    missionId?: number | null
    dateCreation: string
    dateMaj: string
}

/** Corps de PUT /missions/demandes/{id}/quote */
export interface SendQuotationDto {
    finalPrice: number
    pricingMethod: MethodePrix
    adminNote?: string
}
