import api from '@/lib/axiosConfig'
import { EventInput } from '@fullcalendar/core'
import missionService from './missionService'
import interventionService from './interventionService'
import ordreTravailService from './ordreTravailService'
import alerteService from './alerteService'
import transportRequestService from './transportRequestService'
import type { Mission } from '@/types/mission'
import type { TransportRequest } from '@/types/transportRequest'
import type { Intervention } from './interventionService'
import type { OrdreTravail } from './ordreTravailService'
import type { Alerte } from './alerteService'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Calendrier métier XPARK — agrégateur multi-microservices
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Décision d'architecture : PAS de microservice « Calendar » ni de table
 * d'événements. Un événement de calendrier n'est pas un objet métier propre —
 * c'est une PROJECTION en lecture d'objets qui vivent déjà dans leur service
 * (Mission, Maintenance, Fleet, Alerts). Créer une table dupliquerait la
 * logique métier et introduirait un problème de synchronisation permanent.
 *
 * On agrège donc côté client, en réutilisant les services existants — donc
 * aussi leur RBAC, leur pagination et leurs contrats, sans les redéfinir.
 * Seule exception : Fleet expose désormais /api/echeances, ajouté parce que
 * les échéances n'étaient lisibles que véhicule par véhicule (N+1).
 *
 * Résilience : `Promise.allSettled` — si un microservice est indisponible, le
 * calendrier affiche les autres sources au lieu de rester vide, et signale les
 * sources en échec.
 */

// ── Types d'événement ────────────────────────────────────────────────────────
export type CalendarEventType =
  | 'MISSION'           // déplacement interne
  | 'LIVRAISON'         // mission rattachée à un client
  | 'INTERVENTION'      // intervention de maintenance (préventive/curative)
  | 'ORDRE_TRAVAIL'     // ordre de travail atelier
  | 'ASSURANCE'         // expiration d'assurance
  | 'VISITE_TECHNIQUE'  // visite technique
  | 'DOCUMENT'          // carte grise, vignette, permis de circuler…
  | 'DEMANDE_CLIENT'    // rendez-vous / devis client
  | 'ALERTE'            // alerte générée par la plateforme

/** Libellés d'affichage (FR) — source unique pour les filtres et la légende. */
export const TYPE_LABELS: Record<CalendarEventType, string> = {
  MISSION:          'Missions',
  LIVRAISON:        'Livraisons client',
  INTERVENTION:     'Interventions',
  ORDRE_TRAVAIL:    'Ordres de travail',
  ASSURANCE:        'Assurances',
  VISITE_TECHNIQUE: 'Visites techniques',
  DOCUMENT:         'Documents véhicule',
  DEMANDE_CLIENT:   'Demandes client',
  ALERTE:           'Alertes',
}

/** Couleurs = classes du design system existant, pas de nouvelle palette. */
export const TYPE_COLORS: Record<CalendarEventType, string> = {
  MISSION:          'bg-info',
  LIVRAISON:        'bg-primary',
  INTERVENTION:     'bg-warning',
  ORDRE_TRAVAIL:    'bg-secondary',
  ASSURANCE:        'bg-danger',
  VISITE_TECHNIQUE: 'bg-danger',
  DOCUMENT:         'bg-dark',
  DEMANDE_CLIENT:   'bg-success',
  ALERTE:           'bg-danger',
}

/** Route du module d'origine — permet « ouvrir dans le module ». */
const TYPE_ROUTES: Record<CalendarEventType, string> = {
  MISSION:          '/gestion/missions',
  LIVRAISON:        '/gestion/missions',
  INTERVENTION:     '/maintenance/interventions',
  ORDRE_TRAVAIL:    '/maintenance/ordres-travail',
  ASSURANCE:        '/gestion/vehicules',
  VISITE_TECHNIQUE: '/gestion/vehicules',
  DOCUMENT:         '/gestion/vehicules',
  DEMANDE_CLIENT:   '/gestion/demandes-transport',
  ALERTE:           '/alertes',
}

