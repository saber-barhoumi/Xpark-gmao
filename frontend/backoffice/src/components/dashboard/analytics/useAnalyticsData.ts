import { useCallback, useEffect, useMemo, useState } from 'react'
import { missionService } from '@/services/missionService'
import { vehiculeService, Vehicule } from '@/services/vehiculeService'
import { carburantService, CarburantStats } from '@/services/carburantService'
import { interventionService, Intervention } from '@/services/interventionService'
import { clientService, Client } from '@/services/clientService'
import profileService from '@/services/profileService'
import { Mission, StatutMission } from '@/types/mission'
import { AnalyticsPermissions } from './rbac'

/**
 * Agrégation des données réelles de la page Analyses.
 * Ne charge que ce que le rôle a le droit de voir (RBAC) : un chauffeur ne
 * déclenche même pas les appels finance/flotte/maintenance.
 */

const MOIS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

/** 6 derniers mois glissants — clés "annee-mois" + libellés français */
export function derniersMois(n = 6) {
  const out: { key: string; label: string }[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MOIS_FR[d.getMonth()] })
  }
  return out
}

export interface AnalyticsData {
  missions: Mission[]
  vehicules: Vehicule[]
  interventions: Intervention[]
  carburant: CarburantStats | null
  clients: Client[]
}

/** Filtres métier appliqués à l'ensemble des analyses. */
export interface AnalyticsFilters {
  clientId:    number | null
  employeeId:  number | null   // chauffeur
  vehiculeId:  number | null
  statut:      string          // '' = tous
  typeVehicule: string         // '' = tous
  ville:       string          // gouvernorat / ville d'arrivée, '' = toutes
  dateFrom:    string          // 'YYYY-MM-DD'
  dateTo:      string
}

export const FILTRES_VIDES: AnalyticsFilters = {
  clientId: null, employeeId: null, vehiculeId: null,
  statut: '', typeVehicule: '', ville: '', dateFrom: '', dateTo: '',
}

/**
 * @param enabled false = ne déclenche AUCUN appel réseau (le composant reçoit
 * alors les données d'un parent via la prop `shared` d'AnalyticsDashboard —
 * évite le double chargement quand le dashboard englobe les analyses).
 */
