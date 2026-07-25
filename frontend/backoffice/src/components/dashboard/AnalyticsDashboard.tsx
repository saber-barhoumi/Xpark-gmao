import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Col, Row, Spinner } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ChartWidget from '@/components/dashboard/ChartWidget'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import authService from '@/services/authService'
import { permissionsFor } from './analytics/rbac'
import { useAnalyticsData } from './analytics/useAnalyticsData'
import StatTile from './analytics/StatTile'
import { exportPdf, shareReport, buildSummary, PRINT_CSS } from './analytics/reportActions'

/**
 * Analyses & KPIs — données 100 % réelles + RBAC.
 * Direction : tout (finance privée, recalcul, export PDF, partage).
 * TECHNICIEN : opérations + flotte + maintenance (aucun montant).
 * CHAUFFEUR : opérations uniquement.
 *
 * Mise en page : tuiles de synthèse (sparklines) puis sections thématiques ;
 * hauteurs homogènes par rangée (330 grands graphiques / 300 moyens / 280 larges).
 */

const PALETTE = ['#405189', '#0ab39c', '#f7b84b', '#f06548', '#6f42c1', '#299cdb']

const VEHICULE_STATUT_LABELS: Record<string, string> = {
  DISPONIBLE: 'Disponibles', EN_MISSION: 'En mission', EN_MAINTENANCE: 'En maintenance',
  HORS_SERVICE: 'Hors service', INCONNU: 'Autre',
}

const INTERVENTION_TYPE_LABELS: Record<string, string> = {
  PREVENTIVE: 'Préventives', CURATIVE: 'Curatives', AUTRE: 'Autres',
}

const tnd = (v: number) => `${Math.round(v).toLocaleString('fr-FR')} TND`

interface AnalyticsDashboardProps {
  /** Données déjà chargées par un parent (dashboard) — évite le double fetch */
  shared?: ReturnType<typeof useAnalyticsData>
  /** true = intégré dans le dashboard (pas de breadcrumb propre) */
  embedded?: boolean
}

