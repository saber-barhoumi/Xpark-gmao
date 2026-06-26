import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Spinner } from 'react-bootstrap';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import KPICard from '@/components/dashboard/KPICard';
import ChartWidget from '@/components/dashboard/ChartWidget';
import kpiService, { KPI } from '@/services/kpiService';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';

export default function AnalyticsDashboard() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculEnCours, setCalculEnCours] = useState(false);

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      // Charger KPIs de chaque catégorie
      const missions = await kpiService.getParCategorie('MISSIONS');
      const flotte = await kpiService.getParCategorie('FLOTTE');
      const finance = await kpiService.getParCategorie('FINANCE');
      const maintenance = await kpiService.getParCategorie('MAINTENANCE');
      const carburant = await kpiService.getParCategorie('CARBURANT');

      setKpis([...missions, ...flotte, ...finance, ...maintenance, ...carburant]);
    } catch (error) {
      console.error('Erreur chargement KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculerKPIs = async () => {
    try {
      setCalculEnCours(true);
      const nouveauxKPIs = await kpiService.calculerTous();
      setKpis(nouveauxKPIs);
      Swal.fire({
        title: 'Succès !',
        text: `${nouveauxKPIs.length} KPIs calculés avec succès`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error: any) {
      Swal.fire('Erreur', 'Erreur lors du calcul des KPIs', 'error');
    } finally {
      setCalculEnCours(false);
    }
  };

  // Organiser KPIs par catégorie
  const kpisMissions = kpis.filter(k => k.categorie === 'MISSIONS');
  const kpisFlotte = kpis.filter(k => k.categorie === 'FLOTTE');
  const kpisFinance = kpis.filter(k => k.categorie === 'FINANCE');
  const kpisMaintenance = kpis.filter(k => k.categorie === 'MAINTENANCE');
  const kpisCarburant = kpis.filter(k => k.categorie === 'CARBURANT');

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement des analyses...</p>
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb title="Analyses & KPIs" />

      <Row className="mb-4">
        <Col>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h4 className="mb-1">Vue d'Ensemble Analytique</h4>
              <p className="text-muted mb-0">
                <i className="ri-history-line me-1"></i>
                Dernière mise à jour : {kpis[0] ? new Date(kpis[0].dateCalcul).toLocaleString() : 'Jamais'}
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="soft-info"
                onClick={loadKPIs}
                className="btn-icon"
              >
                <i className="ri-refresh-line"></i>
              </Button>
              <Button
                variant="primary"
                onClick={handleCalculerKPIs}
                disabled={calculEnCours}
                className="d-flex align-items-center"
              >
                {calculEnCours ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Calcul en cours...
                  </>
                ) : (
                  <>
                    <i className="ri-settings-4-line me-2"></i>
                    Recalculer les KPIs
                  </>
                )}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* ========== KPIs MISSIONS ========== */}
      <div className="mb-4">
        <h5 className="text-uppercase fw-bold text-muted mb-3 d-flex align-items-center">
          <span className="bg-primary-subtle text-primary avatar-xs rounded-circle d-flex align-items-center justify-content-center me-2">
            <i className="ri-truck-line"></i>
          </span>
          Gestion des Missions
        </h5>
        <Row className="g-3">
          {kpisMissions.map((kpi) => (
            <Col xl={4} md={6} key={kpi.idKPI}>
              <KPICard {...kpi} />
            </Col>
          ))}
          {kpisMissions.length === 0 && <Col xs={12}><p className="text-muted italic">Aucun KPI calculé pour cette catégorie.</p></Col>}
        </Row>
      </div>

      {/* ========== KPIs FLOTTE ========== */}
      <div className="mb-4">
        <h5 className="text-uppercase fw-bold text-muted mb-3 d-flex align-items-center">
          <span className="bg-success-subtle text-success avatar-xs rounded-circle d-flex align-items-center justify-content-center me-2">
            <i className="ri-car-line"></i>
          </span>
          Flotte & Disponibilité
        </h5>
        <Row className="g-3">
          {kpisFlotte.map((kpi) => (
            <Col xl={4} md={6} key={kpi.idKPI}>
              <KPICard {...kpi} />
            </Col>
          ))}
          {kpisFlotte.length === 0 && <Col xs={12}><p className="text-muted italic">Aucun KPI calculé pour cette catégorie.</p></Col>}
        </Row>
      </div>

      {/* ========== KPIs FINANCE ========== */}
      <div className="mb-4">
        <h5 className="text-uppercase fw-bold text-muted mb-3 d-flex align-items-center">
          <span className="bg-info-subtle text-info avatar-xs rounded-circle d-flex align-items-center justify-content-center me-2">
            <i className="ri-money-dollar-circle-line"></i>
          </span>
          Analyse Financière
        </h5>
        <Row className="g-3">
          {kpisFinance.map((kpi) => (
            <Col xl={4} md={6} key={kpi.idKPI}>
              <KPICard {...kpi} />
            </Col>
          ))}
          {kpisFinance.length === 0 && <Col xs={12}><p className="text-muted italic">Aucun KPI calculé pour cette catégorie.</p></Col>}
        </Row>
      </div>

      {/* ========== GRAPHIQUES ========== */}
      <Row className="mb-4 g-4">
        <Col xl={4}>
          <ChartWidget
            titre="Consommation Moyenne (Gauge)"
            type="radialBar"
            series={[Math.min((kpis.find(k => k.codeKPI === 'CONSOMMATION_MOYENNE')?.valeur || 0) * 10, 100)]}
            options={{
              plotOptions: {
                radialBar: {
                  startAngle: -135,
                  endAngle: 135,
                  dataLabels: {
                    name: {
                      fontSize: '16px',
                      color: '#adb5bd',
                      offsetY: 120
                    },
                    value: {
                      offsetY: 76,
                      fontSize: '22px',
                      color: '#495057',
                      formatter: () => `${kpis.find(k => k.codeKPI === 'CONSOMMATION_MOYENNE')?.valeur || 0} L/100km`
                    }
                  }
                }
              },
              fill: {
                type: 'gradient',
                gradient: {
                  shade: 'dark',
                  shadeIntensity: 0.15,
                  inverseColors: false,
                  opacityFrom: 1,
                  opacityTo: 1,
                  stops: [0, 50, 65, 91]
                }
              },
              stroke: {
                dashArray: 4
              },
              labels: ['Consommation Moyenne'],
              colors: [(kpis.find(k => k.codeKPI === 'CONSOMMATION_MOYENNE')?.valeur || 0) > 8 ? '#f06548' : '#0ab39c']
            }}
          />
        </Col>
        <Col xl={8}>
          <ChartWidget
            titre="Top 5 Véhicules par Coût Carburant (TND)"
            type="bar"
            series={[
              {
                name: 'Coût Total',
                data: (() => {
                  try {
                    const kpi = kpis.find(k => k.codeKPI === 'COUT_CARBURANT_MOIS');
                    if (kpi && kpi.donneesJson) {
                      const data = JSON.parse(kpi.donneesJson);
                      return data.map((d: any) => d.Value);
                    }
                  } catch (e) {}
                  return [0, 0, 0, 0, 0];
                })()
              }
            ]}
            options={{
              colors: ['#405189'],
              plotOptions: {
                bar: {
                  columnWidth: '45%',
                  distributed: true,
                  borderRadius: 4
                }
              },
              xaxis: {
                categories: (() => {
                  try {
                    const kpi = kpis.find(k => k.codeKPI === 'COUT_CARBURANT_MOIS');
                    if (kpi && kpi.donneesJson) {
                      const data = JSON.parse(kpi.donneesJson);
                      return data.map((d: any) => d.Label);
                    }
                  } catch (e) {}
                  return ['V1', 'V2', 'V3', 'V4', 'V5'];
                })()
              },
              yaxis: {
                labels: {
                  formatter: (val) => `${val} TND`
                }
              },
              legend: {
                show: false
              }
            }}
          />
        </Col>
      </Row>

      <Row className="mb-4 g-4">
        <Col xl={8}>
          <ChartWidget
            titre="Performance Financière (6 derniers mois)"
            type="area"
            series={[
              {
                name: 'Revenus (TND)',
                data: [45200, 52100, 48500, 55000, 58200, 62000]
              },
              {
                name: 'Coûts (TND)',
                data: [30100, 35000, 32400, 38200, 40100, 42300]
              }
            ]}
            options={{
              colors: ['#0ab39c', '#f06548'],
              fill: {
                type: 'gradient',
                gradient: {
                  shadeIntensity: 1,
                  opacityFrom: 0.45,
                  opacityTo: 0.05,
                  stops: [20, 100, 100, 100]
                }
              },
              xaxis: {
                categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun']
              },
              yaxis: {
                labels: {
                  formatter: (val) => `${val.toLocaleString()} TND`
                }
              },
              tooltip: {
                y: {
                  formatter: (val) => `${val.toLocaleString()} TND`
                }
              }
            }}
          />
        </Col>
        <Col xl={4}>
          <ChartWidget
            titre="Répartition des Missions"
            type="donut"
            series={[120, 45, 235, 12]}
            options={{
              labels: ['Planifiées', 'En cours', 'Terminées', 'Annulées'],
              colors: ['#405189', '#f7b84b', '#0ab39c', '#f06548'],
              legend: {
                position: 'bottom'
              },
              plotOptions: {
                pie: {
                  donut: {
                    size: '70%',
                    labels: {
                      show: true,
                      total: {
                        show: true,
                        label: 'Total',
                        formatter: (w) => {
                          return w.globals.seriesTotals.reduce((a: any, b: any) => a + b, 0)
                        }
                      }
                    }
                  }
                }
              }
            }}
          />
        </Col>
      </Row>

      {/* ========== KPIs MAINTENANCE & CARBURANT ========== */}
      <Row className="g-4">
        <Col xl={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 py-3">
              <h5 className="card-title mb-0 d-flex align-items-center">
                <i className="ri-tools-line me-2 text-warning"></i>
                Maintenance Préventive & Curative
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {kpisMaintenance.map((kpi) => (
                  <Col md={6} key={kpi.idKPI}>
                    <KPICard {...kpi} />
                  </Col>
                ))}
                {kpisMaintenance.length === 0 && <Col xs={12}><p className="text-muted italic">Aucun KPI calculé.</p></Col>}
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 py-3">
              <h5 className="card-title mb-0 d-flex align-items-center">
                <i className="ri-gas-station-line me-2 text-info"></i>
                Consommation Énergétique
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {kpisCarburant.map((kpi) => (
                  <Col md={6} key={kpi.idKPI}>
                    <KPICard {...kpi} />
                  </Col>
                ))}
                {kpisCarburant.length === 0 && <Col xs={12}><p className="text-muted italic">Aucun KPI calculé.</p></Col>}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
