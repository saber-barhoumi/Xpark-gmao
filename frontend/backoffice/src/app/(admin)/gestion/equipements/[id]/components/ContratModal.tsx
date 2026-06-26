import { useState, useEffect } from 'react'
import { Modal, Button, Form, Spinner, Row, Col } from 'react-bootstrap'
import { ContratFournisseur, ContratCreateRequest, ContratUpdateRequest } from '@/types/equipment'
import equipmentService from '@/services/equipmentService'
import Swal from 'sweetalert2'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

interface ContratModalProps {
    show: boolean
    onHide: () => void
    equipementId: number
    contrat?: ContratFournisseur | null
    onSuccess: () => void
}

export default function ContratModal({ show, onHide, equipementId, contrat, onSuccess }: ContratModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<ContratCreateRequest>({
        equipementId: equipementId,
        type: 'Garantie',
        nomFournisseur: '',
        numeroContrat: '',
        contactFournisseur: '',
        telephoneSAV: '',
        dateDebutUtc: new Date().toISOString().split('T')[0],
        dateFinUtc: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        montantAnnuel: 0,
        notes: '',
    })

    useEffect(() => {
        if (contrat) {
            setFormData({
                equipementId: equipementId,
                type: contrat.type,
                nomFournisseur: contrat.nomFournisseur,
                numeroContrat: contrat.numeroContrat || '',
                contactFournisseur: contrat.contactFournisseur || '',
                telephoneSAV: contrat.telephoneSAV || '',
                dateDebutUtc: new Date(contrat.dateDebutUtc).toISOString().split('T')[0],
                dateFinUtc: new Date(contrat.dateFinUtc).toISOString().split('T')[0],
                montantAnnuel: contrat.montantAnnuel || 0,
                notes: contrat.notes || '',
                documentUrl: contrat.documentUrl || '',
            })
        } else {
            setFormData({
                equipementId: equipementId,
                type: 'Garantie',
                nomFournisseur: '',
                numeroContrat: '',
                contactFournisseur: '',
                telephoneSAV: '',
                dateDebutUtc: new Date().toISOString().split('T')[0],
                dateFinUtc: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                montantAnnuel: 0,
                notes: '',
            })
        }
    }, [contrat, equipementId, show])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (contrat) {
                await equipmentService.updateContrat(contrat.id, { ...formData, id: contrat.id } as ContratUpdateRequest)
                Swal.fire('Succès', 'Contrat mis à jour', 'success')
            } else {
                await equipmentService.addContrat(formData)
                Swal.fire('Succès', 'Contrat ajouté', 'success')
            }
            onSuccess()
            onHide()
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Une erreur est survenue', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>
                    <IconifyIcon icon="ri:refund-2-line" className="me-2 text-success" />
                    {contrat ? 'Modifier le contrat' : 'Nouveau Contrat/Garantie'}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold fs-13">Type de Contrat</Form.Label>
                                <Form.Select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Garantie">Garantie Constructeur</option>
                                    <option value="MaintenancePreventive">Maintenance Préventive</option>
                                    <option value="MaintenanceCurative">Maintenance Curative</option>
                                    <option value="Location">Location / Leasing</option>
                                    <option value="Assurance">Assurance</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold fs-13">Nom Fournisseur</Form.Label>
                                <Form.Control
                                    type="text"
                                    required
                                    value={formData.nomFournisseur}
                                    onChange={(e) => setFormData({ ...formData, nomFournisseur: e.target.value })}
                                    placeholder="ex: Bosch, Caterpillar..."
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold fs-13">N° Contrat / Réf</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.numeroContrat}
                                    onChange={(e) => setFormData({ ...formData, numeroContrat: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold fs-13">Montant Annuel (DT)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.montantAnnuel}
                                    onChange={(e) => setFormData({ ...formData, montantAnnuel: Number(e.target.value) })}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold fs-13">Date Début</Form.Label>
                                <Form.Control
                                    type="date"
                                    required
                                    value={formData.dateDebutUtc}
                                    onChange={(e) => setFormData({ ...formData, dateDebutUtc: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold fs-13">Date Échéance</Form.Label>
                                <Form.Control
                                    type="date"
                                    required
                                    value={formData.dateFinUtc}
                                    onChange={(e) => setFormData({ ...formData, dateFinUtc: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold fs-13">Contact Principal (Nom/Email)</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.contactFournisseur}
                                    onChange={(e) => setFormData({ ...formData, contactFournisseur: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold fs-13">Tél SAV / Support</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.telephoneSAV}
                                    onChange={(e) => setFormData({ ...formData, telephoneSAV: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-0">
                        <Form.Label className="fw-bold fs-13">Notes complémentaires</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Clauses spécifiques, conditions de résiliation..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="bg-light border-0">
                    <Button variant="outline-secondary" onClick={onHide} disabled={loading}>
                        Annuler
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading && <Spinner size="sm" className="me-1" />}
                        {contrat ? 'Mettre à jour' : 'Enregistrer'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}
