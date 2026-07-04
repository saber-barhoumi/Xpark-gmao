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
    // AI trip cost model parameters
    aiVehiculeType?: 'LIGHT_VEHICLE' | 'VAN' | 'FOURGON' | 'HEAVY_TRUCK' | null
    chargeUtileKg?: number
    consommationAI?: number
}

export const AI_VEHICLE_DEFAULTS: Record<string, { label: string; fuelLabel: string; cons: number; charge: number }> = {
    LIGHT_VEHICLE: { label: 'Véhicule Léger (Berline, SUV)',    fuelLabel: 'Essence', cons: 8.0,  charge: 800   },
    VAN:           { label: 'Fourgonnette (Vito, Trafic)',       fuelLabel: 'Diesel',  cons: 11.5, charge: 2000  },
    FOURGON:       { label: 'Grand Fourgon (Sprinter, Master)',  fuelLabel: 'Diesel',  cons: 14.5, charge: 3500  },
    HEAVY_TRUCK:   { label: 'Camion Lourd (Actros, MAN TGX)',   fuelLabel: 'Diesel',  cons: 26.0, charge: 12000 },
}

export const vehiculeService = {
    getAll: async (): Promise<Vehicule[]> => {
        const response = await api.get('/vehicules?pageSize=1000')
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
