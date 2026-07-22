import api from '@/lib/axiosConfig'

export interface OrdreDetail {
  id:           number
  titre:        string
  description?: string
  priorite:     string
  statut:       string
  dateCreation: string
  dateEcheance?: string
  technicien?:  string
  equipement?:  string
  tags:         string[]
  attachments:  Attachment[]
  commentaires: Commentaire[]
}

export interface Attachment {
  id:        number
  nom:       string
  url:       string
  taille:    number
  type:      string
  createdAt: string
}

export interface Commentaire {
  id:        number
  contenu:   string
  auteur:    string
  createdAt: string
}

const viewDetailsService = {
  async getDetail(id: number): Promise<OrdreDetail> {
    const res = await api.get(`/ordres-travail/${id}/detail`)
    return res.data
  },

  async addCommentaire(ordreId: number, contenu: string): Promise<Commentaire> {
    const res = await api.post(`/ordres-travail/${ordreId}/commentaires`, { contenu })
    return res.data
  },

  async uploadAttachment(ordreId: number, file: File): Promise<Attachment> {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post(`/ordres-travail/${ordreId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data
  },

  /** Supprime un commentaire (auteur ou ADMIN uniquement, contrôlé côté API). */
  async deleteCommentaire(ordreId: number, commentaireId: number): Promise<void> {
    await api.delete(`/ordres-travail/${ordreId}/commentaires/${commentaireId}`)
  },

  /** Supprime une pièce jointe (ligne + fichier du volume partagé). */
  async deleteAttachment(ordreId: number, attachmentId: number): Promise<void> {
    await api.delete(`/ordres-travail/${ordreId}/attachments/${attachmentId}`)
  },
}

export default viewDetailsService
