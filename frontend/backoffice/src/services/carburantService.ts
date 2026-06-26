import api from '@/lib/axiosConfig'

export interface Carburant {
    idCarburant: number
    dateRemplissage: string
    quantite: number
    prixUnitaire: number
    montantTotal: number
    kilometrage: number
    station?: string
    numeroBon?: string
    typeCarburant: string
    vehiculeId: number
    vehiculeImmatriculation?: string
    sourceId?: number
    sourceNom?: string
    sourceType?: string
    consommationL100km?: number
    justificatifUrl?: string
}

export interface CreateCarburantDto {
    dateRemplissage: string
    quantite: number
    prixUnitaire: number
    montantTotal?: number
    kilometrage: number
    station?: string
    numeroBon?: string
    typeCarburant: string
    vehiculeId: number
    chauffeurId?: number
    sourceId?: number
    justificatifUrl?: string
}

export interface CarburantStats {
    consommationMoyenne: number
    coutTotal: number
    litresTotaux: number
    kilometrageTotal: number
    nombrePleins: number
    repartitionParSource: {
        nomSource: string
        typeSource: string
        coutTotal: number
        nombrePleins: number
        prixMoyen: number
    }[]
    evolutionMensuelle: {
        mois: string
        coutTotal: number
        litresTotaux: number
    }[]
    topVehiculesParCout: {
        vehiculeImmatriculation: string
        coutTotal: number
        kilometrageTotal: number
    }[]
}

export const carburantService = {
    getAll: (vehiculeId?: number): Promise<Carburant[]> => 
        api.get('/carburants', { params: { vehiculeId } }).then(r => r.data),
    getById: (id: number): Promise<Carburant> => api.get(`/carburants/${id}`).then(r => r.data),
    create: (data: CreateCarburantDto): Promise<Carburant> => api.post('/carburants', data).then(r => r.data),
    delete: (id: number): Promise<void> => api.delete(`/carburants/${id}`).then(r => r.data),
    getStats: (params: { vehiculeId?: number; start?: string; end?: string }): Promise<CarburantStats> =>
        api.get('/carburants/stats', { params }).then(r => r.data),
}

export default carburantService