export default function AnalyticsDashboard({ shared, embedded }: AnalyticsDashboardProps = {}) {
  const user = authService.getCurrentUser()
  const perms = useMemo(() => permissionsFor(user?.role), [user?.role])
  const own = useAnalyticsData(perms, !shared)   // désactivé si le parent fournit les données
  const { data, stats, loading, reload } = shared ?? own

  // « Générer Rapport » (bouton de la barre latérale) arrive sur /analytics?report=1 :
  // une fois les données chargées et les graphiques peints, on déclenche
  // automatiquement l'impression PDF, puis on nettoie l'URL.
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (embedded || loading) return
    if (new URLSearchParams(location.search).get('report') !== '1') return
    const t = setTimeout(() => {
      window.print()
      navigate('/analytics', { replace: true })
    }, 900)
    return () => clearTimeout(t)
  }, [embedded, loading, location.search, navigate])
  const handleShare = () => shareReport(buildSummary([], [
    `• Missions terminées : ${stats.missionsParStatut.terminees}`,
    `• Taux de réalisation : ${stats.tauxRealisation}%`,
    `• Distance totale : ${Math.round(stats.distanceTotale).toLocaleString('fr-FR')} km`,
  ]))

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement des analyses...</p>
      </div>
    )
  }

  const totalMissions = stats.missionsParStatut.enAttente + stats.missionsParStatut.enCours
    + stats.missionsParStatut.terminees + stats.missionsParStatut.annulees

  return (
    <div id="analytics-report">
      <style>{PRINT_CSS}</style>
      {!embedded && <div className="no-print"><PageBreadcrumb title="Analyses & KPIs" /></div>}

      {/* En-tête du rapport imprimé (visible uniquement dans le PDF) */}
      <div className="print-only mb-4">
        <h2 className="mb-1">XPARK — Rapport de performance</h2>
        <p className="text-muted mb-0">
          Généré le {new Date().toLocaleString('fr-FR')} par {user?.prenom} {user?.nom} ({user?.role})
        </p>
        <hr />
      </div>

      {/* Barre d'actions */}
      <Row className="mb-4 no-print">
        <Col>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h4 className="mb-1">Vue d'ensemble analytique</h4>
              <p className="text-muted mb-0">
                <i className="ri-history-line me-1" />
                Données en direct — chargées le {new Date().toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Button variant="soft-info" onClick={reload} className="btn-icon" title="Actualiser">
                <i className="ri-refresh-line" />
              </Button>
              {perms.export && (
                <>
                  <Button variant="soft-secondary" onClick={exportPdf} className="d-flex align-items-center">
                    <IconifyIcon icon="tabler:file-type-pdf" className="me-1 fs-16" /> Exporter PDF
                  </Button>
                  <Button variant="soft-primary" onClick={handleShare} className="d-flex align-items-center">
                    <IconifyIcon icon="tabler:share-3" className="me-1 fs-16" /> Partager
                  </Button>
                </>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Avis RBAC pour les rôles restreints */}
      {!perms.finance && (
        <Alert variant="info" className="d-flex align-items-center gap-2 no-print">
          <IconifyIcon icon="tabler:lock" className="fs-18" />
          <span>
            Certaines analyses (finance, coûts) sont <strong>réservées à la direction</strong>.
            Vous visualisez les indicateurs autorisés pour votre rôle ({user?.role}).
          </span>
        </Alert>
      )}

      {/* ══════════ SYNTHÈSE — tuiles sparkline (6 mois) ══════════ */}
      <Row className="g-3 mb-4">
        {perms.operations && (
          <Col xl={3} sm={6}>
            <StatTile label="Missions (6 mois)" icon="ri-truck-line" color="#405189"
              value={String(stats.missionsParMois.reduce((s, m) => s + m.value, 0))}
              serie={stats.missionsParMois.map(m => m.value)} />
          </Col>
        )}
        {perms.finance ? (
          <>
            <Col xl={3} sm={6}>
              <StatTile label="Revenus (6 mois)" icon="ri-money-dollar-circle-line" color="#0ab39c"
                value={tnd(stats.revenusTotal)}
                serie={stats.revenusParMois.map(m => Math.round(m.value))} />
            </Col>
            <Col xl={3} sm={6}>
              <StatTile label="Coûts (6 mois)" icon="ri-shopping-cart-line" color="#f06548"
                value={tnd(stats.coutsTotal)}
                serie={stats.coutsParMois.map(m => Math.round(m.value))} />
            </Col>
            <Col xl={3} sm={6}>
              <StatTile label="Marge nette (6 mois)" icon="ri-line-chart-line" color="#f7b84b"
                value={tnd(stats.revenusTotal - stats.coutsTotal)}
                serie={stats.margeParMois.map(m => Math.round(m.value))} />
            </Col>
          </>
        ) : perms.operations && (
          <>
            <Col xl={3} sm={6}>
              <StatTile label="Taux de réalisation" icon="ri-checkbox-circle-line" color="#0ab39c"
                value={`${stats.tauxRealisation}%`} suffix="missions terminées"
                serie={stats.missionsParMois.map(m => m.value)} />
            </Col>
            <Col xl={3} sm={6}>
              <StatTile label="Distance totale" icon="ri-road-map-line" color="#f7b84b"
                value={`${Math.round(stats.distanceTotale).toLocaleString('fr-FR')} km`} suffix="missions terminées"
                serie={stats.missionsParMois.map(m => m.value)} />
            </Col>
            <Col xl={3} sm={6}>
              <StatTile label="En cours" icon="ri-steering-2-line" color="#299cdb"
                value={String(stats.missionsParStatut.enCours)} suffix="missions actives"
                serie={stats.missionsParMois.map(m => m.value)} />
            </Col>
          </>
        )}
      </Row>

      {/* ══════════ OPÉRATIONS — tout le staff (aucun montant) ══════════ */}
      {perms.operations && (
        <div className="mb-4">
          <SectionTitle icon="ri-truck-line" color="primary" title="Activité opérationnelle" />

          {/* Rangée 1 : répartition + carte de chaleur d'activité */}
          <Row className="g-4 mb-4">
            <Col xl={4}>
              <ChartWidget
                titre={`Répartition des missions (${totalMissions})`}
                type="donut" height={330}
                series={[
                  stats.missionsParStatut.enAttente, stats.missionsParStatut.enCours,
                  stats.missionsParStatut.terminees, stats.missionsParStatut.annulees,
                ]}
                options={{
                  labels: ['En attente', 'En cours', 'Terminées', 'Annulées'],
                  colors: ['#f7b84b', '#405189', '#0ab39c', '#f06548'],
                  legend: { position: 'bottom' },
                  plotOptions: { pie: { donut: { size: '70%', labels: { show: true,
                    total: { show: true, label: 'Total',
                      formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0) } } } } },
                }}
              />
            </Col>
            <Col xl={8}>
              <ChartWidget
                titre="Carte de chaleur — départs par jour de semaine (6 mois)"
                type="heatmap" height={330}
                series={stats.heatmapActivite}
                options={{
                  colors: ['#405189'],
                  plotOptions: { heatmap: { shadeIntensity: 0.6, radius: 3 } },
                  tooltip: { y: { formatter: (val: number) => `${val} départ${val > 1 ? 's' : ''}` } },
                  stroke: { width: 1 },
                }}
              />
            </Col>
          </Row>

          {/* Rangée 2 : pipeline + taux de réalisation + destinations */}
          <Row className="g-4">
            <Col xl={4}>
              <ChartWidget
                titre="Pipeline des missions"
                type="bar" height={300}
                series={[{
                  name: 'Missions',
                  data: [stats.funnel.recues, stats.funnel.affectees, stats.funnel.enCours, stats.funnel.terminees],
                }]}
                options={{
                  colors: ['#405189'],
                  plotOptions: { bar: { horizontal: true, isFunnel: true, borderRadius: 0 } },
                  dataLabels: {
                    enabled: true,
                    formatter: (val: number, opt: any) =>
                      `${['Reçues', 'Affectées', 'Démarrées', 'Terminées'][opt.dataPointIndex]} : ${val}`,
                    dropShadow: { enabled: true },
                  },
                  xaxis: { categories: ['Reçues', 'Affectées', 'Démarrées', 'Terminées'] },
                  legend: { show: false },
                }}
              />
            </Col>
            <Col xl={4}>
              <ChartWidget
                titre="Taux de réalisation"
                type="radialBar" height={300}
                series={[stats.tauxRealisation]}
                options={{
                  colors: [stats.tauxRealisation >= 70 ? '#0ab39c' : stats.tauxRealisation >= 40 ? '#f7b84b' : '#f06548'],
                  plotOptions: { radialBar: {
                    startAngle: -90, endAngle: 90,
                    hollow: { size: '62%' },
                    track: { background: '#f1f3fa' },
                    dataLabels: {
                      name: { show: true, fontSize: '13px', color: '#adb5bd', offsetY: 24 },
                      value: { fontSize: '30px', fontWeight: 700, offsetY: -14, formatter: (v: number) => `${v}%` },
                    },
                  } },
                  labels: ['missions terminées'],
                  stroke: { lineCap: 'round' },
                }}
              />
            </Col>
            <Col xl={4}>
              <ChartWidget
                titre="Top destinations"
                type="treemap" height={300}
                series={[{ data: stats.topDestinations }]}
                options={{
                  colors: PALETTE,
                  plotOptions: { treemap: { distributed: true, enableShades: false } },
                  dataLabels: { enabled: true, style: { fontSize: '13px' } },
                  legend: { show: false },
                  tooltip: { y: { formatter: (val: number) => `${val} mission${val > 1 ? 's' : ''}` } },
                }}
              />
            </Col>
          </Row>
        </div>
      )}

      {/* ══════════ FINANCE — direction uniquement (privé) ══════════ */}
      {perms.finance && (
        <div className="mb-4">
          <SectionTitle icon="ri-money-dollar-circle-line" color="info" title="Analyse financière (privé direction)" />

          {/* Rangée 1 : corrélation activité/revenus + marge nette */}
          <Row className="g-4 mb-4">
            <Col xl={8}>
              <ChartWidget
                titre="Activité vs revenus (colonnes : missions · ligne : revenus)"
                type="line" height={350}
                series={[
                  { name: 'Missions', type: 'column', data: stats.missionsParMois.map(m => m.value) },
                  { name: 'Revenus (TND)', type: 'line', data: stats.revenusParMois.map(m => Math.round(m.value)) },
                ]}
                options={{
                  colors: ['#405189', '#0ab39c'],
                  stroke: { width: [0, 3], curve: 'smooth' },
                  plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
                  labels: stats.mois.map(m => m.label),
                  yaxis: [
                    { title: { text: 'Missions' } },
                    { opposite: true, title: { text: 'Revenus (TND)' },
                      labels: { formatter: (val: number) => `${Math.round(val).toLocaleString('fr-FR')}` } },
                  ],
                  tooltip: { shared: true },
                }}
              />
            </Col>
            <Col xl={4}>
              <ChartWidget
                titre="Marge nette par mois"
                type="bar" height={350}
                series={[{ name: 'Marge (TND)', data: stats.margeParMois.map(m => Math.round(m.value)) }]}
                options={{
                  plotOptions: { bar: { columnWidth: '50%', borderRadius: 4, colors: {
                    ranges: [
                      { from: -1e9, to: 0, color: '#f06548' },
                      { from: 0, to: 1e9, color: '#0ab39c' },
                    ],
                  } } },
                  xaxis: { categories: stats.margeParMois.map(m => m.label) },
                  yaxis: { labels: { formatter: (val: number) => tnd(val) } },
                  tooltip: { y: { formatter: (val: number) => tnd(val) } },
                  legend: { show: false },
                }}
              />
            </Col>
          </Row>

          {/* Rangée 2 : revenus vs coûts + top clients */}
          <Row className="g-4">
            <Col xl={8}>
              <ChartWidget
                titre="Revenus vs coûts réels (6 derniers mois)"
                type="area" height={320}
                series={[
                  { name: 'Revenus missions (TND)', data: stats.revenusParMois.map(m => Math.round(m.value)) },
                  { name: 'Coûts carburant + maintenance (TND)', data: stats.coutsParMois.map(m => Math.round(m.value)) },
                ]}
                options={{
                  colors: ['#0ab39c', '#f06548'],
                  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100, 100, 100] } },
                  xaxis: { categories: stats.revenusParMois.map(m => m.label) },
                  yaxis: { labels: { formatter: (val: number) => tnd(val) } },
                  tooltip: { y: { formatter: (val: number) => tnd(val) } },
                }}
              />
            </Col>
            <Col xl={4}>
              {stats.topClients.length > 0 ? (
                <ChartWidget
                  titre="Top clients par revenus"
                  type="bar" height={320}
                  series={[{ name: 'Revenus', data: stats.topClients.map(c => Math.round(c.value)) }]}
                  options={{
                    colors: PALETTE,
                    plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true } },
                    xaxis: { categories: stats.topClients.map(c => c.label) },
                    tooltip: { y: { formatter: (val: number) => tnd(val) } },
                    legend: { show: false },
                    dataLabels: { enabled: false },
                  }}
                />
              ) : (
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="d-flex flex-column justify-content-center text-center">
                    <p className="text-muted text-uppercase fw-bold fs-12 mb-2">Panier moyen / mission</p>
                    <h2 className="fw-bold mb-1">{tnd(stats.panierMoyen)}</h2>
                    <p className="text-muted mb-0 fs-13">sur {stats.missionsParStatut.terminees} missions terminées</p>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </div>
      )}

      {/* ══════════ FLOTTE — direction + technicien ══════════ */}
      {perms.fleet && (
        <div className="mb-4">
          <SectionTitle icon="ri-car-line" color="success" title="Flotte & disponibilité" />
          <Row className="g-4">
            <Col xl={4}>
              <ChartWidget
                titre="Disponibilité de la flotte"
                type="radialBar" height={300}
                series={[stats.tauxDisponibilite]}
                options={{
                  colors: [stats.tauxDisponibilite >= 60 ? '#0ab39c' : stats.tauxDisponibilite >= 30 ? '#f7b84b' : '#f06548'],
                  plotOptions: { radialBar: {
                    startAngle: -90, endAngle: 90,
                    hollow: { size: '62%' },
                    track: { background: '#f1f3fa' },
                    dataLabels: {
                      name: { show: true, fontSize: '13px', color: '#adb5bd', offsetY: 24 },
                      value: { fontSize: '30px', fontWeight: 700, offsetY: -14, formatter: (v: number) => `${v}%` },
                    },
                  } },
                  labels: ['véhicules disponibles'],
                  stroke: { lineCap: 'round' },
                }}
              />
            </Col>
            <Col xl={4}>
              {Object.keys(stats.vehiculesParStatut).length > 0 && (
                <ChartWidget
                  titre={`État de la flotte (${data.vehicules.length})`}
                  type="donut" height={300}
                  series={Object.values(stats.vehiculesParStatut)}
                  options={{
                    labels: Object.keys(stats.vehiculesParStatut).map(s => VEHICULE_STATUT_LABELS[s] ?? s),
                    colors: ['#0ab39c', '#405189', '#f7b84b', '#f06548', '#adb5bd'],
                    legend: { position: 'bottom' },
                  }}
                />
              )}
            </Col>
            <Col xl={4}>
              <ChartWidget
                titre="Consommation par véhicule (L/100km)"
                type="bar" height={300}
                series={[{
                  name: 'L/100km',
                  data: data.vehicules.filter(v => (v.consommationMoyenne ?? 0) > 0).slice(0, 8)
                    .map(v => Number((v.consommationMoyenne ?? 0).toFixed(1))),
                }]}
                options={{
                  colors: ['#0ab39c'],
                  plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                  xaxis: { categories: data.vehicules.filter(v => (v.consommationMoyenne ?? 0) > 0)
                    .slice(0, 8).map(v => v.immatriculation) },
                  legend: { show: false },
                }}
              />
            </Col>
          </Row>
        </div>
      )}

      {/* ══════════ MAINTENANCE — direction + technicien ══════════ */}
      {perms.maintenance && (
        <div className="mb-4">
          <SectionTitle icon="ri-tools-line" color="warning" title="Maintenance préventive & curative" />
          <Row className="g-4">
            <Col xl={4}>
              {Object.keys(stats.interventionsParType).length > 0 && (
                <ChartWidget
                  titre={`Interventions par type (${data.interventions.length})`}
                  type="donut" height={300}
                  series={Object.values(stats.interventionsParType)}
                  options={{
                    labels: Object.keys(stats.interventionsParType).map(t => INTERVENTION_TYPE_LABELS[t] ?? t),
                    colors: ['#0ab39c', '#f06548', '#f7b84b', '#405189'],
                    legend: { position: 'bottom' },
                  }}
                />
              )}
            </Col>
            <Col xl={perms.finance ? 4 : 8}>
              <ChartWidget
                titre="Interventions par mois"
                type="bar" height={300}
                series={[{ name: 'Interventions', data: stats.interventionsParMois.map(m => m.value) }]}
                options={{
                  colors: ['#f7b84b'],
                  plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
                  xaxis: { categories: stats.interventionsParMois.map(m => m.label) },
                  legend: { show: false },
                }}
              />
            </Col>
            {perms.finance && (
              <Col xl={4}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="d-flex flex-column justify-content-center text-center">
                    <p className="text-muted text-uppercase fw-bold fs-12 mb-2">Coût total maintenance (privé direction)</p>
                    <h2 className="fw-bold mb-1">{tnd(stats.coutMaintenance)}</h2>
                    <p className="text-muted mb-0 fs-13">
                      sur {data.interventions.length} intervention{data.interventions.length > 1 ? 's' : ''} enregistrée{data.interventions.length > 1 ? 's' : ''}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </div>
      )}

      {/* ══════════ CARBURANT — direction uniquement (montants) ══════════ */}
      {perms.fuel && data.carburant && (
        <div className="mb-4">
          <SectionTitle icon="ri-gas-station-line" color="danger" title="Consommation énergétique" />
          <Row className="g-4">
            <Col xl={8}>
              {(data.carburant.evolutionMensuelle ?? []).length > 0 && (
                <ChartWidget
                  titre={`Évolution mensuelle carburant — total ${tnd(data.carburant.coutTotal)} · ${Math.round(data.carburant.litresTotaux).toLocaleString('fr-FR')} L`}
                  type="bar" height={300}
                  series={[
                    { name: 'Coût (TND)', data: data.carburant.evolutionMensuelle.map(e => Math.round(e.coutTotal)) },
                  ]}
                  options={{
                    colors: ['#f06548'],
                    plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
                    xaxis: { categories: data.carburant.evolutionMensuelle.map(e => e.mois) },
                    yaxis: { labels: { formatter: (val: number) => tnd(val) } },
                    legend: { show: false },
                  }}
                />
              )}
            </Col>
            <Col xl={4}>
              <ChartWidget
                titre="Top véhicules par coût carburant"
                type="bar" height={300}
                series={[{
                  name: 'Coût total',
                  data: (data.carburant.topVehiculesParCout ?? []).slice(0, 5).map(t => Math.round(t.coutTotal)),
                }]}
                options={{
                  colors: PALETTE,
                  plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true } },
                  xaxis: { categories: (data.carburant.topVehiculesParCout ?? []).slice(0, 5).map(t => t.vehiculeImmatriculation) },
                  tooltip: { y: { formatter: (val: number) => tnd(val) } },
                  legend: { show: false },
                  dataLabels: { enabled: false },
                }}
              />
            </Col>
          </Row>
        </div>
      )}
    </div>
  )
}

/** Titre de section homogène (même style que le reste du backoffice) */
function SectionTitle({ icon, color, title }: { icon: string; color: string; title: string }) {
  return (
    <h5 className="text-uppercase fw-bold text-muted mb-3 d-flex align-items-center">
      <span className={`bg-${color}-subtle text-${color} avatar-xs rounded-circle d-flex align-items-center justify-content-center me-2`}>
        <i className={icon} />
      </span>
      {title}
    </h5>
  )
}
