import api from '@/lib/axiosConfig'

export interface Vehicule {
    idVehicule: number
    immatriculation: string
    marque: string
    modele: string
    typeCarburant: string
    typeVehicule: string
    kilometrage: number
    consommationMoyenne?: number
    chargeUtileKg?: number
    statut: string
    actif: boolean
}

export const vehiculeService = {
    getAll: async (): Promise<Vehicule[]> => {
        const response = await api.get('/vehicules?pageSize=1000')
        // Fleet.API renvoie { total, page, pageSize, items }. Le code lisait
        // `.data.data`, qui n'existe pas : la liste revenait toujours VIDE et
        // les écrans qui s'appuient dessus (Analyses : disponibilité de la
        // flotte, état du parc, consommation par véhicule) affichaient 0.
        // On accepte les trois formes rencontrées dans le projet.
        const body = response.data
        return Array.isArray(body) ? body : (body?.items ?? body?.data ?? [])
    },
    getDisponibles: async (): Promise<Vehicule[]> => {
        const response = await api.get('/vehicules/disponibles')
        return response.data || []
    },
    getById: async (id: number): Promise<Vehicule> => {
        const response = await api.get(`/vehicules/${id}`)
        return response.data
    },
    getLatestInfo: async (id: number): Promise<{ lastMileage: number, typeCarburant: string }> => {
        const response = await api.get(`/vehicules/${id}/latest-info`)
        return response.data
    }
}
