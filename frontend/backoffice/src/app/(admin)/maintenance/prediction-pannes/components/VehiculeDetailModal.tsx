import { Badge, Card, CardBody, Modal, ModalBody, ModalHeader, ModalTitle, ProgressBar } from 'react-bootstrap'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { ORGANE_LABEL, RISQUE_COULEUR, type SanteVehicule } from '@/types/prediction'

/**
 * Détail des prédictions d'un véhicule.
 *
 * Chaque carte affiche l'EXPLICATION du moteur, pas seulement un score : c'est
 * ce qui permet à l'exploitant de juger si l'alerte mérite d'immobiliser le
 * véhicule. La source et la version du moteur sont affichées pour que
 * l'utilisateur sache toujours d'où vient la prédiction (règles ou modèle ML).
 */
const VehiculeDetailModal = ({
    vehicule, open, onClose,
}: { vehicule: SanteVehicule | null; open: boolean; onClose: () => void }) => {
    if (!vehicule) return null

    const couleurRisque = (r: string) => {
        const c = RISQUE_COULEUR[r as keyof typeof RISQUE_COULEUR] ?? 'secondary'
        return c === 'orange' ? 'warning' : c
    }

    const dateFr = (d?: string | null) =>
        d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

    return (
        <Modal show={open} onHide={onClose} size="lg" centered scrollable>
            <ModalHeader closeButton>
                <ModalTitle as="h5">
                    {vehicule.immatriculation}
                    <span className="text-muted fs-14 fw-normal ms-2">
                        {vehicule.marque} {vehicule.modele} · {vehicule.anneeConstruction}
                    </span>
                </ModalTitle>
            </ModalHeader>

            <ModalBody>
                {/* ── Synthèse ── */}
                <Card className="border-0 bg-light mb-3">
                    <CardBody>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-semibold">Score de santé</span>
                            <span className="fs-20 fw-bold">{vehicule.scoreSante}/100</span>
                        </div>
                        <ProgressBar
                            now={vehicule.scoreSante}
                            variant={couleurRisque(vehicule.niveauRisque)}
                            style={{ height: 8 }}
                        />
                        <div className="d-flex flex-wrap gap-3 mt-3 text-muted fs-13">
                            <span>
                                Risque&nbsp;
                                <Badge bg={couleurRisque(vehicule.niveauRisque)}>{vehicule.niveauRisque}</Badge>
                            </span>
                            <span>Kilométrage : <strong>{vehicule.kilometrage.toLocaleString('fr-FR')} km</strong></span>
                            {vehicule.dureeVieRestanteJours != null && (
                                <span>Durée de vie restante : <strong>{vehicule.dureeVieRestanteJours} j</strong></span>
                            )}
                            <span>Maintenance conseillée : <strong>{dateFr(vehicule.prochaineMaintenanceRecommandee)}</strong></span>
                        </div>
                    </CardBody>
                </Card>

                {/* ── Prédictions détaillées ── */}
                <h6 className="mb-2">
                    Prédictions ({vehicule.predictions.length})
                </h6>

                {vehicule.predictions.length === 0 ? (
                    <p className="text-muted">
                        Aucun signal de défaillance détecté pour ce véhicule.
                    </p>
                ) : vehicule.predictions.map(p => (
                    <Card key={p.idPrediction} className="mb-2 border">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="mb-0">
                                    <IconifyIcon icon="tabler:alert-triangle" className="me-1" />
                                    {ORGANE_LABEL[p.typePanne] ?? p.typePanne}
                                </h6>
                                <Badge bg={couleurRisque(p.niveauRisque)}>{p.niveauRisque}</Badge>
                            </div>

                            <div className="d-flex flex-wrap gap-3 mb-2 fs-13">
                                <span className="text-muted">
                                    Probabilité <strong className="text-body">{Math.round(p.probabilite * 100)} %</strong>
                                </span>
                                <span className="text-muted">
                                    Confiance <strong className="text-body">{Math.round(p.scoreConfiance * 100)} %</strong>
                                </span>
                                {p.dureeVieRestanteJours != null && (
                                    <span className="text-muted">
                                        Échéance <strong className="text-body">{p.dureeVieRestanteJours} j</strong>
                                    </span>
                                )}
                                {p.kilometrageRestant != null && (
                                    <span className="text-muted">
                                        Reste <strong className="text-body">{p.kilometrageRestant.toLocaleString('fr-FR')} km</strong>
                                    </span>
                                )}
                            </div>

                            {p.pieceARemplacer && (
                                <p className="mb-2 fs-13">
                                    <IconifyIcon icon="tabler:tool" className="me-1" />
                                    Pièce concernée : <strong>{p.pieceARemplacer}</strong>
                                </p>
                            )}

                            {/* Explication du moteur — le cœur de l'explicabilité */}
                            <div className="bg-light rounded p-2 mb-2">
                                <div className="text-muted fs-12 mb-1">Analyse</div>
                                <div className="fs-13">{p.explication}</div>
                            </div>

                            <div className="border-start border-3 border-primary ps-2 mb-2">
                                <div className="text-muted fs-12">Recommandation</div>
                                <div className="fs-13 fw-semibold">{p.recommandation}</div>
                            </div>

                            <div className="text-muted fs-12">
                                Panne estimée : {dateFr(p.datePanneEstimee)} ·
                                Intervention conseillée : {dateFr(p.dateMaintenanceRecommandee)} ·
                                Source : {p.source === 'REGLES' ? 'moteur de règles' : 'modèle ML'} ({p.versionModele})
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </ModalBody>
        </Modal>
    )
}

export default VehiculeDetailModal
