import { useState } from 'react'
import { ListGroup, Badge, Button } from 'react-bootstrap'
import dayjs from 'dayjs'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Inspection } from '@/types/equipment'
import InspectionModal from './InspectionModal'

interface InspectionsTechniquesTabProps {
    equipementId: number
    inspections: Inspection[]
    onRefresh?: () => void
}

const ETAT_COLORS: Record<string, string> = {
    Neuf: 'success',
    Bon: 'primary',
    Use: 'warning',
    ARemplacer: 'danger',
    HorsService: 'secondary',
}

const InspectionsTechniquesTab = ({ equipementId, inspections, onRefresh }: InspectionsTechniquesTabProps) => {
    const [showModal, setShowModal] = useState(false)

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fs-15 fw-bold">Historique des contrôles</h5>
                <Button 
                    variant="primary" 
                    size="sm" 
                    className="btn-soft-primary"
                    onClick={() => setShowModal(true)}
                >
                    <IconifyIcon icon="ri:add-line" className="me-1" />
                    Nouvelle Inspection
                </Button>
            </div>

            <ListGroup variant="flush">
            {inspections?.map(ins => (
                <ListGroup.Item key={ins.id} className="px-0 py-3 border-dashed-bottom">
                    <div className="d-flex w-100 justify-content-between align-items-start mb-2">
                        <div>
                            <h6 className="mb-1 d-flex align-items-center fw-bold">
                                <IconifyIcon icon="ri:shield-user-line" className="me-2 text-primary fs-18" />
                                {ins.nomTechnicien}
                            </h6>
                            <div className="d-flex align-items-center gap-2">
                                <Badge bg={ETAT_COLORS[ins.etatConstate] || 'info'} className="px-2">
                                    {ins.etatConstate}
                                </Badge>
                                <span className={`badge bg-soft-${ins.scoreEtat >= 7 ? 'success' : ins.scoreEtat >= 4 ? 'warning' : 'danger'} text-dark`}>
                                    Score: {ins.scoreEtat}/10
                                </span>
                            </div>
                        </div>
                        <small className="text-muted bg-light px-2 py-1 rounded">
                            <IconifyIcon icon="ri:calendar-line" className="me-1" />
                            {dayjs(ins.dateCreation).format('DD/MM/YYYY HH:mm')}
                        </small>
                    </div>
                    
                    <div className="bg-light p-3 rounded mt-2 border-start border-3 border-primary shadow-none">
                        <p className="text-muted small mb-0 fw-medium">
                            <IconifyIcon icon="ri:chat-3-line" className="me-2 text-muted" />
                            {ins.observations || "Aucune observation détaillée enregistrée."}
                        </p>
                    </div>

                    {(ins.recommandeRemplacement || (ins.coutEstimeRemplacement && ins.coutEstimeRemplacement > 0)) && (
                        <div className="mt-2 d-flex gap-2 flex-wrap">
                            {ins.recommandeRemplacement && (
                                <Badge bg="soft-danger" text="danger" className="d-flex align-items-center p-2">
                                    <IconifyIcon icon="ri:error-warning-line" className="me-1 fs-14" />
                                    Remplacement impératif recommandé
                                </Badge>
                            )}
                            {ins.coutEstimeRemplacement && ins.coutEstimeRemplacement > 0 && (
                                <Badge bg="soft-warning" text="warning" className="d-flex align-items-center p-2">
                                    <IconifyIcon icon="ri:price-tag-3-line" className="me-1 fs-14" />
                                    Coût estimé: {ins.coutEstimeRemplacement} DT
                                </Badge>
                            )}
                        </div>
                    )}
                </ListGroup.Item>
            ))}
            {(!inspections || inspections.length === 0) && (
                <div className="text-center py-5">
                    <div className="bg-soft-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '64px', height: '64px'}}>
                        <IconifyIcon icon="ri:clipboard-line" className="fs-32 text-muted opacity-50" />
                    </div>
                    <h5 className="text-muted fw-normal">Aucune inspection enregistrée</h5>
                    <p className="text-muted small">Les rapports de maintenance périodique apparaîtront ici.</p>
                </div>
            )}
            </ListGroup>

            <InspectionModal 
                show={showModal}
                onHide={() => setShowModal(false)}
                equipementId={equipementId}
                onSuccess={() => onRefresh && onRefresh()}
            />
        </>
    )
}

export default InspectionsTechniquesTab
