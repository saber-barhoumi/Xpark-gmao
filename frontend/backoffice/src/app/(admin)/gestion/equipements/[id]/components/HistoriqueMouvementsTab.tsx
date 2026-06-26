import { useState } from 'react'
import { Table, Badge, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { Mouvement } from '@/types/equipment'
import CheckInModal from './CheckInModal'

interface HistoriqueMouvementsTabProps {
    mouvements: Mouvement[]
    onRefresh?: () => void
}

const HistoriqueMouvementsTab = ({ mouvements, onRefresh }: HistoriqueMouvementsTabProps) => {
    const [selectedMouvement, setSelectedMouvement] = useState<Mouvement | null>(null)
    const [showCheckInModal, setShowCheckInModal] = useState(false)

    const handleCheckIn = (m: Mouvement) => {
        setSelectedMouvement(m)
        setShowCheckInModal(true)
    }

    return (
        <div className="table-responsive">
            <Table hover className="table-centered mb-0 py-2">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Mission / Usage</th>
                        <th>Date Début</th>
                        <th>Date Fin</th>
                        <th>État Retour</th>
                        <th className="text-end">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {mouvements?.map(m => (
                        <tr key={m.id}>
                            <td>
                                <Badge bg={m.type === 'CheckOut' ? 'soft-info' : 'soft-success'} text={m.type === 'CheckOut' ? 'info' : 'success'}>
                                    {m.type}
                                </Badge>
                            </td>
                            <td>
                                {m.referenceMission ? (
                                    <Link to={`/gestion/missions/${m.missionId}`} className="fw-semibold text-primary">
                                        {m.referenceMission}
                                    </Link>
                                ) : (
                                    <span className="text-muted italic">Usage interne / Pool</span>
                                )}
                                <div className="small text-muted">
                                    <span className="fw-medium">Par:</span> {m.nomUtilisateur || 'N/A'}
                                </div>
                            </td>
                            <td>{dayjs(m.dateDebutUtc).format('DD/MM/YYYY HH:mm')}</td>
                            <td>{m.dateFinUtc ? dayjs(m.dateFinUtc).format('DD/MM/YYYY HH:mm') : '-'}</td>
                            <td>
                                {m.etatApresRetour ? (
                                    <Badge bg="outline-secondary" className="fw-normal">{m.etatApresRetour}</Badge>
                                ) : (
                                    <span className="text-muted">-</span>
                                )}
                            </td>
                            <td className="text-end">
                                {m.type === 'CheckOut' && !m.dateFinUtc && (
                                    <Button 
                                        variant="outline-primary" 
                                        size="sm" 
                                        className="btn-light border-0 shadow-none py-0 px-2"
                                        onClick={() => handleCheckIn(m)}
                                        title="Enregistrer le retour"
                                    >
                                        <i className="ri-logout-box-r-line fs-14 me-1"></i> Check-In
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {(!mouvements || mouvements.length === 0) && (
                        <tr>
                            <td colSpan={6} className="text-center py-5 text-muted">
                                <i className="ri-history-line fs-24 d-block mb-2"></i>
                                Aucun historique de mouvement pour cet équipement.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <CheckInModal 
                show={showCheckInModal}
                onHide={() => setShowCheckInModal(false)}
                mouvement={selectedMouvement}
                onSuccess={() => onRefresh && onRefresh()}
            />
        </div>
    )
}

export default HistoriqueMouvementsTab
