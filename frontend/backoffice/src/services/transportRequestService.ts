import api from '@/lib/axiosConfig'
import { TransportRequest, StatutDemandeTransport, SendQuotationDto } from '@/types/transportRequest'

/**
 * Demandes de transport ("devis") côté staff — miroir de missionService.ts.
 * Le staff liste les demandes, consulte le détail et envoie le devis. Routes
 * nichées sous /missions/demandes (déjà proxifiées par la passerelle du back office).
 */
export const transportRequestService = {
    getAll: async (statut?: StatutDemandeTransport): Promise<TransportRequest[]> => {
        const response = await api.get('/missions/demandes', { params: { statut } })
        return response.data
    },

    getById: async (id: number): Promise<TransportRequest> => {
        const response = await api.get(`/missions/demandes/${id}`)
        return response.data
    },

    /** Le staff chiffre et envoie le devis → QUOTATION_SENT. */
    sendQuotation: async (id: number, data: SendQuotationDto): Promise<TransportRequest> => {
        const response = await api.put(`/missions/demandes/${id}/quote`, data)
        return response.data
    },

    /** Suppression d'une demande (staff). */
    remove: async (id: number): Promise<void> => {
        await api.delete(`/missions/demandes/${id}`)
    },

    /** Suppression en masse (staff) — même convention que alerteService.removeMany. */
    removeMany: async (ids: number[]): Promise<number> => {
        const res = await api.post('/missions/demandes/supprimer', { ids })
        return res.data?.count ?? ids.length
    },
}

export default transportRequestService
