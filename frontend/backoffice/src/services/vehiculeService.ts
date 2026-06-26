import api from '@/lib/axiosConfig'

export interface Vehicule {
    idVehicule: number
    immatriculation: string
    marque: string
    modele: string
    typeCarburant: string
    typeVehicule: string
    kilometrage: number
    statut: string
    actif: boolean
}

export const vehiculeService = {
    getAll: async (): Promise<Vehicule[]> => {
        const response = await api.get('/vehicules?pageSize=1000')
        // Backend returns PaginatedResponseDto { data: Vehicule[], totalCount: number, ... }
        return response.data.data || []
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
