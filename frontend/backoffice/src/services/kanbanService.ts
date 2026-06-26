import api from '@/lib/axiosConfig'

export type KanbanStatut = 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE'
export type Priorite     = 'BASSE' | 'NORMALE' | 'HAUTE' | 'CRITIQUE' | 'MOYENNE'

export interface KanbanCard {
  id:           string
  type:         'OT' | 'MISSION' | 'INTERVENTION'
  reference:    string
  titre:        string
  description?: string
  priorite:     string
  statut:       string
  dateCreation: string
  dateEcheance?: string
  technicien?:  string
  technicienAvatar?: string
  equipement?:  string
  hasAttachments:   boolean
  commentsCount:    number
  hasSpareParts:    boolean
  tags:         string[]
  vehiculeId?:   string | number
  technicienId?: string | number
}

export interface KanbanSection {
  id:     string
  title:  string
  color:  string
  icon:   string
  cards:  KanbanCard[]
}

// Labels + couleurs des colonnes Kanban GMAO
export const KANBAN_SECTIONS: Omit<KanbanSection, 'cards'>[] = [
  { id: 'PLANIFIE', title: 'Planifié',    color: 'secondary', icon: 'tabler:inbox' },
  { id: 'EN_COURS', title: 'En cours',    color: 'primary',   icon: 'tabler:loader' },
  { id: 'TERMINE',  title: 'Terminé',     color: 'success',   icon: 'tabler:circle-check' },
  { id: 'ANNULE',   title: 'Annulé',      color: 'danger',    icon: 'tabler:x' },
]

export const PRIORITE_CONFIG: Record<string, { label: string; color: string }> = {
  BASSE:    { label: 'Basse',    color: 'secondary' },
  MOYENNE:  { label: 'Moyenne',  color: 'info' },
  NORMALE:  { label: 'Normale',  color: 'info' },
  HAUTE:    { label: 'Haute',    color: 'warning' },
  CRITIQUE: { label: 'Critique', color: 'danger' },
}

const kanbanService = {
  async getKanban(): Promise<Record<string, KanbanCard[]>> {
    const res = await api.get<Record<string, KanbanCard[]>>('/ordres-travail/kanban')
    return res.data
  },

  async getKanbanMetadata(): Promise<{ techniciens: any[], vehicules: any[] }> {
    const res = await api.get<{ techniciens: any[], vehicules: any[] }>('/ordres-travail/kanban/metadata')
    return res.data
  },

  async updateStatut(id: string, statut: string): Promise<void> {
    await api.put(`/ordres-travail/${id}/statut`, { statut })
  },

  async createCard(payload: any): Promise<KanbanCard> {
    const res = await api.post<KanbanCard>('/ordres-travail', payload)
    return res.data
  },

  async deleteCard(id: string): Promise<void> {
    await api.delete(`/ordres-travail/${id}`)
  },

  async clearSection(statut: string): Promise<void> {
    await api.delete(`/ordres-travail/kanban/clear/${statut}`)
  },
}

export default kanbanService
