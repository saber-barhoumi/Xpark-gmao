import { Badge, Col, Row } from 'react-bootstrap'
import DataTable, { type Colonne } from './DataTable'
import { StatutMission, type Mission } from '@/types/mission'
import type { AnalyticsData } from './useAnalyticsData'

/**
 * Tableaux détaillés des Analyses.
 *
 * Les graphiques donnent la tendance ; ils ne permettent ni de lire une valeur
 * précise ni de retrouver une ligne. Ces tableaux exposent les mêmes données
 * (déjà filtrées par la barre de filtres) sous forme consultable : recherche,
 * tri, filtre et pagination. Le contenu financier suit le RBAC.
 */

const tnd = (v: number) => `${Math.round(v).toLocaleString('fr-FR')} TND`
const km  = (v: number) => `${Math.round(v).toLocaleString('fr-FR')} km`
const dateFr = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const STATUT_VARIANT: Record<string, string> = {
  EN_ATTENTE: 'warning', EN_COURS: 'primary', TERMINEE: 'success', ANNULEE: 'danger',
}

interface Props {
  data:   AnalyticsData
  stats:  any
  perms:  { finance?: boolean; fleet?: boolean; maintenance?: boolean; fuel?: boolean }
}

export default function AnalyticsTables({ data, stats, perms }: Props) {
  // ── Missions ────────────────────────────────────────────────────────────
  const colMissions: Colonne<Mission>[] = [
    { cle: 'id', titre: 'N°', rendu: m => `#${m.idMission}`, valeur: m => m.idMission },
    { cle: 'trajet', titre: 'Trajet',
      rendu: m => <span>{m.villeDepart || '—'} → {m.villeArrivee || m.destination}</span>,
      valeur: m => `${m.villeDepart ?? ''}${m.villeArrivee ?? m.destination ?? ''}` },
    { cle: 'client', titre: 'Client', rendu: m => m.clientNom || <span className="text-muted">Interne</span>,
      valeur: m => m.clientNom ?? '' },
    { cle: 'chauffeur', titre: 'Chauffeur',
      rendu: m => m.chauffeurNom || <span className="text-muted">Non affecté</span>,
      valeur: m => m.chauffeurNom ?? '' },
    { cle: 'vehicule', titre: 'Véhicule',
      rendu: m => m.vehiculeImmatriculation || <span className="text-muted">—</span>,
      valeur: m => m.vehiculeImmatriculation ?? '' },
    { cle: 'statut', titre: 'Statut',
      rendu: m => <Badge bg={STATUT_VARIANT[m.statut] ?? 'secondary'}>{String(m.statut).replace('_', ' ')}</Badge>,
      valeur: m => String(m.statut) },
    { cle: 'distance', titre: 'Distance', align: 'end',
      rendu: m => km(m.distance || 0), valeur: m => m.distance || 0 },
    { cle: 'depart', titre: 'Départ', rendu: m => dateFr(m.dateDepart), valeur: m => m.dateDepart ?? '' },
    ...(perms.finance ? [{
      cle: 'cout', titre: 'Montant', align: 'end' as const,
      rendu: (m: Mission) => (m.coutTotal > 0 ? tnd(m.coutTotal) : <span className="text-muted">—</span>),
      valeur: (m: Mission) => m.coutTotal || 0,
    }] : []),
  ]

  // ── Performance des chauffeurs / véhicules (déjà agrégée) ───────────────
  type Perf = { label: string; missions: number; km: number }
  const colPerf = (entete: string): Colonne<Perf>[] => [
    { cle: 'label', titre: entete, rendu: p => <strong>{p.label}</strong>, valeur: p => p.label },
    { cle: 'missions', titre: 'Missions', align: 'end', rendu: p => p.missions, valeur: p => p.missions },
    { cle: 'km', titre: 'Distance', align: 'end', rendu: p => km(p.km), valeur: p => p.km },
    { cle: 'moy', titre: 'Moy. / mission', align: 'end',
      rendu: p => (p.missions ? km(p.km / p.missions) : '—'),
      valeur: p => (p.missions ? p.km / p.missions : 0) },
  ]

  // ── Flotte ──────────────────────────────────────────────────────────────
  const colVehicules: Colonne<any>[] = [
    { cle: 'immat', titre: 'Immatriculation', rendu: v => <strong>{v.immatriculation}</strong>, valeur: v => v.immatriculation },
    { cle: 'type', titre: 'Type', rendu: v => v.typeVehicule || '—', valeur: v => v.typeVehicule ?? '' },
    { cle: 'carburant', titre: 'Carburant', rendu: v => v.typeCarburant || '—', valeur: v => v.typeCarburant ?? '' },
    { cle: 'statut', titre: 'État',
      rendu: v => <Badge bg={v.statut === 'DISPONIBLE' ? 'success' : v.statut === 'EN_MISSION' ? 'primary' : 'warning'}>
        {String(v.statut ?? '').replace('_', ' ')}</Badge>,
      valeur: v => v.statut ?? '' },
    { cle: 'km', titre: 'Kilométrage', align: 'end', rendu: v => km(v.kilometrage || 0), valeur: v => v.kilometrage || 0 },
    { cle: 'conso', titre: 'Conso.', align: 'end',
      rendu: v => (v.consommationMoyenne ? `${v.consommationMoyenne.toFixed(1)} L/100` : '—'),
      valeur: v => v.consommationMoyenne || 0 },
  ]

  // ── Maintenance ─────────────────────────────────────────────────────────
  const colInterventions: Colonne<any>[] = [
    { cle: 'id', titre: 'N°', rendu: i => `#${i.idIntervention}`, valeur: i => i.idIntervention },
    { cle: 'vehicule', titre: 'Véhicule', rendu: i => i.vehiculeImmatriculation || '—', valeur: i => i.vehiculeImmatriculation ?? '' },
    { cle: 'type', titre: 'Type',
      rendu: i => <Badge bg={i.typeIntervention === 'PREVENTIVE' ? 'success' : 'warning'}>
        {i.typeIntervention === 'PREVENTIVE' ? 'Préventive' : 'Curative'}</Badge>,
      valeur: i => i.typeIntervention ?? '' },
    { cle: 'statut', titre: 'Statut', rendu: i => String(i.statut ?? '').replace('_', ' '), valeur: i => i.statut ?? '' },
    { cle: 'date', titre: 'Date', rendu: i => dateFr(i.dateIntervention), valeur: i => i.dateIntervention ?? '' },
    ...(perms.finance ? [{
      cle: 'cout', titre: 'Coût', align: 'end' as const,
      rendu: (i: any) => tnd(i.cout || 0), valeur: (i: any) => i.cout || 0,
    }] : []),
  ]

  // ── Carburant par véhicule (direction) ──────────────────────────────────
  const topCarburant = (data.carburant?.topVehiculesParCout ?? []).map(v => ({
    immat: v.vehiculeImmatriculation, cout: v.coutTotal, km: v.kilometrageTotal,
  }))
  const colCarburant: Colonne<any>[] = [
    { cle: 'immat', titre: 'Véhicule', rendu: c => <strong>{c.immat}</strong>, valeur: c => c.immat },
    { cle: 'cout', titre: 'Coût carburant', align: 'end', rendu: c => tnd(c.cout), valeur: c => c.cout },
    { cle: 'km', titre: 'Distance', align: 'end', rendu: c => km(c.km || 0), valeur: c => c.km || 0 },
    { cle: 'ratio', titre: 'Coût / 100 km', align: 'end',
      rendu: c => (c.km > 0 ? tnd((c.cout / c.km) * 100) : '—'),
      valeur: c => (c.km > 0 ? (c.cout / c.km) * 100 : 0) },
  ]

  // ── Clients (direction) ─────────────────────────────────────────────────
  const clientsRevenus = (stats.topClients ?? []) as { label: string; value: number }[]
  const missionsParClient = new Map<string, number>(
    (stats.missionsParClient ?? []).map((c: any) => [c.label, c.value]))
  const lignesClients = clientsRevenus.map(c => ({
    client: c.label, revenus: c.value, missions: missionsParClient.get(c.label) ?? 0,
  }))
  const colClients: Colonne<any>[] = [
    { cle: 'client', titre: 'Client', rendu: c => <strong>{c.client}</strong>, valeur: c => c.client },
    { cle: 'missions', titre: 'Missions', align: 'end', rendu: c => c.missions, valeur: c => c.missions },
    { cle: 'revenus', titre: 'Revenus', align: 'end', rendu: c => tnd(c.revenus), valeur: c => c.revenus },
    { cle: 'panier', titre: 'Panier moyen', align: 'end',
      rendu: c => (c.missions ? tnd(c.revenus / c.missions) : '—'),
      valeur: c => (c.missions ? c.revenus / c.missions : 0) },
  ]

  return (
    <div className="mb-4">
      <h5 className="text-uppercase fw-bold text-muted mb-3 d-flex align-items-center">
        <span className="bg-dark-subtle text-dark avatar-xs rounded-circle d-flex align-items-center justify-content-center me-2">
          <i className="ri-table-line" />
        </span>
        Données détaillées
      </h5>

      <Row className="g-4">
        <Col xs={12}>
          <DataTable
            titre="Missions" icone="ri-truck-line"
            colonnes={colMissions} lignes={data.missions} pageSize={8}
            recherchable={m => `${m.idMission} ${m.villeDepart ?? ''} ${m.villeArrivee ?? ''} ${m.destination ?? ''} ${m.clientNom ?? ''} ${m.chauffeurNom ?? ''} ${m.vehiculeImmatriculation ?? ''}`}
            filtre={{ label: 'Tous les statuts', options: Object.values(StatutMission).map(String), valeur: m => String(m.statut) }}
          />
        </Col>

        {stats.perfChauffeurs?.length > 0 && (
          <Col xl={6}>
            <DataTable titre="Performance des chauffeurs" icone="ri-user-star-line"
              colonnes={colPerf('Chauffeur')} lignes={stats.perfChauffeurs} pageSize={6}
              recherchable={p => p.label} />
          </Col>
        )}
        {stats.perfVehicules?.length > 0 && (
          <Col xl={6}>
            <DataTable titre="Performance des véhicules" icone="ri-truck-line"
              colonnes={colPerf('Véhicule')} lignes={stats.perfVehicules} pageSize={6}
              recherchable={p => p.label} />
          </Col>
        )}

        {perms.fleet && data.vehicules.length > 0 && (
          <Col xl={perms.finance ? 6 : 12}>
            <DataTable titre="Parc de véhicules" icone="ri-car-line"
              colonnes={colVehicules} lignes={data.vehicules} pageSize={6}
              recherchable={v => `${v.immatriculation} ${v.typeVehicule ?? ''} ${v.typeCarburant ?? ''} ${v.statut ?? ''}`}
              filtre={{ label: 'Tous les états',
                options: [...new Set(data.vehicules.map(v => String(v.statut ?? '')).filter(Boolean))],
                valeur: v => String(v.statut ?? '') }} />
          </Col>
        )}

        {perms.finance && lignesClients.length > 0 && (
          <Col xl={6}>
            <DataTable titre="Clients (privé direction)" icone="ri-building-line"
              colonnes={colClients} lignes={lignesClients} pageSize={6}
              recherchable={c => c.client} />
          </Col>
        )}

        {perms.maintenance && data.interventions.length > 0 && (
          <Col xl={perms.fuel ? 6 : 12}>
            <DataTable titre="Interventions de maintenance" icone="ri-tools-line"
              colonnes={colInterventions} lignes={data.interventions} pageSize={6}
              recherchable={i => `${i.idIntervention} ${i.vehiculeImmatriculation ?? ''} ${i.typeIntervention ?? ''} ${i.statut ?? ''} ${i.description ?? ''}`}
              filtre={{ label: 'Tous les types',
                options: [...new Set(data.interventions.map((i: any) => String(i.typeIntervention ?? '')).filter(Boolean))],
                valeur: i => String(i.typeIntervention ?? '') }} />
          </Col>
        )}

        {perms.fuel && topCarburant.length > 0 && (
          <Col xl={6}>
            <DataTable titre="Consommation carburant (privé direction)" icone="ri-gas-station-line"
              colonnes={colCarburant} lignes={topCarburant} pageSize={6}
              recherchable={c => c.immat} />
          </Col>
        )}
      </Row>
    </div>
  )
}
