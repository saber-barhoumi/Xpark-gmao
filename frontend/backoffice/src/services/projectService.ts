import api from '@/lib/axiosConfig'
import userService, { AccountUser } from './userService'
import missionService from './missionService'
import { vehiculeService } from './vehiculeService'
import interventionService from './interventionService'
import ordreTravailService from './ordreTravailService'
import factureService from './factureService'
import clientService from './clientService'
import { StatutMission, type Mission } from '@/types/mission'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * projectService — programmes d'exploitation XPARK
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Un « projet » est ici un PROGRAMME D'EXPLOITATION de la société de
 * transport (conformité du parc, maintenance préventive, recouvrement…), et
 * non un chantier informatique.
 *
 * Tout est calculé à partir des DONNÉES RÉELLES de la plateforme, via les
 * services existants : l'avancement, le nombre de tâches et l'indicateur de
 * suivi de chaque programme sont des agrégats mesurés, jamais des valeurs
 * fixes. Les équipes sont composées des VRAIS comptes utilisateurs (nom,
 * rôle, photo), sélectionnés selon les rôles utiles au programme.
 */

export enum ProjectStatus {
  COMPLETED   = 'Terminé',
  IN_PROGRESS = 'En cours',
  IN_REVIEW   = 'À surveiller',
  PENDING     = 'À lancer',
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
  id:     number
  name:   string
  role:   string
  avatar: string | null   // URL de la photo, null = initiales
}

export interface Project {
  id:          number
  title:       string
  category:    string
  description: string
  status:      ProjectStatus
  progress:    number            // 0–100, mesuré
  tasksDone:   number
  tasksTotal:  number
  /** Indicateur de suivi propre au programme (valeur réelle). */
  indicateur:  { label: string; value: string }
  team:        TeamMember[]
  lead:        string
  /** Ce que mesure l'avancement — affiché pour que le chiffre soit lisible. */
  mesure:      string
}

