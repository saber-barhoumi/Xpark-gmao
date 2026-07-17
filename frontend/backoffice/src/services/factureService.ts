import api from '@/lib/axiosConfig'

/**
 * factureService — facturation XPARK (Finance.API, via la passerelle /api/factures).
 *
 * Réutilise les endpoints EXISTANTS de Finance.API (aucune logique dupliquée) :
 *   GET    /factures?page&pageSize&statut   liste paginée (staff)
 *   GET    /factures/{id}                   détail (document imprimable)
 *   GET    /factures/impayees               relances
 *   POST   /factures                        création (ADMIN/GESTIONNAIRE)
 *   PATCH  /factures/{id}/payer             encaissement
 *   PATCH  /factures/{id}/annuler           annulation motivée (une facture ne se supprime pas)
 */

export type StatutFacture = 'EN_ATTENTE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE'

export interface Facture {
    idFacture: number
    numeroFacture: string
    dateFacture: string
    dateEcheance?: string | null
    montant: number           // HT
    montantTTC: number
    tauxTVA: number
    description?: string | null
    statut: StatutFacture | string
    datePaiement?: string | null
    clientId: number
    clientNom?: string | null
    clientPrenom?: string | null
    clientEmail?: string | null
    missionId?: number | null
    missionReference?: string | null
}

export interface FacturePage {
    items?: Facture[]
    data?: Facture[]
    totalCount?: number
    total?: number
}

export interface CreateFactureDto {
    clientId: number
    missionId?: number
    montant: number           // HT
    tauxTVA?: number
    description?: string
    dateEcheance?: string
}

const factureService = {
    getAll: async (page = 1, pageSize = 50, statut?: string): Promise<{ items: Facture[]; total: number }> => {
        const res = await api.get('/factures', { params: { page, pageSize, statut } })
        const body: FacturePage | Facture[] = res.data
        const items = Array.isArray(body) ? body : (body.items ?? body.data ?? [])
        const total = Array.isArray(body) ? body.length : (body.totalCount ?? body.total ?? items.length)
        return { items, total }
    },

    getById: async (id: number): Promise<Facture> => {
        const res = await api.get(`/factures/${id}`)
        return res.data
    },

    getImpayees: async (): Promise<Facture[]> => {
        const res = await api.get('/factures/impayees')
        return res.data
    },

    create: async (dto: CreateFactureDto): Promise<Facture> => {
        const res = await api.post('/factures', dto)
        return res.data
    },

    payer: async (id: number, methodePaiement?: string): Promise<void> => {
        await api.patch(`/factures/${id}/payer`, { methodePaiement })
    },

    annuler: async (id: number, motif: string): Promise<void> => {
        await api.patch(`/factures/${id}/annuler`, { motif })
    },
}

export default factureService
