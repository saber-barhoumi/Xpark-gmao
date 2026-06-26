import React, { useState } from 'react'
import { Button, Form, Modal, Spinner } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import missionService from '@/services/missionService'
import Swal from 'sweetalert2'
import { Mission } from '@/types/mission'
import { useApiError } from '@/hooks/useApiError'
import { AlerteErreur } from '@/components/AlerteErreur'

interface CloseMissionModalProps {
    show: boolean
    onHide: () => void
    mission: Mission | null
    reloadList: () => void
}

const CloseMissionModal = ({ show, onHide, mission, reloadList }: CloseMissionModalProps) => {
    const [kilometrageRetour, setKilometrageRetour] = useState<number>(0)
    const [isSaving, setIsSaving] = useState(false)
    const { error, execute, clearError } = useApiError()

    const handleClose = async () => {
        if (!mission) return
        if (kilometrageRetour <= mission.kilometrageDepart) {
            Swal.fire('Erreur', 'Le kilométrage de retour doit être supérieur au kilométrage de départ.', 'error')
            return
        }

        setIsSaving(true)
        clearError()
        const success = await execute(async () => {
            await missionService.close(mission.idMission, { kilometrageRetour })
            await Swal.fire('Mission Clôturée', 'Le véhicule et le chauffeur sont à nouveau disponibles.', 'success')
            reloadList()
            onHide()
            return true
        })
        setIsSaving(false)
    }

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="bg-success text-white">
                <Modal.Title>
                    <IconifyIcon icon="ri:check-double-line" className="me-2" />
                    Clôturer la Mission
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                {error && (
                    <AlerteErreur
                        status={error.status}
                        message={error.message}
                        onDismiss={clearError}
                        className="mb-4"
                    />
                )}
                {mission && (
                    <div className="mb-4">
                        <p className="mb-1 text-muted">Mission: <strong>{mission.objetMission}</strong></p>
                        <p className="mb-0 text-muted fst-italic small">Départ à {mission.kilometrageDepart} km</p>
                    </div>
                )}
                <Form.Group className="mb-3">
                    <Form.Label>Kilométrage au retour <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        type="number"
                        min={mission?.kilometrageDepart || 0}
                        value={kilometrageRetour}
                        onChange={e => setKilometrageRetour(Number(e.target.value))}
                        placeholder="Ex: 56450"
                        autoFocus
                    />
                    <Form.Text className="text-muted">
                        Distance parcourue: {kilometrageRetour > (mission?.kilometrageDepart || 0) ? kilometrageRetour - (mission?.kilometrageDepart || 0) : 0} km
                    </Form.Text>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onHide} disabled={isSaving}>
                    Annuler
                </Button>
                <Button variant="success" onClick={handleClose} disabled={isSaving}>
                    {isSaving ? <Spinner animation="border" size="sm" /> : 'Confirmer le retour'}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default CloseMissionModal
