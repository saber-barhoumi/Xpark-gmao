import { useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Row, Spinner } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import KPICard from '@/components/dashboard/KPICard'
import ChartWidget from '@/components/dashboard/ChartWidget'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Swal from 'sweetalert2'
import authService from '@/services/authService'
import kpiService from '@/services/kpiService'
import { permissionsFor } from './analytics/rbac'
import { useAnalyticsData } from './analytics/useAnalyticsData'
import { exportPdf, shareReport, buildSummary, PRINT_CSS } from './analytics/reportActions'

/**
 * Analyses & KPIs — données 100 % réelles + RBAC.
 * Direction (ADMIN/ADMINISTRATEUR/GESTIONNAIRE) : tout, dont la finance privée,
 * le recalcul des KPIs, l'export PDF et le partage.
 * TECHNICIEN : opérations + flotte + maintenance (aucun montant).
 * CHAUFFEUR : opérations uniquement.
 */

const VEHICULE_STATUT_LABELS: Record<string, string> = {
  DISPONIBLE: 'Disponibles', EN_MISSION: 'En mission', EN_MAINTENANCE: 'En maintenance',
  HORS_SERVICE: 'Hors service', INCONNU: 'Autre',
}

const INTERVENTION_TYPE_LABELS: Record<string, string> = {
  PREVENTIVE: 'Préventives', CURATIVE: 'Curatives', AUTRE: 'Autres',
}

const tnd = (v: number) => `${Math.round(v).toLocaleString('fr-FR')} TND`

