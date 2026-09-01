import { useEffect, useState } from 'react'
import { Badge, Card, CardBody, Col, Row, Spinner, Alert } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import missionService from '@/services/missionService'
import { Mission, StatutMission } from '@/types/mission'

const STATUT_COLORS: Record<string, string> = {
    EN_ATTENTE: 'info',
    EN_COURS: 'warning',
    TERMINEE: 'success',
    ANNULEE: 'danger',
}

const dateFr = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

/**
 * Mes Missions — self-service CHAUFFEUR.
 * Lecture seule : uniquement les missions du chauffeur connecté, via
 * GET /missions/driver (déjà borné côté serveur au rôle CHAUFFEUR).
 * Aucun montant affiché (même principe que le reste du RBAC chauffeur —
 * voir components/dashboard/analytics/rbac.ts).
 */
export default function MesMissionsPage() {
    const [missions, setMissions] = useState<Mission[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selected, setSelected] = useState<Mission | null>(null)

    useEffect(() => {
        missionService.getMyDriverMissions()
            .then(setMissions)
            .catch(() => setError('Impossible de charger vos missions pour le moment.'))
            .finally(() => setLoading(false))
    }, [])

    return (
        <>
            <PageBreadcrumb title="Mes Missions" />

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                <Col lg={selected ? 7 : 12}>
                    <Card>
                        <CardBody>
                            <h5 className="card-title mb-3">Mes missions</h5>
                            {loading ? (
                                <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
                            ) : missions.length === 0 ? (
                                <p className="text-muted mb-0">Aucune mission ne vous est assignée pour le moment.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>Destination</th>
                                                <th>Départ</th>
                                                <th>Véhicule</th>
                                                <th>Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {missions.map(m => (
                                                <tr
                                                    key={m.idMission}
                                                    role="button"
                                                    className={selected?.idMission === m.idMission ? 'table-active' : ''}
                                                    onClick={() => setSelected(m)}
                                                >
                                                    <td>{m.destination}</td>
                                                    <td>{dateFr(m.dateDepart)}</td>
                                                    <td>{m.vehiculeImmatriculation || '—'}</td>
                                                    <td>
                                                        <Badge bg={STATUT_COLORS[m.statut] || 'secondary'}>
                                                            {m.statut.replace('_', ' ')}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>

                {selected && (
                    <Col lg={5}>
                        <Card>
                            <CardBody>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <h5 className="card-title mb-0">Détails de la mission</h5>
                                    <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={() => setSelected(null)}>
                                        <IconifyIcon icon="ri:close-line" className="fs-18" />
                                    </button>
                                </div>

                                <dl className="row mb-0">
                                    <dt className="col-5 text-muted fw-normal">Statut</dt>
                                    <dd className="col-7"><Badge bg={STATUT_COLORS[selected.statut] || 'secondary'}>{selected.statut.replace('_', ' ')}</Badge></dd>

                                    <dt className="col-5 text-muted fw-normal">Objet</dt>
                                    <dd className="col-7">{selected.objetMission || '—'}</dd>

                                    <dt className="col-5 text-muted fw-normal">Départ</dt>
                                    <dd className="col-7">{selected.villeDepart || '—'} — {dateFr(selected.dateDepart)}</dd>

                                    <dt className="col-5 text-muted fw-normal">Arrivée</dt>
                                    <dd className="col-7">{selected.villeArrivee || selected.destination}{selected.dateRetour ? ` — ${dateFr(selected.dateRetour)}` : ''}</dd>

                                    <dt className="col-5 text-muted fw-normal">Distance</dt>
                                    <dd className="col-7">{selected.distanceKm ?? selected.distance ?? '—'} km</dd>

                                    <dt className="col-5 text-muted fw-normal">Véhicule</dt>
                                    <dd className="col-7">{selected.vehiculeImmatriculation || '—'}</dd>

                                    <dt className="col-5 text-muted fw-normal">Bon carburant</dt>
                                    <dd className="col-7">{selected.bonCarburantAccorde ? `Oui${selected.numeroBonCarburant ? ` (${selected.numeroBonCarburant})` : ''}` : 'Non'}</dd>

                                    <dt className="col-5 text-muted fw-normal">Documents vérifiés</dt>
                                    <dd className="col-7">{selected.verificationDocuments ? 'Oui' : 'Non'}</dd>

                                    <dt className="col-5 text-muted fw-normal">Carte autoroute</dt>
                                    <dd className="col-7">{selected.carteAutorouteRemise ? 'Remise' : 'Non remise'}</dd>
                                </dl>
                            </CardBody>
                        </Card>
                    </Col>
                )}
            </Row>
        </>
    )
}