export function useAnalyticsData(perms: AnalyticsPermissions, enabled = true) {
  const [data, setData] = useState<AnalyticsData>({
    missions: [], vehicules: [], interventions: [], carburant: null, clients: [],
  })
  // Noms résolus à la volée pour les clients absents de /clients (ex. clients
  // auto-inscrits) — id → « Prénom Nom ». Complète la table clients.
  const [extraNames, setExtraNames] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<AnalyticsFilters>(FILTRES_VIDES)

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)

    const [missionsR, vehiculesR, interventionsR, carburantR, clientsR] = await Promise.allSettled([
      perms.operations ? missionService.getAll() : Promise.resolve([]),
      perms.fleet ? vehiculeService.getAll() : Promise.resolve([]),
      perms.maintenance ? interventionService.getAll({ pageSize: 500 }) : Promise.resolve(null),
      perms.fuel ? carburantService.getStats({}) : Promise.resolve(null),
      // Résout les noms de clients pour le « Top clients » (finance) ; ignoré si non autorisé.
      perms.finance ? clientService.getAll() : Promise.resolve([]),
    ])

    setData({
      missions: missionsR.status === 'fulfilled' ? (missionsR.value as Mission[]) : [],
      vehicules: vehiculesR.status === 'fulfilled' ? (vehiculesR.value as Vehicule[]) : [],
      interventions: interventionsR.status === 'fulfilled' && interventionsR.value
        ? ((interventionsR.value as any).items ?? interventionsR.value ?? [])
        : [],
      carburant: carburantR.status === 'fulfilled' ? (carburantR.value as CarburantStats | null) : null,
      clients: clientsR.status === 'fulfilled' ? (clientsR.value as Client[]) : [],
    })
    setLoading(false)

    // Résolution complémentaire des noms de clients (finance uniquement).
    // On ne résout QUE les ids présents dans des missions terminées facturées
    // et absents de /clients — quelques appels au plus, jamais un par mission.
    if (perms.finance) {
      const missions = missionsR.status === 'fulfilled' ? (missionsR.value as Mission[]) : []
      const known = new Set((clientsR.status === 'fulfilled' ? (clientsR.value as Client[]) : []).map(c => c.idUtilisateur))
      const manquants = [...new Set(missions
        .filter(m => m.statut === StatutMission.TERMINEE && (m.coutTotal ?? 0) > 0 && m.clientIdUtilisateur != null && !known.has(m.clientIdUtilisateur!))
        .map(m => m.clientIdUtilisateur as number))].slice(0, 15)

      if (manquants.length > 0) {
        const resolus: Record<number, string> = {}
        await Promise.allSettled(manquants.map(async id => {
          try {
            const p = await profileService.getProfile(id)
            const nom = `${p.prenom ?? ''} ${p.nom ?? ''}`.trim()
            if (nom) resolus[id] = nom
          } catch { /* id non résoluble → repli « Client #id » */ }
        }))
        setExtraNames(resolus)
      }
    }
  }, [perms, enabled])

  useEffect(() => { load() }, [load])

  /** Options de filtres déduites des données chargées (aucun appel en plus). */
  const filterOptions = useMemo(() => {
    const clients = new Map<number, string>()
    const chauffeurs = new Map<number, string>()
    const villes = new Set<string>()
    data.clients.forEach(c =>
      clients.set(c.idUtilisateur, `${c.prenom ?? ''} ${c.nom ?? ''}`.trim() || c.email))
    data.missions.forEach(m => {
      if (m.clientIdUtilisateur != null && !clients.has(m.clientIdUtilisateur)) {
        clients.set(m.clientIdUtilisateur,
          (m.clientNom || '').trim() || extraNames[m.clientIdUtilisateur] || `Client #${m.clientIdUtilisateur}`)
      }
      if (m.employeeId != null && !chauffeurs.has(m.employeeId)) {
        chauffeurs.set(m.employeeId, (m.chauffeurNom || '').trim() || `Chauffeur #${m.employeeId}`)
      }
      const v = (m.villeArrivee || m.destination || '').trim()
      if (v) villes.add(v)
    })
    const tri = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label)
    return {
      clients:    [...clients].map(([id, label]) => ({ id, label })).sort(tri),
      chauffeurs: [...chauffeurs].map(([id, label]) => ({ id, label })).sort(tri),
      vehicules:  data.vehicules.map(v => ({ id: v.idVehicule, label: v.immatriculation })).sort(tri),
      typesVehicule: [...new Set(data.vehicules.map(v => v.typeVehicule).filter(Boolean))].sort(),
      villes:     [...villes].sort((a, b) => a.localeCompare(b)),
    }
  }, [data, extraNames])

  /**
   * Application des filtres AVANT tout calcul : missions, véhicules et
   * interventions sont réduits au périmètre demandé, si bien que tous les
   * graphiques et indicateurs de la page racontent la même histoire.
   */
  const dataFiltree = useMemo<AnalyticsData>(() => {
    const f = filters
    const actif = f.clientId != null || f.employeeId != null || f.vehiculeId != null
      || !!f.statut || !!f.typeVehicule || !!f.ville || !!f.dateFrom || !!f.dateTo
    if (!actif) return data

    const typeParVehicule = new Map(data.vehicules.map(v => [v.idVehicule, v.typeVehicule]))

    const missions = data.missions.filter(m => {
      if (f.clientId   != null && m.clientIdUtilisateur !== f.clientId) return false
      if (f.employeeId != null && m.employeeId !== f.employeeId) return false
      if (f.vehiculeId != null && m.vehiculeId !== f.vehiculeId) return false
      if (f.statut && m.statut !== f.statut) return false
      if (f.ville && (m.villeArrivee || m.destination || '') !== f.ville) return false
      if (f.typeVehicule) {
        if (m.vehiculeId == null) return false
        if (typeParVehicule.get(m.vehiculeId) !== f.typeVehicule) return false
      }
      const jour = (m.dateDepart || '').slice(0, 10)
      if (f.dateFrom && jour && jour < f.dateFrom) return false
      if (f.dateTo   && jour && jour > f.dateTo) return false
      return true
    })

    const vehicules = data.vehicules.filter(v =>
      (f.vehiculeId == null || v.idVehicule === f.vehiculeId) &&
      (!f.typeVehicule || v.typeVehicule === f.typeVehicule))

    const interventions = data.interventions.filter(i => {
      if (f.vehiculeId != null && i.vehiculeId !== f.vehiculeId) return false
      if (f.typeVehicule && typeParVehicule.get(i.vehiculeId) !== f.typeVehicule) return false
      const jour = (i.dateIntervention || '').slice(0, 10)
      if (f.dateFrom && jour && jour < f.dateFrom) return false
      if (f.dateTo   && jour && jour > f.dateTo) return false
      return true
    })

    return { ...data, missions, vehicules, interventions }
  }, [data, filters])

  const isFiltered = useMemo(
    () => JSON.stringify(filters) !== JSON.stringify(FILTRES_VIDES), [filters])

  const setFilter = useCallback(
    <K extends keyof AnalyticsFilters>(cle: K, valeur: AnalyticsFilters[K]) =>
      setFilters(f => ({ ...f, [cle]: valeur })), [])
  const resetFilters = useCallback(() => setFilters(FILTRES_VIDES), [])

  /** Agrégats dérivés — recalculés à chaque changement de données ou de filtres */
  const stats = useMemo(() => {
    // Tout part des données FILTRÉES : un filtre s'applique donc à l'ensemble
    // des indicateurs et graphiques de la page, pas à un seul bloc.
    const { missions, vehicules, interventions } = dataFiltree
    const mois = derniersMois()

    // ── Opérations (visibles par tout le staff — aucun montant) ──
    const missionsParStatut = {
      enAttente: missions.filter(m => m.statut === StatutMission.EN_ATTENTE).length,
      enCours: missions.filter(m => m.statut === StatutMission.EN_COURS).length,
      terminees: missions.filter(m => m.statut === StatutMission.TERMINEE).length,
      annulees: missions.filter(m => m.statut === StatutMission.ANNULEE).length,
    }
    const missionsParMois = mois.map(mo => ({ label: mo.label, value: 0 }))
    for (const m of missions) {
      const d = new Date(m.dateDepart)
      const idx = mois.findIndex(mo => mo.key === `${d.getFullYear()}-${d.getMonth()}`)
      if (idx >= 0) missionsParMois[idx].value++
    }
    const distanceTotale = missions
      .filter(m => m.statut === StatutMission.TERMINEE)
      .reduce((s, m) => s + (m.distance || 0), 0)

    // ── Finance (direction uniquement) : revenus vs coûts réels / mois ──
    const revenusParMois = mois.map(mo => ({ label: mo.label, value: 0 }))
    for (const m of missions) {
      if (m.statut !== StatutMission.TERMINEE || !(m.coutTotal > 0)) continue
      const d = new Date(m.dateDepart)
      const idx = mois.findIndex(mo => mo.key === `${d.getFullYear()}-${d.getMonth()}`)
      if (idx >= 0) revenusParMois[idx].value += m.coutTotal
    }
    const coutsParMois = mois.map(mo => ({ label: mo.label, value: 0 }))
    // Coûts carburant (evolutionMensuelle "YYYY-MM" ou libellé) + coûts interventions
    for (const ev of data.carburant?.evolutionMensuelle ?? []) {
      const m = /^(\d{4})-(\d{2})/.exec(ev.mois)
      if (!m) continue
      const idx = mois.findIndex(mo => mo.key === `${Number(m[1])}-${Number(m[2]) - 1}`)
      if (idx >= 0) coutsParMois[idx].value += ev.coutTotal
    }
    for (const it of interventions) {
      const d = new Date(it.dateIntervention)
      const idx = mois.findIndex(mo => mo.key === `${d.getFullYear()}-${d.getMonth()}`)
      if (idx >= 0) coutsParMois[idx].value += it.cout || 0
    }

    // ── Flotte ──
    const vehiculesParStatut: Record<string, number> = {}
    for (const v of vehicules) {
      const s = v.statut || 'INCONNU'
      vehiculesParStatut[s] = (vehiculesParStatut[s] || 0) + 1
    }

    // ── Maintenance ──
    const interventionsParType: Record<string, number> = {}
    for (const it of interventions) {
      const t = it.typeIntervention || 'AUTRE'
      interventionsParType[t] = (interventionsParType[t] || 0) + 1
    }
    const coutMaintenance = interventions.reduce((s, it) => s + (it.cout || 0), 0)
    const interventionsParMois = mois.map(mo => ({ label: mo.label, value: 0 }))
    for (const it of interventions) {
      const d = new Date(it.dateIntervention)
      const idx = mois.findIndex(mo => mo.key === `${d.getFullYear()}-${d.getMonth()}`)
      if (idx >= 0) interventionsParMois[idx].value++
    }

    // ── Heatmap d'activité : jour de semaine × mois (quand part la flotte ?) ──
    const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const ORDRE_JOURS = [1, 2, 3, 4, 5, 6, 0] // Lun → Dim
    const heatmapActivite = ORDRE_JOURS.map(j => ({
      name: JOURS[j],
      data: mois.map(mo => ({ x: mo.label, y: 0 })),
    }))
    for (const m of missions) {
      if (m.statut === StatutMission.ANNULEE) continue
      const d = new Date(m.dateDepart)
      const idx = mois.findIndex(mo => mo.key === `${d.getFullYear()}-${d.getMonth()}`)
      if (idx < 0) continue
      const ligne = heatmapActivite[ORDRE_JOURS.indexOf(d.getDay())]
      if (ligne) ligne.data[idx].y++
    }

    // ── Pipeline missions (funnel) + taux de réalisation ──
    const affectees = missions.filter(m =>
      m.statut !== StatutMission.ANNULEE && (m.employeeId || m.statut !== StatutMission.EN_ATTENTE)).length
    const funnel = {
      recues: missions.length,
      affectees,
      enCours: missionsParStatut.enCours + missionsParStatut.terminees,
      terminees: missionsParStatut.terminees,
    }
    const denomRealisation = missions.length - missionsParStatut.annulees
    const tauxRealisation = denomRealisation > 0
      ? Math.round((missionsParStatut.terminees / denomRealisation) * 100) : 0

    // ── Top destinations (treemap) ──
    const destCount: Record<string, number> = {}
    for (const m of missions) {
      if (m.statut === StatutMission.ANNULEE) continue
      const dest = m.villeArrivee || m.destination || '?'
      destCount[dest] = (destCount[dest] || 0) + 1
    }
    const topDestinations = Object.entries(destCount)
      .map(([x, y]) => ({ x, y }))
      .sort((a, b) => b.y - a.y).slice(0, 8)

    // ── Top clients par revenus (privé direction) ──
    // On résout le vrai nom du client : d'abord le champ dénormalisé de la
    // mission, sinon la table clients (id → « Prénom Nom »), sinon un repli.
    const clientsById = new Map<number, string>()
    for (const c of data.clients) {
      clientsById.set(c.idUtilisateur, `${c.prenom ?? ''} ${c.nom ?? ''}`.trim() || c.email || `Client #${c.idUtilisateur}`)
    }
    const clientCA: Record<string, number> = {}
    for (const m of missions) {
      if (m.statut !== StatutMission.TERMINEE || !(m.coutTotal > 0)) continue
      const nom = (m.clientNom || '').trim()
        || (m.clientIdUtilisateur != null ? clientsById.get(m.clientIdUtilisateur) : undefined)
        || (m.clientIdUtilisateur != null ? extraNames[m.clientIdUtilisateur] : undefined)
        || (m.clientIdUtilisateur != null ? `Client #${m.clientIdUtilisateur}` : 'Interne')
      clientCA[nom] = (clientCA[nom] || 0) + m.coutTotal
    }
    const topClients = Object.entries(clientCA)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value).slice(0, 5)

    // ── Marge nette mensuelle (revenus - coûts) + flotte dispo ──
    const margeParMois = mois.map((mo, i) => ({
      label: mo.label,
      value: revenusParMois[i].value - coutsParMois[i].value,
    }))
    const totalVehicules = vehicules.length
    const tauxDisponibilite = totalVehicules > 0
      ? Math.round(((vehiculesParStatut['DISPONIBLE'] || 0) / totalVehicules) * 100) : 0

    // ── Indicateurs de gestion ──
    const revenusTotal = revenusParMois.reduce((s, m) => s + m.value, 0)
    const coutsTotal = coutsParMois.reduce((s, m) => s + m.value, 0)
    const panierMoyen = missionsParStatut.terminees > 0
      ? revenusParMois.reduce((s, m) => s + m.value, 0) / missionsParStatut.terminees : 0

    // ── Performance des chauffeurs (missions livrées + km parcourus) ──
    const parChauffeur = new Map<string, { missions: number; km: number }>()
    for (const m of missions) {
      if (m.employeeId == null || m.statut === StatutMission.ANNULEE) continue
      const nom = (m.chauffeurNom || '').trim() || `Chauffeur #${m.employeeId}`
      const cur = parChauffeur.get(nom) ?? { missions: 0, km: 0 }
      cur.missions++
      if (m.statut === StatutMission.TERMINEE) cur.km += m.distance || 0
      parChauffeur.set(nom, cur)
    }
    const perfChauffeurs = [...parChauffeur.entries()]
      .map(([label, v]) => ({ label, missions: v.missions, km: Math.round(v.km) }))
      .sort((a, b) => b.missions - a.missions).slice(0, 8)

    // ── Performance des véhicules (missions + km) ──
    const parVehicule = new Map<string, { missions: number; km: number }>()
    for (const m of missions) {
      if (m.vehiculeId == null || m.statut === StatutMission.ANNULEE) continue
      const label = m.vehiculeImmatriculation || `Véhicule #${m.vehiculeId}`
      const cur = parVehicule.get(label) ?? { missions: 0, km: 0 }
      cur.missions++
      if (m.statut === StatutMission.TERMINEE) cur.km += m.distance || 0
      parVehicule.set(label, cur)
    }
    const perfVehicules = [...parVehicule.entries()]
      .map(([label, v]) => ({ label, missions: v.missions, km: Math.round(v.km) }))
      .sort((a, b) => b.missions - a.missions).slice(0, 8)

    // ── Taux d'utilisation de la flotte : part des véhicules ayant servi ──
    const vehiculesUtilises = new Set(
      missions.filter(m => m.vehiculeId != null && m.statut !== StatutMission.ANNULEE)
              .map(m => m.vehiculeId as number)).size
    const tauxUtilisation = totalVehicules > 0
      ? Math.round((vehiculesUtilises / totalVehicules) * 100) : 0

    // ── Répartition du parc par type de véhicule ──
    const parTypeVehicule: Record<string, number> = {}
    for (const v of vehicules) {
      const t = v.typeVehicule || 'AUTRE'
      parTypeVehicule[t] = (parTypeVehicule[t] || 0) + 1
    }

    // ── Statistiques clients : nombre de missions par client ──
    const missionsParClientMap = new Map<string, number>()
    for (const m of missions) {
      if (m.clientIdUtilisateur == null || m.statut === StatutMission.ANNULEE) continue
      const nom = (m.clientNom || '').trim()
        || clientsById.get(m.clientIdUtilisateur)
        || extraNames[m.clientIdUtilisateur]
        || `Client #${m.clientIdUtilisateur}`
      missionsParClientMap.set(nom, (missionsParClientMap.get(nom) ?? 0) + 1)
    }
    const missionsParClient = [...missionsParClientMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value).slice(0, 6)

    return {
      perfChauffeurs,
      perfVehicules,
      tauxUtilisation,
      vehiculesUtilises,
      totalVehicules,
      parTypeVehicule,
      missionsParClient,
      mois,
      missionsParStatut,
      missionsParMois,
      distanceTotale,
      revenusParMois,
      coutsParMois,
      vehiculesParStatut,
      interventionsParType,
      interventionsParMois,
      coutMaintenance,
      heatmapActivite,
      funnel,
      tauxRealisation,
      topDestinations,
      topClients,
      margeParMois,
      tauxDisponibilite,
      revenusTotal,
      coutsTotal,
      panierMoyen,
    }
  }, [dataFiltree, extraNames])

  return {
    // `data` = périmètre filtré (ce que la page doit afficher) ;
    // `dataBrute` = tout, pour les compteurs de référence.
    data: dataFiltree, dataBrute: data,
    stats, loading, reload: load,
    filters, setFilter, resetFilters, isFiltered, filterOptions,
  }
}
