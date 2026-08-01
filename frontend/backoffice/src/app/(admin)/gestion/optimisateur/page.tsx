import { useEffect, useState } from 'react'
import { Badge, Card, Col, Row } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import OptimizerPanel from '@/components/optimizer/OptimizerPanel'
import optimizerService from '@/services/optimizerService'

/**
 * Page dédiée OptimisateurFlotteIA — /gestion/optimisateur
 *
 * Affectation automatique missions ↔ véhicules ↔ chauffeurs :
 * Greedy → Algorithme Génétique → Recherche locale, déclenchée via RabbitMQ
 * (xpark.missions.ready-for-optimization / xpark.optimization.plan-generated).
 */
export default function OptimisateurPage() {
    const [healthy, setHealthy] = useState<boolean | null>(null)

    useEffect(() => {
        optimizerService.health().then(setHealthy)
    }, [])

    return (
        <>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="ri:brain-line" className="me-2 text-primary" />
                        OptimisateurFlotteIA
                    </h4>
                    <p className="text-muted mb-0">
                        Affectation automatique des missions — coût carburant minimal, charge équitable, contraintes légales respectées
                    </p>
                </Col>
                <Col xs="auto">
                    {healthy === null ? (
                        <Badge bg="secondary">Vérification du service…</Badge>
                    ) : healthy ? (
                        <Badge bg="success">
                            <IconifyIcon icon="ri:checkbox-circle-line" className="me-1" />
                            Service IA opérationnel
                        </Badge>
                    ) : (
                        <Badge bg="danger">
                            <IconifyIcon icon="ri:close-circle-line" className="me-1" />
                            Service IA hors ligne
                        </Badge>
                    )}
                </Col>
            </Row>

            {/* ── Comment ça marche ─────────────────────────────── */}
            <Row className="g-3 mb-4">
                <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <span className="badge bg-primary rounded-circle">1</span>
                                <h6 className="mb-0">Affectation intelligente</h6>
                            </div>
                            <p className="small text-muted mb-0">
                                Chaque mission EN_ATTENTE reçoit la meilleure paire véhicule + chauffeur :
                                classe de véhicule requise, permis compatible (B/C/D…), disponibilité
                                horaire avec pause de 15 min entre missions.
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <span className="badge bg-success rounded-circle">2</span>
                                <h6 className="mb-0">Équilibrage de charge</h6>
                            </div>
                            <p className="small text-muted mb-0">
                                L&apos;historique 7 jours de chaque chauffeur est analysé : la limite légale
                                de 10h/jour n&apos;est jamais dépassée et le travail est réparti équitablement
                                (variance des heures minimisée).
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <span className="badge bg-warning rounded-circle">3</span>
                                <h6 className="mb-0">Optimisation des coûts</h6>
                            </div>
                            <p className="small text-muted mb-0">
                                Le véhicule le plus sobre compatible avec la nature du trajet est
                                privilégié (40 % du score). Le plan d’affectation est calculé en
                                moins de 5 secondes.
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ── Panneau d'optimisation ────────────────────────── */}
            <Card>
                <Card.Body className="p-4">
                    <OptimizerPanel />
                </Card.Body>
            </Card>
        </>
    )
}
