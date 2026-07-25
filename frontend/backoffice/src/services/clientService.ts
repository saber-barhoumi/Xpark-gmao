import api from '@/lib/axiosConfig'

/** Client (ClientDto de IAM.API). */
export interface Client {
  idUtilisateur: number
  prenom:        string
  nom:           string
  email?:        string
  telephone?:    string
}

export const clientService = {
  /** Tous les clients — utilisé pour résoudre les noms (ex. Top clients Analyses). */
  getAll: async (): Promise<Client[]> => {
    const res = await api.get<any>('/clients')
    return res.data?.data ?? res.data ?? []
  },
}

export default clientService
