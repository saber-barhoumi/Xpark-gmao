import { Row, Col, Card, Badge, Button, ListGroup, Alert } from 'react-bootstrap'
import dayjs from 'dayjs'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { NoteEquipement, ContratFournisseur } from '@/types/equipment'
import equipmentService from '@/services/equipmentService'
import { useState } from 'react'
import NoteModal from './NoteModal'
import ContratModal from './ContratModal'
import Swal from 'sweetalert2'

interface NotesContratsTabProps {
    equipementId: number
    notesGenerales?: string
    notes: NoteEquipement[]
    contrats: ContratFournisseur[]
    onRefresh: () => void
}

const NotesContratsTab = ({ equipementId, notesGenerales, notes, contrats, onRefresh }: NotesContratsTabProps) => {
    const [deletingNote, setDeletingNote] = useState<number | null>(null)
    const [deletingContrat, setDeletingContrat] = useState<number | null>(null)

    // Modals state
    const [showNoteModal, setShowNoteModal] = useState(false)
    const [selectedNote, setSelectedNote] = useState<NoteEquipement | null>(null)
    const [showContratModal, setShowContratModal] = useState(false)
    const [selectedContrat, setSelectedContrat] = useState<ContratFournisseur | null>(null)

    const handleAddNote = () => {
        setSelectedNote(null)
        setShowNoteModal(true)
    }

    const handleEditNote = (note: NoteEquipement) => {
        setSelectedNote(note)
        setShowNoteModal(true)
    }

    const handleAddContrat = () => {
        setSelectedContrat(null)
        setShowContratModal(true)
    }

    const handleEditContrat = (contrat: ContratFournisseur) => {
        setSelectedContrat(contrat)
        setShowContratModal(true)
    }

    const handleDeleteNote = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer la note ?',
            text: 'Cette action est irréversible.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimer'
        })
        if (!result.isConfirmed) return
        
        setDeletingNote(id)
        try {
            await equipmentService.deleteNote(id)
            onRefresh()
            Swal.fire('Supprimé', 'La note a été supprimée.', 'success')
        } catch (err) {
            Swal.fire('Erreur', 'Impossible de supprimer la note.', 'error')
        } finally {
            setDeletingNote(null)
        }
    }

    const handleDeleteContrat = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer le contrat ?',
            text: 'Cette action est irréversible.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimer'
        })
        if (!result.isConfirmed) return

        setDeletingContrat(id)
        try {
            await equipmentService.deleteContrat(id)
            onRefresh()
            Swal.fire('Supprimé', 'Le contrat a été supprimé.', 'success')
        } catch (err) {
            Swal.fire('Erreur', 'Impossible de supprimer le contrat.', 'error')
        } finally {
            setDeletingContrat(null)
        }
    }

    return (
        <div className="p-1">
            <div className="mb-5">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                    <h5 className="mb-0 d-flex align-items-center">
                        <IconifyIcon icon="ri:sticky-note-line" className="me-2 text-warning fs-20" />
                        Notes & Observations
                    </h5>
                    <Button variant="soft-primary" size="sm" className="d-flex align-items-center" onClick={handleAddNote}>
                        <IconifyIcon icon="ri:add-line" className="me-1" /> Nouvel Note
                    </Button>
                </div>

                <div className="mb-4">
                    <h6 className="fs-13 text-uppercase text-muted mb-2">Note Générale (Admin)</h6>
                    <div className="p-3 bg-light rounded text-muted fs-14 border-dashed">
                        {notesGenerales || "Aucune note générale enregistrée."}
                    </div>
                </div>

                <Row>
                    {notes?.map(note => (
                        <Col md={12} key={note.id} className="mb-3">
                            <Card className={`border-0 shadow-none border-start border-3 border-${note.priorite === 'danger' ? 'danger' : note.priorite === 'warning' ? 'warning' : 'info'} bg-soft-${note.priorite === 'danger' ? 'danger' : note.priorite === 'warning' ? 'warning' : 'info'}-subtle`}>
                                <Card.Body className="py-2 px-3">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <small className="fw-bold text-dark d-flex align-items-center">
                                            {note.isEpingle && <IconifyIcon icon="ri:pushpin-fill" className="me-1 text-danger" />}
                                            {note.nomAuteur}
                                        </small>
                                        <div className="d-flex align-items-center gap-2">
                                            <small className="text-muted fs-11">{dayjs(note.dateCreation).format('DD/MM/YYYY HH:mm')}</small>
                                            <div className="d-flex gap-1">
                                                <Button 
                                                    variant="link" 
                                                    className="p-0 text-primary shadow-none" 
                                                    onClick={() => handleEditNote(note)}
                                                >
                                                    <IconifyIcon icon="ri:edit-line" />
                                                </Button>
                                                <Button 
                                                    variant="link" 
                                                    className="p-0 text-danger shadow-none" 
                                                    onClick={() => handleDeleteNote(note.id)}
                                                    disabled={deletingNote === note.id}
                                                >
                                                    <IconifyIcon icon="ri:delete-bin-line" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mb-2 text-dark fs-13" style={{ whiteSpace: 'pre-wrap' }}>{note.contenu}</p>
                                    {note.tags && note.tags.length > 0 && (
                                        <div className="d-flex gap-1 flex-wrap">
                                            {note.tags.map(tag => (
                                                <Badge key={tag} bg="light" text="dark" className="border">#{tag}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                    {(!notes || notes.length === 0) && !notesGenerales && (
                        <Col xs={12}>
                            <p className="text-muted small text-center italic py-3">Aucune note spécifique ou observation.</p>
                        </Col>
                    )}
                </Row>
            </div>

            <div>
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                    <h5 className="mb-0 d-flex align-items-center">
                        <IconifyIcon icon="ri:refund-2-line" className="me-2 text-success fs-20" />
                        Contrats Fournisseurs & Garanties
                    </h5>
                    <Button variant="soft-success" size="sm" className="d-flex align-items-center" onClick={handleAddContrat}>
                        <IconifyIcon icon="ri:add-line" className="me-1" /> Ajouter Contrat
                    </Button>
                </div>

                <Row>
                    {contrats?.map(contrat => (
                        <Col md={12} key={contrat.id} className="mb-3">
                            <Card className={`border shadow-none ${contrat.estExpire ? 'border-danger-subtle' : 'border-light'}`}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <h6 className="my-0 fw-bold">{contrat.nomFournisseur}</h6>
                                                <Badge bg={contrat.estExpire ? 'danger' : 'success'} className="px-2">
                                                    {contrat.type}
                                                </Badge>
                                            </div>
                                            <small className="text-muted">Réf: {contrat.numeroContrat || 'N/A'}</small>
                                        </div>
                                        <div className="d-flex gap-2">
                                            {contrat.documentUrl && (
                                                <Button variant="light" size="sm" onClick={() => window.open(contrat.documentUrl, '_blank')}>
                                                    <IconifyIcon icon="ri:file-download-line" />
                                                </Button>
                                            )}
                                            <Button 
                                                variant="light" 
                                                size="sm" 
                                                onClick={() => handleEditContrat(contrat)}
                                            >
                                                <IconifyIcon icon="ri:edit-line" />
                                            </Button>
                                            <Button 
                                                variant="light" 
                                                size="sm" 
                                                className="text-danger"
                                                onClick={() => handleDeleteContrat(contrat.id)}
                                                disabled={deletingContrat === contrat.id}
                                            >
                                                <IconifyIcon icon="ri:delete-bin-line" />
                                            </Button>
                                        </div>
                                    </div>

                                    <Row className="g-2 text-center mb-3">
                                        <Col xs={4}>
                                            <div className="bg-light p-2 rounded">
                                                <small className="text-muted d-block fs-11">Début</small>
                                                <span className="fw-medium fs-12">{dayjs(contrat.dateDebutUtc).format('DD/MM/YY')}</span>
                                            </div>
                                        </Col>
                                        <Col xs={4}>
                                            <div className={`p-2 rounded ${contrat.estExpire ? 'bg-soft-danger' : 'bg-light'}`}>
                                                <small className="text-muted d-block fs-11">Échéance</small>
                                                <span className={`fw-medium fs-12 ${contrat.estExpire ? 'text-danger' : ''}`}>{dayjs(contrat.dateFinUtc).format('DD/MM/YY')}</span>
                                            </div>
                                        </Col>
                                        <Col xs={4}>
                                            <div className="bg-light p-2 rounded">
                                                <small className="text-muted d-block fs-11">Montant Annuel</small>
                                                <span className="fw-medium fs-12">{contrat.montantAnnuel ? `${contrat.montantAnnuel} DT` : '-'}</span>
                                            </div>
                                        </Col>
                                    </Row>

                                    {contrat.estExpire ? (
                                        <Alert variant="danger" className="py-1 px-2 border-0 small mb-0 d-flex align-items-center">
                                            <IconifyIcon icon="ri:error-warning-line" className="me-1" />
                                            Contrat expiré depuis {Math.abs(contrat.joursRestants) || 0} jours.
                                        </Alert>
                                    ) : contrat.joursRestants <= 30 ? (
                                        <Alert variant="warning" className="py-1 px-2 border-0 small mb-0 d-flex align-items-center">
                                            <IconifyIcon icon="ri:time-line" className="me-1" />
                                            Expire bientôt ({contrat.joursRestants} jours).
                                        </Alert>
                                    ) : (
                                        <div className="d-flex align-items-center gap-2 fs-12 text-success">
                                            <IconifyIcon icon="ri:checkbox-circle-line" />
                                            Contrat actif ({contrat.joursRestants} jours restants)
                                        </div>
                                    )}

                                    {(contrat.contactFournisseur || contrat.telephoneSAV) && (
                                        <div className="mt-3 pt-2 border-top d-flex justify-content-between small">
                                            <span className="text-muted">
                                                <IconifyIcon icon="ri:user-voice-line" className="me-1" />
                                                {contrat.contactFournisseur || 'N/A'}
                                            </span>
                                            <span className="text-primary fw-medium">
                                                <IconifyIcon icon="ri:phone-line" className="me-1" />
                                                {contrat.telephoneSAV || 'N/A'}
                                            </span>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                    {(!contrats || contrats.length === 0) && (
                        <Col xs={12}>
                            <Alert variant="info" className="bg-soft-info border-info-subtle py-4 text-center">
                                <IconifyIcon icon="ri:information-line" className="fs-32 mb-2 d-block mx-auto text-info opacity-50" />
                                <h6 className="mb-1">Aucun contrat fournisseur actif</h6>
                                <p className="small mb-0 opacity-75">Connectez un contrat de maintenance ou une extension de garantie.</p>
                            </Alert>
                        </Col>
                    )}
                </Row>
            </div>

            <NoteModal 
                show={showNoteModal}
                onHide={() => setShowNoteModal(false)}
                equipementId={equipementId}
                note={selectedNote}
                onSuccess={onRefresh}
            />

            <ContratModal
                show={showContratModal}
                onHide={() => setShowContratModal(false)}
                equipementId={equipementId}
                contrat={selectedContrat}
                onSuccess={onRefresh}
            />
        </div>
    )
}

export default NotesContratsTab
