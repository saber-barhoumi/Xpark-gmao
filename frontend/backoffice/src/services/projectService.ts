import avatar1 from '@/assets/images/users/avatar-1.jpg'
import avatar2 from '@/assets/images/users/avatar-2.jpg'
import avatar3 from '@/assets/images/users/avatar-3.jpg'
import avatar4 from '@/assets/images/users/avatar-4.jpg'
import avatar5 from '@/assets/images/users/avatar-5.jpg'
import avatar6 from '@/assets/images/users/avatar-6.jpg'
import avatar7 from '@/assets/images/users/avatar-7.jpg'
import avatar8 from '@/assets/images/users/avatar-8.jpg'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * projectService — couche de données des « Projets internes » XPARK
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * La page /apps/Projects était 100 % statique (tableau codé en dur, filtres et
 * pagination sans effet). On introduit ici une VRAIE couche service, avec un
 * modèle de données typé, prête à brancher un backend.
 *
 * Aujourd'hui les données viennent d'un mock local (MOCK_PROJECTS) : il n'existe
 * pas encore de microservice « Projets » côté plateforme. Le jour où il existe,
 * seul le corps de `getAll()` change — remplacer le mock par
 * `api.get('/projets')` — la page et ses composants restent identiques.
 */

export enum ProjectStatus {
  COMPLETED   = 'Terminé',
  IN_PROGRESS = 'En cours',
  IN_REVIEW   = 'En revue',
  PENDING     = 'En attente',
  DELAYED     = 'En retard',
  ON_HOLD     = 'Suspendu',
}

/** Couleur du design system associée à chaque statut. */
export const STATUS_VARIANT: Record<ProjectStatus, string> = {
  [ProjectStatus.COMPLETED]:   'success',
  [ProjectStatus.IN_PROGRESS]: 'primary',
  [ProjectStatus.IN_REVIEW]:   'info',
  [ProjectStatus.PENDING]:     'warning',
  [ProjectStatus.DELAYED]:     'danger',
  [ProjectStatus.ON_HOLD]:     'secondary',
}

export interface TeamMember {
  name:   string
  avatar: string
}

export interface Project {
  id:          number
  title:       string
  category:    string
  description: string
  status:      ProjectStatus
  progress:    number          // 0–100
  tasksDone:   number
  tasksTotal:  number
  comments:    number
  team:        TeamMember[]
  lead:        string
  startDate:   string          // ISO
  dueDate:     string          // ISO
  budget:      number          // TND
}

export interface ProjectStats {
  total:       number
  actifs:      number          // en cours + en revue
  termines:    number
  enRetard:    number
  avgProgress: number          // moyenne pondérée simple
}

// ── Mock (à remplacer par un appel API le moment venu) ───────────────────────
const T = {
  amir:  { name: 'Amir Trabelsi',   avatar: avatar1 },
  leila: { name: 'Leila Ben Youssef', avatar: avatar2 },
  karim: { name: 'Karim Gharbi',    avatar: avatar3 },
  sonia: { name: 'Sonia Mabrouk',   avatar: avatar4 },
  hedi:  { name: 'Hedi Nasri',      avatar: avatar5 },
  ines:  { name: 'Inès Chaabane',   avatar: avatar6 },
  wael:  { name: 'Wael Bouzid',     avatar: avatar7 },
  rania: { name: 'Rania Khelifi',   avatar: avatar8 },
}

