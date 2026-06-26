import { useState } from 'react'
import { Modal, Button, Form, Spinner, Row, Col } from 'react-bootstrap'
import { EtatEquipement } from '@/types/equipment'
import equipmentService from '@/services/equipmentService'
import Swal from 'sweetalert2'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

interface InspectionModalProps {
    show: boolean
    onHide: () => void
    equipementId: number
    onSuccess: () => void
}

export default function InspectionModal({ show, onHide, equipementId, onSuccess }: InspectionModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        etatConstate: 'Bon' as EtatEquipement,
        scoreEtat: 8,
        observations: '',
        recommandeRemplacement: false,
        coutEstimeRemplacement: 0,
        checklistJson: JSON.stringify([
            { item: 'Structure / Corps', ok: true, commentaire: '' },
            { item: 'Composants mobiles', ok: true, commentaire: '' },
            { item: 'Sécurité / Protections', ok: true, commentaire: '' },
            { item: 'Nettoyage / Lubrification', ok: true, commentaire: '' }
        ])
    })

    const handleChecklistChange = (index: number, field: 'ok' | 'commentaire', value: any) => {
        const checklist = JSON.parse(formData.checklistJson)
        checklist[index][field] = value
        setFormData({ ...formData, checklistJson: JSON.stringify(checklist) })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await equipmentService.creerInspection(equipementId, {
                etatConstate: formData.etatConstate,
                scoreEtat: formData.scoreEtat,
                observations: formData.observations,
                recommandeRemplacement: formData.recommandeRemplacement,
                coutEstimeRemplacement: formData.coutEstimeRemplacement > 0 ? formData.coutEstimeRemplacement : undefined,
                checklistJson: formData.checklistJson
            })
            Swal.fire('Succès', 'Rapport d\'inspection enregistré', 'success')
            onSuccess()
            onHide()
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Une erreur est survenue', 'error')
        } finally {
            setLoading(false)
        }
    }

    const checklist = JSON.parse(formData.checklistJson)

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>
                    <IconifyIcon icon="ri:clipboard-line" className="me-2 text-primary" />
                    Nouvelle Inspection Technique
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">État Global Constaté</Form.Label>
                                <Form.Select
                                    value={formData.etatConstate}
                                    onChange={(e) => setFormData({ ...formData, etatConstate: e.target.value as EtatEquipement })}
                                >
                                    <option value="Neuf">Neuf</option>
                                    <option value="Bon">Bon État</option>
                                    <option value="Use">Usé / Fatigué</option>
                                    <option value="ARemplacer">À Remplacer</option>
                                    <option value="HorsService">Hors Service</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold d-flex justify-content-between">
                                    Score Santé <span>{formData.scoreEtat}/10</span>
                                </Form.Label>
                                <Form.Range
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={formData.scoreEtat}
                                    onChange={(e) => setFormData({ ...formData, scoreEtat: parseInt(e.target.value) })}
                                />
                                <div className="d-flex justify-content-between small text-muted">
                                    <span>HS (1)</span>
                                    <span>Parfait (10)</span>
                                </div>
                            </Form.Group>
                        </Col>
                    </Row>

                    <h6 className="mt-3 mb-3 text-uppercase fs-12 fw-bold text-muted">Contrôle de Sécurité & Fonctionnel</h6>
                    <div className="bg-light rounded p-3 mb-4">
                        {checklist.map((item: any, idx: number) => (
                            <Row key={idx} className="align-items-center mb-2">
                                <Col xs={5}>
                                    <span className="small fw-medium">{item.item}</span>
                                </Col>
                                <Col xs={3}>
                                    <Form.Check 
                                        type="switch"
                                        label={item.ok ? "Conforme" : "Défaut"}
                                        checked={item.ok}
                                        onChange={(e) => handleChecklistChange(idx, 'ok', e.target.checked)}
                                        className={item.ok ? "text-success" : "text-danger"}
                                    />
                                </Col>
                                <Col xs={4}>
                                    <Form.Control 
                                        size="sm"
                                        placeholder="Note..."
                                        value={item.commentaire}
                                        onChange={(e) => handleChecklistChange(idx, 'commentaire', e.target.value)}
                                    />
                                </Col>
                            </Row>
                        ))}
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Observations détaillées</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.observations}
                            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                            placeholder="Anomalies détectées, pièces à commander..."
                        />
                    </Form.Group>

                    <Row className="align-items-center">
                        <Col md={6}>
                            <Form.Group className="mb-0">
                                <Form.Check 
                                    type="checkbox"
                                    label="Recommander le remplacement"
                                    checked={formData.recommandeRemplacement}
                                    onChange={(e) => setFormData({ ...formData, recommandeRemplacement: e.target.checked })}
                                    className="text-danger fw-bold"
                                />
                            </Form.Group>
                        </Col>
                        {formData.recommandeRemplacement && (
                            <Col md={6}>
                                <Form.Group className="mb-0">
                                    <Form.Control 
                                        type="number"
                                        placeholder="Coût estimé DT"
                                        value={formData.coutEstimeRemplacement}
                                        onChange={(e) => setFormData({ ...formData, coutEstimeRemplacement: Number(e.target.value) })}
                                    />
                                </Form.Group>
                            </Col>
                        )}
                    </Row>
                </Modal.Body>
                <Modal.Footer className="bg-light border-0">
                    <Button variant="outline-secondary" onClick={onHide} disabled={loading}>
                        Annuler
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading && <Spinner size="sm" className="me-1" />}
                        Enregistrer le rapport
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}
