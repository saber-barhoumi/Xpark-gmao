import { useState } from 'react'
import { Modal, Button, Form, Spinner } from 'react-bootstrap'
import { Mouvement, EtatApresRetour } from '@/types/equipment'
import equipmentService from '@/services/equipmentService'
import Swal from 'sweetalert2'

interface CheckInModalProps {
    show: boolean
    onHide: () => void
    mouvement: Mouvement | null
    onSuccess: () => void
}

export default function CheckInModal({ show, onHide, mouvement, onSuccess }: CheckInModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        etatApresRetour: 'Bon' as EtatApresRetour,
        observations: '',
        coutReparation: 0
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!mouvement) return

        setLoading(true)
        try {
            await equipmentService.checkIn({
                mouvementId: mouvement.id,
                etatApresRetour: formData.etatApresRetour,
                observations: formData.observations,
                coutReparation: formData.coutReparation > 0 ? formData.coutReparation : undefined
            })
            Swal.fire('Succès', 'Retour enregistré avec succès', 'success')
            onSuccess()
            onHide()
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Une erreur est survenue lors du retour', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>Retour au Dépôt</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                    <p className="text-muted small mb-4">
                        Vous enregistrez le retour de l'équipement lié à la mission <strong>{mouvement?.referenceMission || 'Usage interne'}</strong>.
                    </p>

                    <Form.Group className="mb-3">
                        <Form.Label>État de l'équipement au retour *</Form.Label>
                        <Form.Select
                            value={formData.etatApresRetour}
                            onChange={(e) => setFormData({ ...formData, etatApresRetour: e.target.value as EtatApresRetour })}
                        >
                            <option value="Bon">Bon État (Opérationnel)</option>
                            <option value="Use">Usé (Fonctionne mais usé)</option>
                            <option value="Endommage">Endommagé (Nécessite réparation)</option>
                            <option value="Perdu">Perdu / Volé</option>
                        </Form.Select>
                    </Form.Group>

                    {formData.etatApresRetour === 'Endommage' && (
                        <Form.Group className="mb-3">
                            <Form.Label>Coût estimé des réparations (DT)</Form.Label>
                            <Form.Control
                                type="number"
                                value={formData.coutReparation}
                                onChange={(e) => setFormData({ ...formData, coutReparation: Number(e.target.value) })}
                                placeholder="0.00"
                            />
                        </Form.Group>
                    )}

                    <Form.Group className="mb-0">
                        <Form.Label>Observations / Commentaires</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.observations}
                            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                            placeholder="Détails sur l'état, pièces manquantes..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="bg-light border-0">
                    <Button variant="outline-secondary" onClick={onHide} disabled={loading}>
                        Annuler
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm" className="me-1" /> : null}
                        Valider le Retour
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}
