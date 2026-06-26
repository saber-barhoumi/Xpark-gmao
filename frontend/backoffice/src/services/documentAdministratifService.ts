import api from '@/lib/axiosConfig'

export interface DocumentAdministratif {
    idDocument: number
    typeDocument: string | number
    numeroDocument: string
    dateEmission: string
    dateExpiration: string
    autorite?: string
    fichierPath?: string
    observations?: string
    vehiculeId: number
    dateCreation: string
}

export const documentAdministratifService = {
    getByVehiculeId: async (vehiculeId: number): Promise<DocumentAdministratif[]> => {
        const response = await api.get(`/documents-administratifs/vehicule/${vehiculeId}`)
        return response.data
    },

    create: async (formData: FormData): Promise<DocumentAdministratif> => {
        const response = await api.post('/documents-administratifs', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response.data
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/documents-administratifs/${id}`)
    }
}
