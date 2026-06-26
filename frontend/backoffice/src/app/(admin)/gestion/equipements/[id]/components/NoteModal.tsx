import { useState, useEffect } from 'react'
import { Modal, Button, Form, Spinner } from 'react-bootstrap'
import { NoteEquipement, NoteCreateRequest, NoteUpdateRequest } from '@/types/equipment'
import equipmentService from '@/services/equipmentService'
import Swal from 'sweetalert2'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

interface NoteModalProps {
    show: boolean
    onHide: () => void
    equipementId: number
    note?: NoteEquipement | null
    onSuccess: () => void
}

export default function NoteModal({ show, onHide, equipementId, note, onSuccess }: NoteModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<NoteCreateRequest>({
        equipementId: equipementId,
        priorite: 'info',
        contenu: '',
        isEpingle: false,
    })

    useEffect(() => {
        if (note) {
            setFormData({
                equipementId: equipementId,
                priorite: note.priorite,
                contenu: note.contenu,
                isEpingle: note.isEpingle,
                tags: note.tags,
            })
        } else {
            setFormData({
                equipementId: equipementId,
                priorite: 'info',
                contenu: '',
                isEpingle: false,
            })
        }
    }, [note, equipementId, show])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (note) {
                await equipmentService.updateNote(note.id, { ...formData, id: note.id } as NoteUpdateRequest)
                Swal.fire('Succès', 'Note mise à jour', 'success')
            } else {
                await equipmentService.addNote(formData)
                Swal.fire('Succès', 'Note ajoutée', 'success')
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
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>
                    <IconifyIcon icon="ri:sticky-note-line" className="me-2 text-warning" />
                    {note ? 'Modifier la note' : 'Nouvelle Note'}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold fs-13">Priorité</Form.Label>
                        <div className="d-flex gap-2">
                            {['info', 'success', 'warning', 'danger'].map((p) => (
                                <Form.Check
                                    key={p}
                                    type="radio"
                                    id={`priorite-${p}`}
                                    label={p.charAt(0).toUpperCase() + p.slice(1)}
                                    name="priorite"
                                    checked={formData.priorite === p}
                                    onChange={() => setFormData({ ...formData, priorite: p as any })}
                                    className={`text-${p} fw-medium`}
                                />
                            ))}
                        </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold fs-13">Contenu</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            required
                            value={formData.contenu}
                            onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                            placeholder="Saisissez votre observation ici..."
                        />
                    </Form.Group>

                    <Form.Group className="mb-0">
                        <Form.Check 
                            type="checkbox"
                            label="Épingler cette note en haut"
                            checked={formData.isEpingle}
                            onChange={(e) => setFormData({ ...formData, isEpingle: e.target.checked })}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="bg-light border-0">
                    <Button variant="outline-secondary" onClick={onHide} disabled={loading}>
                        Annuler
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading && <Spinner size="sm" className="me-1" />}
                        {note ? 'Mettre à jour' : 'Enregistrer'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}
