import { useCallback, useEffect, useMemo, useState } from 'react'
import kpiService, { KPI } from '@/services/kpiService'
import { missionService } from '@/services/missionService'
import { vehiculeService, Vehicule } from '@/services/vehiculeService'
import { carburantService, CarburantStats } from '@/services/carburantService'
import { interventionService, Intervention } from '@/services/interventionService'
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
  kpis: KPI[]
  missions: Mission[]
  vehicules: Vehicule[]
  interventions: Intervention[]
  carburant: CarburantStats | null
}

/**
 * @param enabled false = ne déclenche AUCUN appel réseau (le composant reçoit
 * alors les données d'un parent via la prop `shared` d'AnalyticsDashboard —
 * évite le double chargement quand le dashboard englobe les analyses).
 */
export function useAnalyticsData(perms: AnalyticsPermissions, enabled = true) {
  const [data, setData] = useState<AnalyticsData>({
    kpis: [], missions: [], vehicules: [], interventions: [], carburant: null,
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)

    const categories: string[] = []
    if (perms.operations) categories.push('MISSIONS')
    if (perms.fleet) categories.push('FLOTTE')
    if (perms.finance) categories.push('FINANCE')
    if (perms.maintenance) categories.push('MAINTENANCE')
    if (perms.fuel) categories.push('CARBURANT')

    const [kpisR, missionsR, vehiculesR, interventionsR, carburantR] = await Promise.allSettled([
      Promise.all(categories.map(c => kpiService.getParCategorie(c).catch(() => [] as KPI[]))),
      perms.operations ? missionService.getAll() : Promise.resolve([]),
      perms.fleet ? vehiculeService.getAll() : Promise.resolve([]),
      perms.maintenance ? interventionService.getAll({ pageSize: 500 }) : Promise.resolve(null),
      perms.fuel ? carburantService.getStats({}) : Promise.resolve(null),
    ])

    setData({
      kpis: kpisR.status === 'fulfilled' ? kpisR.value.flat() : [],
      missions: missionsR.status === 'fulfilled' ? (missionsR.value as Mission[]) : [],
      vehicules: vehiculesR.status === 'fulfilled' ? (vehiculesR.value as Vehicule[]) : [],
      interventions: interventionsR.status === 'fulfilled' && interventionsR.value
        ? ((interventionsR.value as any).items ?? interventionsR.value ?? [])
        : [],
      carburant: carburantR.status === 'fulfilled' ? (carburantR.value as CarburantStats | null) : null,
    })
    setLoading(false)
  }, [perms, enabled])

  useEffect(() => { load() }, [load])

  /** Agrégats dérivés — calculés une seule fois par chargement */
  const stats = useMemo(() => {
    const { missions, vehicules, interventions } = data
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
    const clientCA: Record<string, number> = {}
    for (const m of missions) {
      if (m.statut !== StatutMission.TERMINEE || !(m.coutTotal > 0)) continue
      const nom = (m.clientNom || '').trim() || (m.clientIdUtilisateur ? `Client #${m.clientIdUtilisateur}` : 'Interne')
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

    return {
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
  }, [data])

  return { data, stats, loading, reload: load }
}
