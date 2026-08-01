import api from '@/lib/axiosConfig'

/** Client (ClientDto de IAM.API — /api/clients). */
export interface Client {
  idUtilisateur:   number
  nom:             string
  prenom:          string
  email:           string
  telephone?:      string | null
  nomSociete?:     string | null
  secteurActivite?: string | null
  adresse?:        string | null
  ville?:          string | null
  estEntreprise:   boolean
  numeroFiscal?:   string | null
  dateCreation:    string
}

export const clientService = {
  /** Tous les clients — annuaire, résolution de noms (Top clients Analyses), contacts. */
  getAll: async (): Promise<Client[]> => {
    const res = await api.get<any>('/clients')
    return res.data?.data ?? res.data ?? []
  },

  getById: async (id: number): Promise<Client> => {
    const res = await api.get<any>(`/clients/${id}`)
    return res.data?.data ?? res.data
  },
}

export default clientService
