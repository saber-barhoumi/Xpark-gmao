import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, CardBody, Col, ProgressBar, Row, Spinner } from 'react-bootstrap'

import PageBreadcrumb from '@/components/PageBreadcrumb'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import ChartWidget from '@/components/dashboard/ChartWidget'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import authService from '@/services/authService'
import predictionService from '@/services/predictionService'
import {
    NiveauRisque, ORGANE_LABEL, RISQUE_COULEUR,
    type PredictionDashboard, type SanteVehicule,
} from '@/types/prediction'
import VehiculeDetailModal from './components/VehiculeDetailModal'

/** Couleur Bootstrap → hex, pour les graphiques ApexCharts. */
const HEX: Record<string, string> = {
    success: '#22c55e', warning: '#f59e0b', orange: '#fb7185', danger: '#ef4444',
}

const PredictionPannesPage = () => {
    const [dashboard, setDashboard] = useState<PredictionDashboard | null>(null)
    const [flotte,    setFlotte]    = useState<SanteVehicule[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [erreur,    setErreur]    = useState('')
    const [recalcul,  setRecalcul]  = useState(false)
    const [message,   setMessage]   = useState('')
    const [selection, setSelection] = useState<SanteVehicule | null>(null)

    // Le recalcul est un acte de pilotage : réservé aux mêmes rôles que côté API.
    const peutRecalculer = useMemo(() => {
        const role = authService.getCurrentUser()?.role
        return ['ADMIN', 'ADMINISTRATEUR', 'GESTIONNAIRE'].includes(String(role))
    }, [])

    const charger = useCallback(async () => {
        setIsLoading(true)
        setErreur('')
        try {
            const [d, f] = await Promise.all([
                predictionService.getDashboard(),
                predictionService.getSanteFlotte(),
            ])
            setDashboard(d)
            setFlotte(f)
        } catch {
            setErreur("Impossible de charger les prédictions. Vérifiez que le service PredictionPanne est démarré.")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { charger() }, [charger])

    const lancerRecalcul = async () => {
        setRecalcul(true)
        setMessage('')
        try {
            const r = await predictionService.recalculer()
            setMessage(`${r.predictionsGenerees} prédiction(s) générée(s) sur ${r.vehiculesAnalyses} véhicule(s) — moteur ${r.versionModele}.`)
            await charger()
        } catch {
            setErreur('Le recalcul a échoué.')
        } finally {
            setRecalcul(false)
        }
    }

    if (isLoading) return (
        <>
            <PageBreadcrumb title="Prédiction de pannes" subName="Maintenance" />
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-2 mb-0">Analyse du parc…</p>
            </div>
        </>
    )

    return (
        <>
            <PageBreadcrumb title="Prédiction de pannes" subName="Maintenance" />

            {erreur && <Alert variant="danger">{erreur}</Alert>}
            {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}

            {/* ── Barre d'action ── */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-muted mb-0">
                    Maintenance prédictive — anticipe les défaillances à partir de
                    l’historique d’interventions et de l’usure réelle du parc.
                </p>
                {peutRecalculer && (
                    <Button variant="primary" onClick={lancerRecalcul} disabled={recalcul}>
                        {recalcul
                            ? <><Spinner size="sm" animation="border" className="me-1" /> Analyse…</>
                            : <><IconifyIcon icon="tabler:refresh" className="me-1" /> Relancer l’analyse</>}
                    </Button>
                )}
            </div>

            {dashboard && (
                <>
                    {/* ── KPIs ── */}
                    <Row className="g-3 mb-3">
                        {[
                            { label: 'Véhicules analysés', valeur: dashboard.nombreVehiculesAnalyses, icone: 'tabler:truck',        couleur: 'primary' },
                            { label: 'Véhicules à risque', valeur: dashboard.nombreVehiculesARisque,  icone: 'tabler:alert-triangle', couleur: 'danger'  },
                            { label: 'Score de santé moyen', valeur: `${dashboard.scoreSanteMoyen}/100`, icone: 'tabler:heartbeat',  couleur: 'success' },
                            { label: 'Prédictions actives', valeur: dashboard.nombrePredictionsActives, icone: 'tabler:chart-dots', couleur: 'info'    },
                            { label: 'Maintenances < 30 j', valeur: dashboard.maintenancesA30Jours,     icone: 'tabler:calendar-due', couleur: 'warning' },
                            { label: 'Coût évité potentiel', valeur: `${dashboard.coutMaintenanceEvitePotentiel.toLocaleString('fr-FR')} TND`, icone: 'tabler:coin', couleur: 'secondary' },
                        ].map(k => (
                            <Col key={k.label} xl={2} md={4} sm={6}>
                                <Card className="h-100 border-0 shadow-sm">
                                    <CardBody>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <IconifyIcon icon={k.icone} className={`fs-20 text-${k.couleur}`} />
                                            <span className="text-muted fs-13">{k.label}</span>
                                        </div>
                                        <h4 className="mb-0">{k.valeur}</h4>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* ── Graphiques ── */}
                    <Row className="g-3 mb-3">
                        <Col xl={5}>
                            <ErrorBoundary>
                                <ChartWidget
                                    titre="Répartition du parc par niveau de risque"
                                    type="donut"
                                    height={300}
                                    series={dashboard.repartitionRisque.map(r => r.nombre)}
                                    options={{
                                        labels: dashboard.repartitionRisque.map(r => r.libelle),
                                        colors: dashboard.repartitionRisque.map(
                                            r => HEX[RISQUE_COULEUR[r.libelle as NiveauRisque]] ?? '#94a3b8'),
                                        legend: { position: 'bottom' },
                                    }}
                                />
                            </ErrorBoundary>
                        </Col>
                        <Col xl={7}>
                            <ErrorBoundary>
                                <ChartWidget
                                    titre="Prédictions par organe"
                                    type="bar"
                                    height={300}
                                    series={[{
                                        name: 'Prédictions',
                                        data: dashboard.repartitionTypePanne.map(r => r.nombre),
                                    }]}
                                    options={{
                                        xaxis: {
                                            categories: dashboard.repartitionTypePanne.map(
                                                r => ORGANE_LABEL[r.libelle] ?? r.libelle),
                                        },
                                        colors: ['#6366f1'],
                                        plotOptions: { bar: { borderRadius: 4, horizontal: false } },
                                    }}
                                />
                            </ErrorBoundary>
                        </Col>
                    </Row>
                </>
            )}

            {/* ── Classement des véhicules ── */}
            <Card>
                <CardBody>
                    <h5 className="mb-3">
                        État de santé du parc
                        <span className="text-muted fs-13 fw-normal ms-2">
                            ({flotte.length} véhicule{flotte.length > 1 ? 's' : ''}, du plus dégradé au plus sain)
                        </span>
                    </h5>

                    {flotte.length === 0 ? (
                        <p className="text-muted mb-0">
                            Aucune analyse disponible. {peutRecalculer && 'Lancez une première analyse ci-dessus.'}
                        </p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Véhicule</th>
                                        <th>Kilométrage</th>
                                        <th style={{ minWidth: 160 }}>Score de santé</th>
                                        <th>Risque</th>
                                        <th>Prédictions</th>
                                        <th>Maintenance conseillée</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {flotte.map(v => {
                                        const couleur = RISQUE_COULEUR[v.niveauRisque] ?? 'secondary'
                                        return (
                                            <tr key={v.vehiculeId} style={{ cursor: 'pointer' }}
                                                onClick={() => setSelection(v)}>
                                                <td>
                                                    <span className="fw-semibold">{v.immatriculation}</span>
                                                    <div className="text-muted fs-13">
                                                        {v.marque} {v.modele} · {v.anneeConstruction}
                                                    </div>
                                                </td>
                                                <td>{v.kilometrage.toLocaleString('fr-FR')} km</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <ProgressBar
                                                            now={v.scoreSante}
                                                            variant={couleur === 'orange' ? 'warning' : couleur}
                                                            style={{ height: 6, width: 90 }}
                                                        />
                                                        <span className="fw-semibold">{v.scoreSante}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg={couleur === 'orange' ? 'warning' : couleur}>
                                                        {v.niveauRisque}
                                                    </Badge>
                                                </td>
                                                <td>{v.nombrePredictions}</td>
                                                <td className="text-muted">
                                                    {v.prochaineMaintenanceRecommandee
                                                        ? new Date(v.prochaineMaintenanceRecommandee)
                                                            .toLocaleDateString('fr-FR')
                                                        : '—'}
                                                </td>
                                                <td className="text-end">
                                                    <IconifyIcon icon="tabler:chevron-right" />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>

            <VehiculeDetailModal
                vehicule={selection}
                open={!!selection}
                onClose={() => setSelection(null)}
            />
        </>
    )
}

export default PredictionPannesPage
