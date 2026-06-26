import api from '@/lib/axiosConfig'

export interface Alerte {
    idAlerte: number
    message: string
    typeAlerte: string
    statut: string
    dateAlerte: string
    vehiculeId?: number
    equipementId?: number
    nomEquipement?: string
    missionId?: number
    referenceMission?: string
    entiteReference?: string
    priorite: string
}

const alerteService = {
    /** Récupérer toutes les alertes de l'utilisateur connecté */
    async getAll(): Promise<Alerte[]> {
        const res = await api.get('/alertes')
        return res.data
    },

    /** Compter les alertes non lues */
    async getCountUnread(): Promise<number> {
        const res = await api.get('/alertes/count-unread')
        return res.data
    },

    /** Liste des alertes non lues */
    async getUnread(): Promise<Alerte[]> {
        const res = await api.get('/alertes/unread')
        return res.data
    },

    /** Marquer comme lue */
    async markAsRead(id: number): Promise<void> {
        await api.put(`/alertes/${id}/mark-as-read`)
    },

    /** Marquer comme traitée */
    async markAsTraitee(id: number): Promise<void> {
        await api.post(`/alertes/${id}/traitee`)
    },

    /** Tout marquer comme lu */
    async markAllReadGlobal(): Promise<void> {
        await api.put('/alertes/mark-all-read')
    },

    /** Lancer manuellement les vérifications système */
    async runChecks(): Promise<void> {
        await api.post('/alertes/run-checks')
    }
}

export default alerteService
