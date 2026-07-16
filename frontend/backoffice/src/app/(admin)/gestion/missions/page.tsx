import { useState, useEffect, useCallback } from 'react'
import { Badge, Button, Card, Col, Row, Spinner, Alert } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import authService from '@/services/authService'
import missionService from '@/services/missionService'
import { Mission, StatutMission } from '@/types/mission'
import Swal from 'sweetalert2'
import MissionWizardModal from './components/MissionWizardModal'
import CloseMissionModal from './components/CloseMissionModal'
import OptimizerPlanningModal from './components/OptimizerPlanningModal'
import AssignMissionModal from './components/AssignMissionModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import useBulkSelection from '@/hooks/useBulkSelection'
import BulkDeleteButtons from '@/components/table/BulkDeleteButtons'

const STATUT_COLORS: Record<string, string> = {
    EN_ATTENTE: 'info',
    EN_COURS: 'warning',
    TERMINEE: 'success',
    ANNULEE: 'danger',
}

export default function MissionsPage() {
    const [missions, setMissions] = useState<Mission[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<StatutMission | undefined>(undefined)

    // RBAC
    const currentUser = authService.getCurrentUser()
    const canWrite = currentUser?.role === 'ADMIN' || currentUser?.role === 'GESTIONNAIRE'

    // Modals
    const [showWizard, setShowWizard] = useState(false)
    const [showOptimizer, setShowOptimizer] = useState(false)
    const [showCloseModal, setShowCloseModal] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null)

    // Sélection multiple — seules les missions TERMINEE/ANNULEE sont supprimables
    // (même règle métier que le bouton de suppression unitaire existant)
    const deletable = missions.filter(m =>
        m.statut === StatutMission.TERMINEE || m.statut === StatutMission.ANNULEE)
    const [deleting, setDeleting] = useState(false)
    const sel = useBulkSelection(deletable, m => m.idMission)

    const loadMissions = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await missionService.getAll(filter)
            setMissions(data)
        } catch {
            setError('Impossible de charger les missions.')
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => { loadMissions() }, [loadMissions])

    const handleCancel = async (id: number) => {
        const result = await Swal.fire({
            title: 'Annuler la mission ?',
            text: 'Le véhicule et le chauffeur seront libérés.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Oui, annuler',
        })
        if (result.isConfirmed) {
            try {
                await missionService.cancel(id)
                await loadMissions()
                Swal.fire('Annulée', 'La mission a été annulée.', 'success')
            } catch (err: any) {
                Swal.fire('Erreur', err.response?.data?.message || 'Impossible d\'annuler.', 'error')
            }
        }
    }

    // Suppression en masse (TERMINEE/ANNULEE) : réutilise le DELETE unitaire
    const deleteMany = async (ids: number[]) => {
        setDeleting(true)
        try {
            await Promise.all(ids.map(id => missionService.delete(id)))
            sel.clear()
            await loadMissions()
            Swal.fire('Supprimées', `${ids.length} mission(s) supprimée(s).`, 'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Suppression partielle ou impossible.', 'error')
            await loadMissions()
        } finally { setDeleting(false) }
    }

    const openCloseModal = (m: Mission) => {
        setSelectedMission(m)
        setShowCloseModal(true)
    }

    const openAssignModal = (m: Mission) => {
        setSelectedMission(m)
        setShowAssignModal(true)
    }

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer la mission ?',
            text: 'Cette action est irréversible.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Supprimer',
            cancelButtonText: 'Annuler',
        })
        if (result.isConfirmed) {
            try {
                await missionService.delete(id)
                await loadMissions()
                Swal.fire('Supprimée', 'La mission a été supprimée.', 'success')
            } catch (err: any) {
                const msg = err.response?.status === 403
                    ? 'Accès refusé. Permissions insuffisantes.'
                    : err.response?.data?.message || 'Impossible de supprimer la mission.'
                Swal.fire('Erreur', msg, 'error')
            }
        }
    }

    return (
        <>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="ri:route-line" className="me-2 text-primary" />
                        Suivi des Missions
                    </h4>
                    <p className="text-muted mb-0">{missions.length} mission(s) affichée(s)</p>
                </Col>
                <Col xs="auto" className="d-flex gap-2 flex-wrap">
                    {canWrite && (
                        <BulkDeleteButtons
                            selectedCount={sel.count} totalCount={deletable.length}
                            label="mission(s) terminée(s)/annulée(s)" deleting={deleting}
                            onDeleteSelected={() => deleteMany(sel.selectedIds)}
                            onDeleteAll={() => deleteMany(deletable.map(m => m.idMission))}
                            warning="Seules les missions terminées ou annulées peuvent être supprimées."
                        />
                    )}
                    {canWrite && (
                        <>
                            <Button variant="dark" onClick={() => setShowOptimizer(true)}>
                                <IconifyIcon icon="ri:brain-line" className="me-1" />
                                Optimiser le planning
                            </Button>
                            <Button variant="primary" onClick={() => setShowWizard(true)}>
                                <IconifyIcon icon="ri:add-line" className="me-1" />
                                Nouvelle Mission
                            </Button>
                        </>
                    )}
                </Col>
            </Row>

            <div className="mb-4 d-flex gap-2">
                <Button
                    variant={filter === undefined ? 'primary' : 'outline-primary'} size="sm"
                    onClick={() => setFilter(undefined)}
                >
                    Toutes
                </Button>
                {Object.values(StatutMission).map(s => (
                    <Button
                        key={s} variant={filter === s ? 'primary' : 'outline-primary'} size="sm"
                        onClick={() => setFilter(s)}
                    >
                        {s.replace('_', ' ')}
                    </Button>
                ))}
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : missions.length === 0 ? (
                <Card className="text-center py-5 border-dashed">
                    <Card.Body>
                        <IconifyIcon icon="ri-search-line" className="fs-1 text-muted mb-2" />
                        <p className="text-muted fw-semibold">Aucune mission trouvée</p>
                    </Card.Body>
                </Card>
            ) : (
                <Card>
                    <div className="table-responsive">
                        <table className="table table-hover table-centered mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    {canWrite && (
                                        <th style={{ width: 34 }}>
                                            <input type="checkbox" className="form-check-input"
                                                checked={sel.allSelected} onChange={sel.toggleAll}
                                                disabled={deletable.length === 0}
                                                title="Sélectionner les missions terminées/annulées" />
                                        </th>
                                    )}
                                    <th>Départ</th>
                                    <th>Trajet & Objet</th>
                                    <th>Demandé par</th>
                                    <th>Véhicule & Chauffeur</th>
                                    <th>Dist. / Coût</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {missions.map(m => (
                                    <tr key={m.idMission}>
                                        {canWrite && (
                                            <td>
                                                {(m.statut === StatutMission.TERMINEE || m.statut === StatutMission.ANNULEE) ? (
                                                    <input type="checkbox" className="form-check-input"
                                                        checked={sel.isSelected(m.idMission)}
                                                        onChange={() => sel.toggle(m.idMission)} />
                                                ) : (
                                                    <input type="checkbox" className="form-check-input" disabled
                                                        title="Suppression réservée aux missions terminées/annulées" />
                                                )}
                                            </td>
                                        )}
                                        <td>
                                            <div className="fw-semibold small">
                                                <IconifyIcon icon="ri-calendar-line" className="me-1 text-primary" />
                                                {new Date(m.dateDepart).toLocaleDateString()}
                                            </div>
                                            <div className="text-muted tiny">
                                                {new Date(m.dateDepart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">
                                                {m.villeDepart
                                                    ? <>{m.villeDepart} <IconifyIcon icon="ri-arrow-right-line" className="text-muted" /> {m.villeArrivee || m.destination}</>
                                                    : m.destination}
                                            </div>
                                            <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: '220px' }}>
                                                {m.objetMission}
                                            </small>
                                        </td>
                                        <td>
                                            {m.clientIdUtilisateur ? (
                                                <Badge bg="info" className="fw-normal">
                                                    <IconifyIcon icon="ri-user-line" className="me-1" />
                                                    {m.clientNom || `Client #${m.clientIdUtilisateur}`}
                                                </Badge>
                                            ) : (
                                                <span className="small text-muted">
                                                    <IconifyIcon icon="ri-shield-user-line" className="me-1" />Back-office
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center mb-1">
                                                <IconifyIcon icon="ri-car-fill" className="me-1 text-muted" />
                                                <span className="small fw-semibold">{m.vehiculeImmatriculation || '-'}</span>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <IconifyIcon icon="ri-user-follow-fill" className="me-1 text-muted" />
                                                <span className="small text-muted">{m.chauffeurNom || 'Non assigné'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {m.statut === StatutMission.TERMINEE ? (
                                                <>
                                                    <div className="fw-bold text-success">{m.distance} km</div>
                                                    <div className="text-muted small">{m.coutTotal?.toFixed(2)} TND</div>
                                                </>
                                            ) : (m.distanceKm ?? 0) > 0 || (m.coutEstimeAI ?? 0) > 0 ? (
                                                <>
                                                    {(m.distanceKm ?? 0) > 0 && <div className="fw-semibold small">{m.distanceKm?.toFixed(0)} km</div>}
                                                    {(m.coutEstimeAI ?? 0) > 0 && (
                                                        <div className="text-muted small">
                                                            ~{m.coutEstimeAI?.toFixed(2)} TND
                                                            {m.statut === StatutMission.EN_ATTENTE && <span className="text-info"> (estimé)</span>}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-muted small fst-italic">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <Badge bg={STATUT_COLORS[m.statut] || 'secondary'}>
                                                {m.statut.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                {m.statut === StatutMission.EN_COURS && (
                                                    <>
                                                        <Button
                                                            variant="success" size="sm"
                                                            onClick={() => openCloseModal(m)} title="Terminer"
                                                        >
                                                            <IconifyIcon icon="ri:check-line" />
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger" size="sm"
                                                            onClick={() => handleCancel(m.idMission)} title="Annuler"
                                                        >
                                                            <IconifyIcon icon="ri:close-line" />
                                                        </Button>
                                                    </>
                                                )}
                                                {m.statut === StatutMission.EN_ATTENTE && canWrite && (
                                                    <>
                                                        <Button
                                                            variant="primary" size="sm"
                                                            onClick={() => openAssignModal(m)} title="Affecter un véhicule et un chauffeur"
                                                        >
                                                            <IconifyIcon icon="ri:user-add-line" />
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger" size="sm"
                                                            onClick={() => handleCancel(m.idMission)} title="Annuler"
                                                        >
                                                            <IconifyIcon icon="ri:close-line" />
                                                        </Button>
                                                    </>
                                                )}
                                                {(m.statut === StatutMission.TERMINEE || m.statut === StatutMission.ANNULEE) && canWrite && (
                                                    <Button
                                                        variant="outline-danger" size="sm"
                                                        onClick={() => handleDelete(m.idMission)} title="Supprimer"
                                                    >
                                                        <IconifyIcon icon="ri:delete-bin-line" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <ErrorBoundary>
                <MissionWizardModal
                    show={showWizard}
                    onHide={() => setShowWizard(false)}
                    reloadList={loadMissions}
                />
            </ErrorBoundary>

            <ErrorBoundary>
                <OptimizerPlanningModal
                    show={showOptimizer}
                    onHide={() => setShowOptimizer(false)}
                    reloadList={loadMissions}
                />
            </ErrorBoundary>

            <ErrorBoundary>
                <CloseMissionModal
                    show={showCloseModal}
                    onHide={() => setShowCloseModal(false)}
                    mission={selectedMission}
                    reloadList={loadMissions}
                />
            </ErrorBoundary>

            <ErrorBoundary>
                <AssignMissionModal
                    show={showAssignModal}
                    onHide={() => setShowAssignModal(false)}
                    mission={selectedMission}
                    reloadList={loadMissions}
                />
            </ErrorBoundary>
        </>
    )
}