export default function AnalyticsDashboard() {
  const user = authService.getCurrentUser()
  const perms = useMemo(() => permissionsFor(user?.role), [user?.role])
  const { data, stats, loading, reload } = useAnalyticsData(perms)
  const [calculEnCours, setCalculEnCours] = useState(false)

  const handleRecalculer = async () => {
    try {
      setCalculEnCours(true)
      const nouveaux = await kpiService.calculerTous()
      await reload()
      Swal.fire({
        title: 'Succès !', text: `${nouveaux.length} KPIs recalculés`,
        icon: 'success', timer: 1500, showConfirmButton: false,
      })
    } catch {
      Swal.fire('Erreur', 'Erreur lors du calcul des KPIs', 'error')
    } finally {
      setCalculEnCours(false)
    }
  }

  const handleShare = () => shareReport(buildSummary(data.kpis, [
    `• Missions terminées : ${stats.missionsParStatut.terminees}`,
    `• Distance totale : ${Math.round(stats.distanceTotale).toLocaleString('fr-FR')} km`,
  ]))

  const kpisDe = (cat: string) => data.kpis.filter(k => k.categorie === cat)

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
      <div className="no-print"><PageBreadcrumb title="Analyses & KPIs" /></div>

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
                Dernière mise à jour : {data.kpis[0] ? new Date(data.kpis[0].dateCalcul).toLocaleString('fr-FR') : 'Jamais'}
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
              {perms.recalculate && (
                <Button variant="primary" onClick={handleRecalculer} disabled={calculEnCours}
                  className="d-flex align-items-center">
                  {calculEnCours ? (
                    <><Spinner animation="border" size="sm" className="me-2" />Calcul en cours...</>
                  ) : (
                    <><i className="ri-settings-4-line me-2" />Recalculer les KPIs</>
                  )}
                </Button>
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

      {/* ══════════ OPÉRATIONS — tout le staff (aucun montant) ══════════ */}
      {perms.operations && (
        <div className="mb-4">
          <SectionTitle icon="ri-truck-line" color="primary" title="Activité opérationnelle" />
          <Row className="g-3 mb-3">
            {kpisDe('MISSIONS').map(kpi => (
              <Col xl={4} md={6} key={kpi.idKPI}><KPICard {...kpi} /></Col>
            ))}
          </Row>
          <Row className="g-4">
            <Col xl={4}>
              <ChartWidget
                titre={`Répartition des missions (${totalMissions})`}
                type="donut"
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
                titre={`Missions par mois — distance totale ${Math.round(stats.distanceTotale).toLocaleString('fr-FR')} km`}
                type="bar"
                series={[{ name: 'Missions', data: stats.missionsParMois.map(m => m.value) }]}
                options={{
                  colors: ['#405189'],
                  plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
                  xaxis: { categories: stats.missionsParMois.map(m => m.label) },
                  legend: { show: false },
                }}
              />
            </Col>
          </Row>
        </div>
      )}

      {/* ══════════ FLOTTE — direction + technicien ══════════ */}
      {perms.fleet && (
        <div className="mb-4">
          <SectionTitle icon="ri-car-line" color="success" title="Flotte & disponibilité" />
          <Row className="g-3 mb-3">
            {kpisDe('FLOTTE').map(kpi => (
              <Col xl={4} md={6} key={kpi.idKPI}><KPICard {...kpi} /></Col>
            ))}
          </Row>
          {Object.keys(stats.vehiculesParStatut).length > 0 && (
            <Row className="g-4">
              <Col xl={4}>
                <ChartWidget
                  titre={`État de la flotte (${data.vehicules.length} véhicules)`}
                  type="donut"
                  series={Object.values(stats.vehiculesParStatut)}
                  options={{
                    labels: Object.keys(stats.vehiculesParStatut).map(s => VEHICULE_STATUT_LABELS[s] ?? s),
                    colors: ['#0ab39c', '#405189', '#f7b84b', '#f06548', '#adb5bd'],
                    legend: { position: 'bottom' },
                  }}
                />
              </Col>
              <Col xl={8}>
                <ChartWidget
                  titre="Consommation moyenne par véhicule (L/100km)"
                  type="bar"
                  series={[{
                    name: 'L/100km',
                    data: data.vehicules.filter(v => (v.consommationMoyenne ?? 0) > 0).slice(0, 10)
                      .map(v => Number((v.consommationMoyenne ?? 0).toFixed(1))),
                  }]}
                  options={{
                    colors: ['#0ab39c'],
                    plotOptions: { bar: { columnWidth: '45%', borderRadius: 4, distributed: false } },
                    xaxis: { categories: data.vehicules.filter(v => (v.consommationMoyenne ?? 0) > 0)
                      .slice(0, 10).map(v => v.immatriculation) },
                    legend: { show: false },
                  }}
                />
              </Col>
            </Row>
          )}
        </div>
      )}

      {/* ══════════ FINANCE — direction uniquement (privé) ══════════ */}
      {perms.finance && (
        <div className="mb-4">
          <SectionTitle icon="ri-money-dollar-circle-line" color="info" title="Analyse financière (privé direction)" />
          <Row className="g-3 mb-3">
            {kpisDe('FINANCE').map(kpi => (
              <Col xl={4} md={6} key={kpi.idKPI}><KPICard {...kpi} /></Col>
            ))}
          </Row>
          <Row className="g-4">
            <Col xl={8}>
              <ChartWidget
                titre="Revenus vs coûts réels (6 derniers mois)"
                type="area"
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
              <ChartWidget
                titre="Top véhicules par coût carburant"
                type="bar"
                series={[{
                  name: 'Coût total',
                  data: (data.carburant?.topVehiculesParCout ?? []).slice(0, 5).map(t => Math.round(t.coutTotal)),
                }]}
                options={{
                  colors: ['#405189'],
                  plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true } },
                  xaxis: { categories: (data.carburant?.topVehiculesParCout ?? []).slice(0, 5).map(t => t.vehiculeImmatriculation) },
                  yaxis: { labels: { formatter: (val: any) => `${val}` } },
                  tooltip: { y: { formatter: (val: number) => tnd(val) } },
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
          <Row className="g-3 mb-3">
            {kpisDe('MAINTENANCE').map(kpi => (
              <Col xl={4} md={6} key={kpi.idKPI}><KPICard {...kpi} /></Col>
            ))}
          </Row>
          {Object.keys(stats.interventionsParType).length > 0 && (
            <Row className="g-4">
              <Col xl={4}>
                <ChartWidget
                  titre={`Interventions par type (${data.interventions.length})`}
                  type="donut"
                  series={Object.values(stats.interventionsParType)}
                  options={{
                    labels: Object.keys(stats.interventionsParType).map(t => INTERVENTION_TYPE_LABELS[t] ?? t),
                    colors: ['#0ab39c', '#f06548', '#f7b84b', '#405189'],
                    legend: { position: 'bottom' },
                  }}
                />
              </Col>
              {perms.finance && (
                <Col xl={8}>
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
          )}
        </div>
      )}

      {/* ══════════ CARBURANT — direction uniquement (montants) ══════════ */}
      {perms.fuel && data.carburant && (
        <div className="mb-4">
          <SectionTitle icon="ri-gas-station-line" color="danger" title="Consommation énergétique" />
          <Row className="g-3 mb-3">
            {kpisDe('CARBURANT').map(kpi => (
              <Col xl={4} md={6} key={kpi.idKPI}><KPICard {...kpi} /></Col>
            ))}
          </Row>
          {(data.carburant.evolutionMensuelle ?? []).length > 0 && (
            <ChartWidget
              titre={`Évolution mensuelle carburant — total ${tnd(data.carburant.coutTotal)} · ${Math.round(data.carburant.litresTotaux).toLocaleString('fr-FR')} L`}
              type="bar"
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
              height={280}
            />
          )}
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