const MOCK_PROJECTS: Project[] = [
  {
    id: 1, title: 'Déploiement GPS temps réel', category: 'Flotte / IoT',
    description: 'Équiper l\'ensemble du parc de balises GPS et diffuser la position en direct vers le portail client et le back-office.',
    status: ProjectStatus.IN_PROGRESS, progress: 68, tasksDone: 17, tasksTotal: 25, comments: 42,
    team: [T.amir, T.karim, T.hedi], lead: 'Amir Trabelsi',
    startDate: '2026-05-02', dueDate: '2026-08-15', budget: 48000,
  },
  {
    id: 2, title: 'Maintenance prédictive (IA)', category: 'Intelligence Artificielle',
    description: 'Modèle de prédiction des pannes par organe (freins, pneus, moteur) et tableau de bord de santé du parc.',
    status: ProjectStatus.IN_REVIEW, progress: 90, tasksDone: 27, tasksTotal: 30, comments: 63,
    team: [T.leila, T.wael], lead: 'Leila Ben Youssef',
    startDate: '2026-04-10', dueDate: '2026-07-30', budget: 62000,
  },
  {
    id: 3, title: 'Portail client — réservation & devis', category: 'Front Office',
    description: 'Workflow de demande de transport, devis administrateur puis acceptation client avant création de mission.',
    status: ProjectStatus.COMPLETED, progress: 100, tasksDone: 22, tasksTotal: 22, comments: 88,
    team: [T.sonia, T.ines, T.karim], lead: 'Sonia Mabrouk',
    startDate: '2026-02-01', dueDate: '2026-05-20', budget: 35000,
  },
  {
    id: 4, title: 'Optimisateur de flotte', category: 'Intelligence Artificielle',
    description: 'Affectation automatique chauffeur/véhicule aux missions en attente selon disponibilité et contraintes.',
    status: ProjectStatus.IN_PROGRESS, progress: 55, tasksDone: 11, tasksTotal: 20, comments: 29,
    team: [T.wael, T.amir, T.rania], lead: 'Wael Bouzid',
    startDate: '2026-05-15', dueDate: '2026-09-01', budget: 51000,
  },
  {
    id: 5, title: 'Migration Clean Architecture', category: 'Back-End',
    description: 'Refonte des 7 microservices .NET en 4 couches (API / Application / Domain / Infrastructure), sans changement de comportement.',
    status: ProjectStatus.COMPLETED, progress: 100, tasksDone: 34, tasksTotal: 34, comments: 51,
    team: [T.karim, T.hedi], lead: 'Karim Gharbi',
    startDate: '2026-07-17', dueDate: '2026-07-22', budget: 0,
  },
  {
    id: 6, title: 'Application mobile chauffeur', category: 'Mobile',
    description: 'App Expo React Native : missions du jour, navigation, remontée GPS en arrière-plan, branding XPARK.',
    status: ProjectStatus.PENDING, progress: 20, tasksDone: 4, tasksTotal: 20, comments: 12,
    team: [T.hedi, T.ines], lead: 'Hedi Nasri',
    startDate: '2026-06-20', dueDate: '2026-10-10', budget: 40000,
  },
  {
    id: 7, title: 'Assistant IA Ayshaa (RAG)', category: 'Intelligence Artificielle',
    description: 'Assistant trilingue du site vitrine (FR/EN/darija) : RAG Qdrant + BM25, tool-calling vers les microservices.',
    status: ProjectStatus.IN_PROGRESS, progress: 75, tasksDone: 18, tasksTotal: 24, comments: 37,
    team: [T.leila, T.rania, T.sonia], lead: 'Rania Khelifi',
    startDate: '2026-05-25', dueDate: '2026-08-30', budget: 45000,
  },
  {
    id: 8, title: 'Refonte facturation', category: 'Finance',
    description: 'Module de factures 100 % dynamique avec document officiel XPARK imprimable et encaissement.',
    status: ProjectStatus.DELAYED, progress: 40, tasksDone: 8, tasksTotal: 20, comments: 19,
    team: [T.sonia, T.amir], lead: 'Sonia Mabrouk',
    startDate: '2026-04-05', dueDate: '2026-06-15', budget: 28000,
  },
  {
    id: 9, title: 'Suppression en masse (RGPD)', category: 'Back-Office',
    description: 'Sélection multiple et purge conforme sur toutes les listes de gestion (véhicules, missions, maintenance…).',
    status: ProjectStatus.ON_HOLD, progress: 60, tasksDone: 12, tasksTotal: 20, comments: 22,
    team: [T.karim], lead: 'Karim Gharbi',
    startDate: '2026-06-01', dueDate: '2026-07-25', budget: 15000,
  },
]

/** Latence simulée pour reproduire un vrai appel réseau (loading state). */
const wait = (ms: number) => new Promise(res => setTimeout(res, ms))

const projectService = {
  /** Remplacer par `api.get('/projets').then(r => r.data)` quand le back existe. */
  async getAll(): Promise<Project[]> {
    await wait(500)
    return structuredClone(MOCK_PROJECTS)
  },

  async getById(id: number): Promise<Project | undefined> {
    await wait(200)
    return MOCK_PROJECTS.find(p => p.id === id)
  },

  /** Statistiques dérivées — calculées côté client sur la liste. */
  computeStats(projects: Project[]): ProjectStats {
    const actifs   = projects.filter(p => p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.IN_REVIEW).length
    const termines = projects.filter(p => p.status === ProjectStatus.COMPLETED).length
    const enRetard = projects.filter(p => p.status === ProjectStatus.DELAYED).length
    const avgProgress = projects.length
      ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
      : 0
    return { total: projects.length, actifs, termines, enRetard, avgProgress }
  },
}

export default projectService