export interface ProjectStats {
  total:       number
  actifs:      number
  termines:    number
  enRetard:    number
  avgProgress: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const API_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

const toMember = (u: AccountUser): TeamMember => ({
  id: u.idUtilisateur,
  name: `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || u.email,
  role: u.role,
  avatar: u.photo ? `${API_URL}${u.photo}` : null,
})

/** Pourcentage entier borné, 0 si le dénominateur est nul. */
const pct = (fait: number, total: number) => (total > 0 ? Math.round((fait / total) * 100) : 0)

/** Statut déduit de l'avancement réel — aucune valeur figée. */
const statutDe = (progress: number, enRetard = false): ProjectStatus => {
  if (enRetard) return ProjectStatus.DELAYED
  if (progress >= 100) return ProjectStatus.COMPLETED
  if (progress >= 60)  return ProjectStatus.IN_PROGRESS
  if (progress >= 30)  return ProjectStatus.IN_REVIEW
  if (progress > 0)    return ProjectStatus.PENDING
  return ProjectStatus.PENDING
}

const toArray = <T,>(res: any): T[] =>
  Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : []

const projectService = {
  /**
   * Construit les programmes à partir des données réelles. Chaque source est
   * indépendante (Promise.allSettled) : un service momentanément indisponible
   * ne vide pas toute la page.
   */
  async getAll(): Promise<Project[]> {
    const [usersR, missionsR, vehiculesR, interventionsR, otR, facturesR, clientsR, echeancesR] =
      await Promise.allSettled([
        userService.getAllUsers(),
        missionService.getAll(),
        vehiculeService.getAll(),
        interventionService.getAll({ pageSize: 500 }),
        ordreTravailService.getAll({ pageSize: 500 }),
        factureService.getAll(1, 500),
        clientService.getAll(),
        api.get('/echeances').then(r => r.data),
      ])

    const users        = usersR.status === 'fulfilled' ? usersR.value : []
    const missions     = (missionsR.status === 'fulfilled' ? missionsR.value : []) as Mission[]
    const vehicules    = vehiculesR.status === 'fulfilled' ? vehiculesR.value : []
    const interventions = toArray<any>(interventionsR.status === 'fulfilled' ? interventionsR.value : [])
    const ordres       = toArray<any>(otR.status === 'fulfilled' ? otR.value : [])
    const factures     = facturesR.status === 'fulfilled' ? (facturesR.value.items ?? []) : []
    const clients      = clientsR.status === 'fulfilled' ? clientsR.value : []
    const echeances    = toArray<any>(echeancesR.status === 'fulfilled' ? echeancesR.value : [])

    // ── Équipes : vrais comptes, choisis selon les rôles utiles ─────────────
    const parRole = (...roles: string[]) =>
      users.filter(u => roles.includes(u.role)).slice(0, 4).map(toMember)
    const pilote = (...roles: string[]) => {
      const u = users.find(x => roles.includes(x.role))
      return u ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || u.email : '—'
    }

    const equipeExploitation = parRole('GESTIONNAIRE', 'ADMIN', 'ADMINISTRATEUR')
    const equipeAtelier      = parRole('TECHNICIEN', 'GESTIONNAIRE')
    const equipeConduite     = parRole('CHAUFFEUR')
    const equipeCommerce     = parRole('GESTIONNAIRE', 'ADMIN')

    // ── Mesures réelles ────────────────────────────────────────────────────
    const missionsActives   = missions.filter(m => m.statut !== StatutMission.ANNULEE)
    const missionsAffectees = missionsActives.filter(m => m.employeeId != null && m.vehiculeId != null)
    const missionsTerminees = missions.filter(m => m.statut === StatutMission.TERMINEE)
    const missionsSuivies   = missionsActives.filter(m => m.vehiculeId != null)

    const interventionsPrev  = interventions.filter(i => i.typeIntervention === 'PREVENTIVE')
    const interventionsPrevOk = interventionsPrev.filter(i => i.statut === 'TERMINEE')

    const otTermines = ordres.filter(o => o.statut === 'TERMINE')

    const echeancesValides = echeances.filter(e => (e.joursRestants ?? 0) >= 0)
    const echeancesExpirees = echeances.length - echeancesValides.length

    const facturesPayees = factures.filter((f: any) => f.statut === 'PAYEE')
    const facturesRetard = factures.filter((f: any) => f.statut === 'EN_RETARD')

    const clientsActifs = new Set(missions.map(m => m.clientIdUtilisateur).filter(Boolean)).size

    const vehiculesDispo = vehicules.filter(v => v.statut === 'DISPONIBLE').length

    const programmes: Project[] = [
      {
        id: 1,
        title: 'Conformité documentaire du parc',
        category: 'Conformité & sécurité',
        description: 'Maintenir à jour les assurances, visites techniques et cartes grises de l’ensemble des véhicules afin qu’aucun ne circule hors règle.',
        mesure: 'Part des échéances encore valides',
        progress: pct(echeancesValides.length, echeances.length),
        tasksDone: echeancesValides.length, tasksTotal: echeances.length,
        indicateur: { label: 'Échéances dépassées', value: String(echeancesExpirees) },
        status: statutDe(pct(echeancesValides.length, echeances.length), echeancesExpirees > 0),
        team: equipeExploitation, lead: pilote('GESTIONNAIRE', 'ADMIN'),
      },
      {
        id: 2,
        title: 'Plan de maintenance préventive',
        category: 'Maintenance',
        description: 'Réaliser les entretiens planifiés du parc pour réduire les immobilisations et les pannes en exploitation.',
        mesure: 'Interventions préventives réalisées',
        progress: pct(interventionsPrevOk.length, interventionsPrev.length),
        tasksDone: interventionsPrevOk.length, tasksTotal: interventionsPrev.length,
        indicateur: { label: 'Interventions au total', value: String(interventions.length) },
        status: statutDe(pct(interventionsPrevOk.length, interventionsPrev.length)),
        team: equipeAtelier, lead: pilote('TECHNICIEN', 'GESTIONNAIRE'),
      },
      {
        id: 3,
        title: 'Traitement des ordres de travail',
        category: 'Atelier',
        description: 'Clôturer les ordres de travail ouverts à l’atelier et fluidifier le passage des véhicules en réparation.',
        mesure: 'Ordres de travail clôturés',
        progress: pct(otTermines.length, ordres.length),
        tasksDone: otTermines.length, tasksTotal: ordres.length,
        indicateur: { label: 'Ordres ouverts', value: String(ordres.length - otTermines.length) },
        status: statutDe(pct(otTermines.length, ordres.length)),
        team: equipeAtelier, lead: pilote('TECHNICIEN', 'GESTIONNAIRE'),
      },
      {
        id: 4,
        title: 'Affectation des missions',
        category: 'Exploitation',
        description: 'Attribuer un chauffeur et un véhicule à chaque mission planifiée afin qu’aucune commande client ne reste sans ressource.',
        mesure: 'Missions dotées d’un chauffeur et d’un véhicule',
        progress: pct(missionsAffectees.length, missionsActives.length),
        tasksDone: missionsAffectees.length, tasksTotal: missionsActives.length,
        indicateur: { label: 'Missions en attente', value: String(missionsActives.length - missionsAffectees.length) },
        status: statutDe(pct(missionsAffectees.length, missionsActives.length)),
        team: equipeExploitation, lead: pilote('GESTIONNAIRE', 'ADMIN'),
      },
      {
        id: 5,
        title: 'Réalisation des transports',
        category: 'Exploitation',
        description: 'Mener à bien les transports engagés jusqu’à leur livraison et clôturer les missions terminées.',
        mesure: 'Missions livrées',
        progress: pct(missionsTerminees.length, missionsActives.length),
        tasksDone: missionsTerminees.length, tasksTotal: missionsActives.length,
        indicateur: { label: 'Transports en cours', value: String(missionsActives.filter(m => m.statut === StatutMission.EN_COURS).length) },
        status: statutDe(pct(missionsTerminees.length, missionsActives.length)),
        team: equipeConduite.length ? equipeConduite : equipeExploitation, lead: pilote('GESTIONNAIRE', 'ADMIN'),
      },
      {
        id: 6,
        title: 'Recouvrement des factures',
        category: 'Finance',
        description: 'Encaisser les factures émises auprès des clients et limiter les retards de paiement.',
        mesure: 'Factures encaissées',
        progress: pct(facturesPayees.length, factures.length),
        tasksDone: facturesPayees.length, tasksTotal: factures.length,
        indicateur: { label: 'Factures en retard', value: String(facturesRetard.length) },
        status: statutDe(pct(facturesPayees.length, factures.length), facturesRetard.length > 0),
        team: equipeCommerce, lead: pilote('GESTIONNAIRE', 'ADMIN'),
      },
      {
        id: 7,
        title: 'Développement du portefeuille clients',
        category: 'Commercial',
        description: 'Transformer les comptes clients enregistrés en clients actifs ayant confié au moins un transport à XPARK.',
        mesure: 'Clients ayant commandé au moins une mission',
        progress: pct(clientsActifs, clients.length),
        tasksDone: clientsActifs, tasksTotal: clients.length,
        indicateur: { label: 'Comptes clients', value: String(clients.length) },
        status: statutDe(pct(clientsActifs, clients.length)),
        team: equipeCommerce, lead: pilote('GESTIONNAIRE', 'ADMIN'),
      },
      {
        id: 8,
        title: 'Disponibilité de la flotte',
        category: 'Flotte',
        description: 'Maintenir le maximum de véhicules en état de rouler pour absorber la demande de transport.',
        mesure: 'Véhicules disponibles',
        progress: pct(vehiculesDispo, vehicules.length),
        tasksDone: vehiculesDispo, tasksTotal: vehicules.length,
        indicateur: { label: 'Véhicules immobilisés', value: String(vehicules.length - vehiculesDispo) },
        status: statutDe(pct(vehiculesDispo, vehicules.length)),
        team: equipeAtelier, lead: pilote('GESTIONNAIRE', 'ADMIN'),
      },
      {
        id: 9,
        title: 'Suivi GPS des transports',
        category: 'Qualité de service',
        description: 'Assurer le suivi en direct des transports pour informer les clients de l’avancement de leurs livraisons.',
        mesure: 'Missions rattachées à un véhicule suivi',
        progress: pct(missionsSuivies.length, missionsActives.length),
        tasksDone: missionsSuivies.length, tasksTotal: missionsActives.length,
        indicateur: { label: 'Transports sans suivi', value: String(missionsActives.length - missionsSuivies.length) },
        status: statutDe(pct(missionsSuivies.length, missionsActives.length)),
        team: equipeExploitation, lead: pilote('GESTIONNAIRE', 'ADMIN'),
      },
    ]

    // Un programme sans aucune donnée mesurable n'est pas affiché : mieux vaut
    // ne rien montrer qu'un « 0/0 » trompeur.
    return programmes.filter(p => p.tasksTotal > 0)
  },

  async getById(id: number): Promise<Project | undefined> {
    return (await this.getAll()).find(p => p.id === id)
  },

  computeStats(projects: Project[]): ProjectStats {
    const actifs   = projects.filter(p => p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.IN_REVIEW).length
    const termines = projects.filter(p => p.status === ProjectStatus.COMPLETED).length
    const enRetard = projects.filter(p => p.status === ProjectStatus.DELAYED).length
    const avgProgress = projects.length
      ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0
    return { total: projects.length, actifs, termines, enRetard, avgProgress }
  },
}

export default projectService