/** Métadonnées portées par chaque événement (extendedProps FullCalendar). */
export interface XparkEventProps {
  type:            CalendarEventType
  refId:           number
  module:          string
  statut?:         string
  description?:    string
  vehiculeId?:     number
  immatriculation?: string
  employeeId?:     number
  chauffeurNom?:   string
  clientId?:       number
  clientNom?:      string
}

/** Échéance renvoyée par Fleet (/api/echeances). */
export interface Echeance {
  source:          'DOCUMENT' | 'ASSURANCE'
  refId:           number
  type:            string
  libelle:         string
  reference:       string
  dateExpiration:  string
  joursRestants:   number
  vehiculeId:      number
  immatriculation: string
  marque:          string
  modele:          string
}

export interface CalendarLoadResult {
  events:         EventInput[]
  failedSources:  string[]   // sources indisponibles, pour prévenir l'admin
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const build = (
  id: string, title: string, start?: string | null,
  end: string | null | undefined, type: CalendarEventType,
  props: Omit<XparkEventProps, 'type' | 'module'>,
  allDay = false,
): EventInput | null => {
  if (!start) return null                       // sans date, pas d'événement
  return {
    id,
    title,
    start,
    ...(end ? { end } : {}),
    allDay,
    className: TYPE_COLORS[type],
    extendedProps: { ...props, type, module: TYPE_ROUTES[type] } as XparkEventProps,
  }
}

/** Déballe les réponses paginées `{ items }` comme les tableaux bruts. */
const toArray = <T,>(res: any): T[] =>
  Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : []

// ── Convertisseurs par source ───────────────────────────────────────────────
const fromMissions = (missions: Mission[]): EventInput[] =>
  missions.map(m => {
    const estLivraison = m.clientIdUtilisateur != null
    const trajet = m.villeDepart && m.villeArrivee
      ? `${m.villeDepart} → ${m.villeArrivee}`
      : m.destination
    return build(
      `mission-${m.idMission}`,
      `${estLivraison ? '📦' : '🚚'} ${trajet}`,
      m.dateDepart, m.dateRetour,
      estLivraison ? 'LIVRAISON' : 'MISSION',
      {
        refId:           m.idMission,
        statut:          m.statut,
        description:     m.objetMission,
        vehiculeId:      m.vehiculeId ?? undefined,
        immatriculation: m.vehiculeImmatriculation,
        employeeId:      m.employeeId ?? undefined,
        chauffeurNom:    m.chauffeurNom,
        clientId:        m.clientIdUtilisateur ?? undefined,
        clientNom:       m.clientNom ?? undefined,
      },
    )
  }).filter(Boolean) as EventInput[]

const fromInterventions = (list: Intervention[]): EventInput[] =>
  list.map(i => build(
    `intervention-${i.idIntervention}`,
    `🔧 ${i.typeIntervention === 'PREVENTIVE' ? 'Préventive' : 'Curative'} — ${i.vehiculeImmatriculation}`,
    i.dateIntervention, i.dateFinIntervention,
    'INTERVENTION',
    {
      refId:           i.idIntervention,
      statut:          i.statut,
      description:     i.description,
      vehiculeId:      i.vehiculeId,
      immatriculation: i.vehiculeImmatriculation,
      employeeId:      i.technicienId,
    },
  )).filter(Boolean) as EventInput[]

const fromOrdresTravail = (list: OrdreTravail[]): EventInput[] =>
  list.map(o => build(
    `ordre-${o.idOrdreTravail}`,
    `📋 OT ${o.reference} — ${o.vehiculeImmatriculation}`,
    o.dateDebut ?? o.dateCreation, o.dateFin,
    'ORDRE_TRAVAIL',
    {
      refId:           o.idOrdreTravail,
      statut:          o.statut,
      description:     o.description,
      vehiculeId:      o.vehiculeId,
      immatriculation: o.vehiculeImmatriculation,
      employeeId:      o.technicienId,
      chauffeurNom:    [o.technicienPrenom, o.technicienNom].filter(Boolean).join(' ') || undefined,
    },
  )).filter(Boolean) as EventInput[]

const fromEcheances = (list: Echeance[]): EventInput[] =>
  list.map(e => {
    const type: CalendarEventType =
      e.type === 'ASSURANCE'        ? 'ASSURANCE'
      : e.type === 'VISITE_TECHNIQUE' ? 'VISITE_TECHNIQUE'
      : 'DOCUMENT'
    return build(
      `echeance-${e.source}-${e.refId}`,
      `${e.joursRestants < 0 ? '⚠️' : '📅'} ${e.libelle}`,
      e.dateExpiration, null, type,
      {
        refId:           e.refId,
        statut:          e.joursRestants < 0 ? 'EXPIREE' : 'VALIDE',
        description:     `Réf. ${e.reference} — ${e.marque} ${e.modele} · ${
                            e.joursRestants < 0
                              ? `expirée depuis ${Math.abs(e.joursRestants)} j`
                              : `expire dans ${e.joursRestants} j`}`,
        vehiculeId:      e.vehiculeId,
        immatriculation: e.immatriculation,
      },
      true,   // échéance = journée entière
    )
  }).filter(Boolean) as EventInput[]

const fromDemandes = (list: TransportRequest[]): EventInput[] =>
  list.map(d => build(
    `demande-${d.idTransportRequest}`,
    `🤝 ${d.villeDepart} → ${d.villeArrivee}`,
    d.dateSouhaitee, null, 'DEMANDE_CLIENT',
    {
      refId:       d.idTransportRequest,
      statut:      d.statut,
      description: d.cargoDescription,
      clientId:    d.clientIdUtilisateur,
      clientNom:   d.clientNom ?? undefined,
    },
    true,
  )).filter(Boolean) as EventInput[]

const fromAlertes = (list: Alerte[]): EventInput[] =>
  list.map(a => build(
    `alerte-${a.idAlerte}`,
    `🔔 ${a.message}`,
    a.dateCreation, null, 'ALERTE',
    {
      refId:       a.idAlerte,
      statut:      a.statut,
      description: `${a.typeAlerte} · priorité ${a.priorite}`,
      vehiculeId:  a.vehiculeId,
    },
    true,
  )).filter(Boolean) as EventInput[]

// ── Service ─────────────────────────────────────────────────────────────────
const calendarService = {
  /**
   * Charge tous les événements métier. Chaque source est indépendante :
   * une source en échec n'empêche pas les autres de s'afficher.
   */
  async getEvents(start?: Date, end?: Date): Promise<CalendarLoadResult> {
    const params: Record<string, string> = {}
    if (start) params.start = start.toISOString()
    if (end)   params.end   = end.toISOString()

    const sources = [
      { nom: 'Missions',          charger: () => missionService.getAll() },
      { nom: 'Interventions',     charger: () => interventionService.getAll({ pageSize: 500 }) },
      { nom: 'Ordres de travail', charger: () => ordreTravailService.getAll({ pageSize: 500 }) },
      { nom: 'Échéances flotte',  charger: () => api.get('/echeances', { params }).then(r => r.data) },
      { nom: 'Demandes client',   charger: () => transportRequestService.getAll() },
      { nom: 'Alertes',           charger: () => alerteService.getAll() },
    ]

    const resultats = await Promise.allSettled(sources.map(s => s.charger()))

    const events: EventInput[] = []
    const failedSources: string[] = []

    resultats.forEach((r, i) => {
      if (r.status === 'rejected') { failedSources.push(sources[i].nom); return }
      const data = r.value
      switch (i) {
        case 0: events.push(...fromMissions(toArray<Mission>(data)));            break
        case 1: events.push(...fromInterventions(toArray<Intervention>(data)));  break
        case 2: events.push(...fromOrdresTravail(toArray<OrdreTravail>(data)));  break
        case 3: events.push(...fromEcheances(toArray<Echeance>(data)));          break
        case 4: events.push(...fromDemandes(toArray<TransportRequest>(data)));   break
        case 5: events.push(...fromAlertes(toArray<Alerte>(data)));              break
      }
    })

    return { events, failedSources }
  },
}

export default calendarService
