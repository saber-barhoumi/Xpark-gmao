import api from '@/lib/axiosConfig'

export interface UserProfile {
  idUtilisateur: number
  prenom:        string
  nom:           string
  email:         string
  role:          string
  telephone:     string
  site:          string
  specialite:    string
  departement:   string
  bio:           string
  photoUrl:      string | null
}

export interface ProfileStats {
  totalInterventions:   number
  interventionsEnCours: number
  interventionsMois:    number
  tauxResolution:       number
  prioritaires:         number
  ordresOuverts:        number
}

const profileService = {
  /** Récupérer les détails complets du profil */
  async getProfile(userId: number): Promise<UserProfile> {
    const res = await api.get(`/users/${userId}/details`)
    return res.data
  },

  /** Récupérer les stats GMAO de l'utilisateur */
  async getStats(userId: number): Promise<ProfileStats> {
    const res = await api.get(`/users/${userId}/stats`)
    return res.data
  },

  /** Uploader une photo de profil */
  async uploadPhoto(userId: number, file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    const res = await api.post(`/users/${userId}/upload-avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data.photoUrl
  },

  /** Mettre à jour le profil utilisateur */
  async updateProfile(userId: number, data: any): Promise<any> {
    const res = await api.put(`/users/${userId}/profile`, data)
    return res.data
  },
}

export default profileService
