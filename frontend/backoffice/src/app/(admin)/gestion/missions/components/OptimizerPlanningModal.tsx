'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Col, Modal, ProgressBar, Row, Spinner, Table } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Swal from 'sweetalert2'
import api from '@/lib/axiosConfig'
import missionService from '@/services/missionService'
import employeeService from '@/services/employeeService'
import optimizerService from '@/services/optimizerService'
import { Mission, StatutMission } from '@/types/mission'
import {
    OptimizePlan, OptimizerDriver, OptimizerMission,
    OptimizerRecentMission, OptimizerVehicle,
} from '@/types/optimizer'

interface OptimizerPlanningModalProps {
    show: boolean
    onHide: () => void
    reloadList: () => void
}

// Handles plain arrays AND paginated { data:[...] } responses (same helper as the wizard)
const toArray = (val: unknown): any[] => {
    if (Array.isArray(val)) return val
    if (val && typeof val === 'object') {
        const v = val as Record<string, unknown>
        for (const k of ['data', 'items', 'results', 'value']) {
            if (Array.isArray(v[k])) return v[k] as any[]
        }
    }
    return []
}

const scoreVariant = (score: number) => (score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger')

const OptimizerPlanningModal = ({ show, onHide, reloadList }: OptimizerPlanningModalProps) => {
    const [loading, setLoading] = useState(false)
    const [optimizing, setOptimizing] = useState(false)
    const [applying, setApplying] = useState(false)
    const [error, setError] = useState('')

    const [pendingMissions, setPendingMissions] = useState<Mission[]>([])
    const [vehicles, setVehicles] = useState<OptimizerVehicle[]>([])
    const [drivers, setDrivers] = useState<OptimizerDriver[]>([])
    const [recentMissions, setRecentMissions] = useState<OptimizerRecentMission[]>([])
    const [plan, setPlan] = useState<OptimizePlan | null>(null)
    const [expandedReason, setExpandedReason] = useState<number | null>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        setError('')
        setPlan(null)
        try {
            const [allMissions, vRes, dRes] = await Promise.all([
                missionService.getAll(),
                api.get('/vehicules/disponibles'),
                employeeService.getAll({ post: 'CHAUFFEUR', statut: 'DISPONIBLE' }),
            ])

            // Missions EN_ATTENTE sans affectation = à optimiser
            setPendingMissions(allMissions.filter(m =>
                m.statut === StatutMission.EN_ATTENTE && !m.employeeId && !m.vehiculeId))

            setVehicles(toArray(vRes.data).map((v: any): OptimizerVehicle => ({
                idVehicule: v.idVehicule,
                immatriculation: v.immatriculation ?? '',
                marque: v.marque ?? '',
                modele: v.modele ?? '',
                typeVehicule: v.typeVehicule ?? 'BERLINE',
                typeCarburant: v.typeCarburant ?? 'DIESEL',
                consommationMoyenne: v.consommationMoyenne ?? 0,
                kilometrage: v.kilometrage ?? 0,
                nombrePlaces: v.nombrePlaces ?? 0,
                chargeUtileKg: v.chargeUtileKg ?? 0,
                dateProchaineRevision: v.dateProchaineRevision ?? undefined,
            })))

            setDrivers(toArray(dRes).map((d: any): OptimizerDriver => ({
                idEmployee: d.idEmployee,
                nom: `${d.prenom ?? ''} ${d.name ?? d.nom ?? ''}`.trim(),
                numeroMatricule: d.numeroMatricule ?? '',
                categoriePermis: d.categoriePermis ?? undefined,
            })))

            // Historique 7 jours (charge de travail) + missions déjà planifiées (conflits horaires)
            const weekAgo = Date.now() - 7 * 24 * 3600 * 1000
            setRecentMissions(allMissions
                .filter(m => m.statut !== StatutMission.ANNULEE
                    && !!m.employeeId
                    && new Date(m.dateDepart).getTime() >= weekAgo)
                .map((m): OptimizerRecentMission => ({
                    employeeId: m.employeeId,
                    vehiculeId: m.vehiculeId,
                    dateDepart: m.dateDepart,
                    dateRetour: m.dateRetour ?? null,
                    distanceKm: m.distanceKm ?? 0,
                    statut: m.statut,
                })))
        } catch {
            setError('Impossible de charger les données (missions / véhicules / chauffeurs).')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { if (show) loadData() }, [show, loadData])

    const runOptimization = async () => {
        setOptimizing(true)
        setError('')
        setPlan(null)
        try {
            const payload = {
                batchId: `batch-${new Date().toISOString().slice(0, 16)}`,
                missions: pendingMissions.map((m): OptimizerMission => ({
                    missionId: m.idMission,
                    villeDepart: m.villeDepart ?? '',
                    villeArrivee: m.villeArrivee ?? m.destination,
                    distanceKm: m.distanceKm ?? 0,
                    dateDepart: m.dateDepart,
                    requiredVehicleClass: m.aiVehiculeTypeUsed || undefined,
                    priorite: 'NORMAL',
                    objetMission: m.objetMission,
                })),
                vehicles,
                drivers,
                recentMissions,
            }
            setPlan(await optimizerService.optimize(payload))
        } catch (err: any) {
            setError(err.message || "Le service OptimisateurFlotteIA est indisponible.")
        } finally {
            setOptimizing(false)
        }
    }

    const applyPlan = async () => {
        if (!plan) return
        const confirm = await Swal.fire({
            title: 'Appliquer le plan ?',
            text: `${plan.assignments.length} mission(s) seront affectées et passeront EN_COURS.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Oui, appliquer',
            cancelButtonText: 'Annuler',
        })
        if (!confirm.isConfirmed) return

        setApplying(true)
        let ok = 0
        const failures: string[] = []
        for (const a of plan.assignments) {
            try {
                const vehicle = vehicles.find(v => v.idVehicule === a.vehicleId)
                await missionService.assign(a.missionId, {
                    vehiculeId: a.vehicleId,
                    employeeId: a.driverId,
                    vehiculeImmatriculation: a.vehicleImmatriculation || undefined,
                    chauffeurNom: a.driverName || undefined,
                    kilometrageDepart: vehicle?.kilometrage,
                })
                ok++
            } catch (err: any) {
                failures.push(`Mission ${a.missionId}: ${err.response?.data?.message || 'erreur'}`)
            }
        }
        setApplying(false)

        if (failures.length === 0) {
            await Swal.fire('Plan appliqué', `${ok} mission(s) affectée(s) avec succès.`, 'success')
            reloadList()
            onHide()
        } else {
            await Swal.fire('Partiellement appliqué',
                `${ok} affectée(s), ${failures.length} échec(s):\n${failures.join('\n')}`, 'warning')
            reloadList()
            loadData()
        }
    }

    return (
        <Modal show={show} onHide={onHide} size="xl" centered backdrop="static">
            <Modal.Header closeButton className="bg-dark text-white">
                <Modal.Title>
                    <IconifyIcon icon="ri:brain-line" className="me-2" />
                    OptimisateurFlotteIA — Planning automatique
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                {error && <Alert variant="danger" className="py-2">{error}</Alert>}

                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                ) : (
                    <>
                        {/* ── Resource summary ─────────────────────────── */}
                        <Row className="g-3 mb-4 text-center">
                            <Col md={4}>
                                <div className="border rounded-2 p-3">
                                    <div className="fs-3 fw-bold text-primary">{pendingMissions.length}</div>
                                    <div className="small text-muted">
                                        <IconifyIcon icon="ri:route-line" className="me-1" />
                                        Missions en attente d&apos;affectation
                                    </div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="border rounded-2 p-3">
                                    <div className="fs-3 fw-bold text-success">{vehicles.length}</div>
                                    <div className="small text-muted">
                                        <IconifyIcon icon="ri:car-line" className="me-1" />
                                        Véhicules disponibles
                                    </div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="border rounded-2 p-3">
                                    <div className="fs-3 fw-bold text-info">{drivers.length}</div>
                                    <div className="small text-muted">
                                        <IconifyIcon icon="ri:user-star-line" className="me-1" />
                                        Chauffeurs disponibles
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        {pendingMissions.length === 0 ? (
                            <Alert variant="info" className="py-2 small">
                                <IconifyIcon icon="ri:information-line" className="me-1" />
                                Aucune mission EN_ATTENTE sans affectation. Créez des missions avec
                                l&apos;option «&nbsp;Affectation automatique par l&apos;IA&nbsp;» pour alimenter l&apos;optimiseur.
                            </Alert>
                        ) : !plan && (
                            <div className="text-center mb-3">
                                <Button variant="dark" size="lg" onClick={runOptimization} disabled={optimizing}>
                                    {optimizing
                                        ? <><Spinner animation="border" size="sm" className="me-2" />
                                            Optimisation en cours (Greedy → Génétique → Recherche locale)…</>
                                        : <><IconifyIcon icon="ri:flashlight-line" className="me-2" />
                                            Optimiser le planning</>}
                                </Button>
                            </div>
                        )}

                        {/* ── Plan result ──────────────────────────────── */}
                        {plan && (
                            <>
                                <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                                    <Badge bg={scoreVariant(plan.optimizationScore)} className="fs-6 px-3 py-2">
                                        Score global : {plan.optimizationScore.toFixed(1)} / 100
                                    </Badge>
                                    <span className="small text-muted">
                                        <IconifyIcon icon="ri:timer-line" className="me-1" />
                                        {plan.executionTimeMs} ms — {plan.metrics.optimizationAlgorithm}
                                    </span>
                                    <span className="small text-muted">
                                        <IconifyIcon icon="ri:gas-station-line" className="me-1" />
                                        Carburant total estimé : <strong>{plan.metrics.totalFuelCostEstimated.toFixed(2)} TND</strong>
                                    </span>
                                    <span className="small text-muted">
                                        <IconifyIcon icon="ri:scales-3-line" className="me-1" />
                                        Équilibre charge (écart-type) : {plan.metrics.workloadStdDevHours.toFixed(2)} h
                                    </span>
                                </div>

                                <Table hover size="sm" className="align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Mission</th>
                                            <th>Départ</th>
                                            <th>Véhicule</th>
                                            <th>Chauffeur</th>
                                            <th className="text-end">Carburant</th>
                                            <th style={{ width: 120 }}>Confiance</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plan.assignments.map(a => {
                                            const mission = pendingMissions.find(m => m.idMission === a.missionId)
                                            return (
                                                <Fragment key={a.missionId}>
                                                    <tr>
                                                        <td>
                                                            <div className="fw-semibold small">
                                                                {mission?.villeDepart || '—'} → {mission?.villeArrivee || mission?.destination}
                                                            </div>
                                                            <div className="text-muted tiny">#{a.missionId} · {a.estimatedDistance.toFixed(0)} km</div>
                                                        </td>
                                                        <td className="small">
                                                            {new Date(a.estimatedDepartureTime).toLocaleString('fr-FR', {
                                                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                                                            })}
                                                        </td>
                                                        <td>
                                                            <IconifyIcon icon="ri:car-fill" className="me-1 text-muted" />
                                                            <span className="small fw-semibold">{a.vehicleImmatriculation}</span>
                                                        </td>
                                                        <td>
                                                            <IconifyIcon icon="ri:user-follow-fill" className="me-1 text-muted" />
                                                            <span className="small">{a.driverName}</span>
                                                        </td>
                                                        <td className="text-end small fw-semibold">{a.estimatedFuelCost.toFixed(2)} TND</td>
                                                        <td>
                                                            <ProgressBar
                                                                now={a.assignmentConfidence * 100}
                                                                label={`${(a.assignmentConfidence * 100).toFixed(0)}%`}
                                                                variant={scoreVariant(a.assignmentConfidence * 100)}
                                                                style={{ height: 18 }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <Button
                                                                variant="link" size="sm" className="p-0"
                                                                title="Pourquoi ce choix ?"
                                                                onClick={() => setExpandedReason(
                                                                    expandedReason === a.missionId ? null : a.missionId)}
                                                            >
                                                                <IconifyIcon icon="ri:question-line" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                    {expandedReason === a.missionId && (
                                                        <tr>
                                                            <td colSpan={7} className="bg-light small text-muted fst-italic">
                                                                <IconifyIcon icon="ri:lightbulb-line" className="me-1 text-warning" />
                                                                {a.assignmentReasoning}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            )
                                        })}
                                    </tbody>
                                </Table>

                                {plan.unassignedMissions.length > 0 && (
                                    <Alert variant="warning" className="py-2 small mb-3">
                                        <div className="fw-bold mb-1">
                                            <IconifyIcon icon="ri:error-warning-line" className="me-1" />
                                            {plan.unassignedMissions.length} mission(s) non affectée(s) :
                                        </div>
                                        {plan.unassignedMissions.map(u => (
                                            <div key={u.missionId}>
                                                Mission #{u.missionId} — {u.reason} → {u.suggestedAction}
                                            </div>
                                        ))}
                                    </Alert>
                                )}

                                {plan.warnings.length > 0 && (
                                    <Alert variant="info" className="py-2 small mb-3">
                                        {plan.warnings.map((w, i) => (
                                            <div key={i}>
                                                <IconifyIcon icon="ri:alert-line" className="me-1" />{w}
                                            </div>
                                        ))}
                                    </Alert>
                                )}

                                <div className="d-flex justify-content-between">
                                    <Button variant="outline-secondary" onClick={runOptimization} disabled={optimizing || applying}>
                                        <IconifyIcon icon="ri:refresh-line" className="me-1" /> Ré-optimiser
                                    </Button>
                                    <Button variant="success" onClick={applyPlan}
                                        disabled={applying || plan.assignments.length === 0}>
                                        {applying
                                            ? <><Spinner animation="border" size="sm" className="me-1" /> Application…</>
                                            : <><IconifyIcon icon="ri:check-double-line" className="me-1" />
                                                Appliquer le plan ({plan.assignments.length} affectations)</>}
                                    </Button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </Modal.Body>
        </Modal>
    )
}

export default OptimizerPlanningModal
