'use client'

import { Modal } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import OptimizerPanel from '@/components/optimizer/OptimizerPanel'

interface OptimizerPlanningModalProps {
    show: boolean
    onHide: () => void
    reloadList: () => void
}

/**
 * Accès rapide à l'OptimisateurFlotteIA depuis la page missions.
 * La page dédiée /gestion/optimisateur offre la même fonctionnalité
 * avec les explications de l'algorithme.
 */
const OptimizerPlanningModal = ({ show, onHide, reloadList }: OptimizerPlanningModalProps) => (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static">
        <Modal.Header closeButton className="bg-dark text-white">
            <Modal.Title>
                <IconifyIcon icon="ri:brain-line" className="me-2" />
                OptimisateurFlotteIA — Planning automatique
            </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
            {show && (
                <OptimizerPanel onApplied={() => { reloadList(); onHide() }} />
            )}
        </Modal.Body>
    </Modal>
)

export default OptimizerPlanningModal
