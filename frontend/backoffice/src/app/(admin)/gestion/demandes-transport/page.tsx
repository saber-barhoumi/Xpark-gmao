import { useState, useEffect, useCallback } from 'react'
import { Badge, Button, Card, Col, Row, Spinner, Alert } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import authService from '@/services/authService'
import transportRequestService from '@/services/transportRequestService'
import { StatutDemandeTransport, TransportRequest } from '@/types/transportRequest'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import QuotationModal from './components/QuotationModal'

/**
 * Demandes de Transport (devis) — /gestion/demandes-transport
 *
 * Étape AVANT la Mission : le staff voit les demandes clients, chiffre et envoie
 * un devis. Le client accepte (→ Mission créée, EN_ATTENTE, affectée par
 * l'OptimisateurFlotteIA) ou refuse. Une demande n'est PAS une mission.
 */

const STATUT_COLORS: Record<string, string> = {
    PENDING_QUOTATION: 'warning',
    QUOTATION_SENT: 'info',
    ACCEPTED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'secondary',
}
const STATUT_LABELS: Record<string, string> = {
    PENDING_QUOTATION: 'À chiffrer',
    QUOTATION_SENT: 'Devis envoyé',
    ACCEPTED: 'Accepté',
    REJECTED: 'Refusé',
    CANCELLED: 'Annulée',
}
const PRICING_LABELS: Record<string, string> = {
    AI_PRICE: 'Prix IA', MODIFIED: 'Prix IA ajusté', MANUAL: 'Prix manuel',
}

export default function DemandesTransportPage() {
    const [requests, setRequests] = useState<TransportRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<StatutDemandeTransport | undefined>(undefined)

    const currentUser = authService.getCurrentUser()
    const canWrite = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADMINISTRATEUR' || currentUser?.role === 'GESTIONNAIRE'

    const [showQuote, setShowQuote] = useState(false)
    const [selected, setSelected] = useState<TransportRequest | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            setRequests(await transportRequestService.getAll(filter))
        } catch {
            setError('Impossible de charger les demandes de transport.')
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => { load() }, [load])

    const openQuote = (r: TransportRequest) => { setSelected(r); setShowQuote(true) }

    const pendingCount = requests.filter(r => r.statut === StatutDemandeTransport.PENDING_QUOTATION).length

    return (
        <>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="ri:price-tag-3-line" className="me-2 text-primary" />
                        Demandes de Transport
                    </h4>
                    <p className="text-muted mb-0">
                        {requests.length} demande(s) · {pendingCount} à chiffrer
                    </p>
                </Col>
            </Row>

            <div className="mb-4 d-flex gap-2 flex-wrap">
                <Button variant={filter === undefined ? 'primary' : 'outline-primary'} size="sm" onClick={() => setFilter(undefined)}>
                    Toutes
                </Button>
                {Object.values(StatutDemandeTransport).map(s => (
                    <Button key={s} variant={filter === s ? 'primary' : 'outline-primary'} size="sm" onClick={() => setFilter(s)}>
                        {STATUT_LABELS[s] || s}
                    </Button>
                ))}
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : requests.length === 0 ? (
                <Card className="text-center py-5 border-dashed">
                    <Card.Body>
                        <IconifyIcon icon="ri:inbox-line" className="fs-1 text-muted mb-2" />
                        <p className="text-muted fw-semibold">Aucune demande de transport</p>
                    </Card.Body>
                </Card>
            ) : (
                <Card>
                    <div className="table-responsive">
                        <table className="table table-hover table-centered mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Date souhaitée</th>
                                    <th>Trajet & Fret</th>
                                    <th>Client</th>
                                    <th>Distance / Estim. IA</th>
                                    <th>Devis</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(r => (
                                    <tr key={r.idTransportRequest}>
                                        <td>
                                            <div className="fw-semibold small">
                                                <IconifyIcon icon="ri-calendar-line" className="me-1 text-primary" />
                                                {new Date(r.dateSouhaitee).toLocaleDateString()}
                                            </div>
                                            <div className="text-muted tiny">
                                                {new Date(r.dateSouhaitee).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">
                                                {r.villeDepart} <IconifyIcon icon="ri-arrow-right-line" className="text-muted" /> {r.villeArrivee}
                                            </div>
                                            <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: '240px' }}>
                                                {r.cargoDescription} · {r.cargoWeightKg} kg
                                            </small>
                                        </td>
                                        <td>
                                            <Badge bg="info" className="fw-normal">
                                                <IconifyIcon icon="ri-user-line" className="me-1" />
                                                {r.clientNom || `Client #${r.clientIdUtilisateur}`}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="fw-semibold small">{r.distanceKm.toFixed(0)} km</div>
                                            <div className="text-muted small">
                                                ~{r.aiEstimatedPrice.toFixed(0)} TND
                                                <span className="text-muted"> ({r.aiPriceRangeMin.toFixed(0)}–{r.aiPriceRangeMax.toFixed(0)})</span>
                                            </div>
                                        </td>
                                        <td>
                                            {r.finalPrice != null ? (
                                                <>
                                                    <div className="fw-bold text-success">{r.finalPrice.toFixed(2)} TND</div>
                                                    <div className="text-muted tiny">{PRICING_LABELS[r.pricingMethod || ''] || ''}</div>
                                                </>
                                            ) : (
                                                <span className="text-muted small fst-italic">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <Badge bg={STATUT_COLORS[r.statut] || 'secondary'}>
                                                {STATUT_LABELS[r.statut] || r.statut}
                                            </Badge>
                                        </td>
                                        <td>
                                            {r.statut === StatutDemandeTransport.PENDING_QUOTATION && canWrite ? (
                                                <Button variant="primary" size="sm" onClick={() => openQuote(r)} title="Chiffrer et envoyer le devis">
                                                    <IconifyIcon icon="ri:price-tag-3-line" className="me-1" />Chiffrer
                                                </Button>
                                            ) : r.statut === StatutDemandeTransport.ACCEPTED && r.missionId ? (
                                                <span className="small text-success">
                                                    <IconifyIcon icon="ri:checkbox-circle-line" className="me-1" />Mission #{r.missionId}
                                                </span>
                                            ) : (
                                                <span className="text-muted small">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <ErrorBoundary>
                <QuotationModal
                    show={showQuote}
                    onHide={() => setShowQuote(false)}
                    request={selected}
                    reloadList={load}
                />
            </ErrorBoundary>
        </>
    )
}
