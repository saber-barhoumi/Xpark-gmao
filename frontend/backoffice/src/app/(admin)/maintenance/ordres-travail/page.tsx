import { useState, useEffect, useCallback } from 'react'
import { Badge, Button, Card, Col, Modal, Row, Form, Spinner, Alert } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import ordreTravailService, { OrdreTravail, CreateOrdreTravailDto } from '@/services/ordreTravailService'
import PriorityIcon from '@/components/maintenance/PriorityIcon'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import Swal from 'sweetalert2'
import api from '@/lib/axiosConfig'
import { useApiError } from '@/hooks/useApiError'
import { AlerteErreur } from '@/components/AlerteErreur'
import useBulkSelection from '@/hooks/useBulkSelection'
import BulkDeleteButtons from '@/components/table/BulkDeleteButtons'



interface VehiculeOption {
    idVehicule: number
    immatriculation: string
    marque: string
    modele: string
}

const STATUT_COLORS: Record<string, string> = {
    PLANIFIE: 'primary',
    EN_COURS: 'warning',
    TERMINE: 'success',
    ANNULE: 'danger',
}

const STATUTS = ['PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE']
const PRIORITIES = ['BASSE', 'MOYENNE', 'HAUTE', 'URGENT']

const todayStr = () => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const toLocalDateStr = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function OrdresTravailPage() {
    const [ordres, setOrdres] = useState<OrdreTravail[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const { error, execute, clearError } = useApiError()
    const [filterStatut, setFilterStatut] = useState('')
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
    const [page, setPage] = useState(1)

    // Véhicules pour le select
    const [vehicules, setVehicules] = useState<VehiculeOption[]>([])
    const [loadingVehicules, setLoadingVehicules] = useState(false)

    // Modal état
    const [showModal, setShowModal] = useState(false)
    const [editOrdre, setEditOrdre] = useState<OrdreTravail | null>(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<CreateOrdreTravailDto>({
        description: '',
        vehiculeId: 0,
        priorite: 'MOYENNE',
    })
    const [validated, setValidated] = useState(false)

    // Sélection multiple (suppression en masse, vue tableau)
    const [deleting, setDeleting] = useState(false)
    const sel = useBulkSelection(ordres, o => o.idOrdreTravail)

    // Charger les véhicules disponibles
    const loadVehicules = useCallback(async () => {
        setLoadingVehicules(true)
        const res = await execute(() => api.get('/vehicules', {
            params: { pageSize: 200 }
        }))
        if (res) {
            const list = res.data?.data ?? res.data?.items ?? []
            setVehicules(list)
        }
        setLoadingVehicules(false)
    }, [execute])

    useEffect(() => { loadVehicules() }, [loadVehicules])

    const load = useCallback(async () => {
        setLoading(true)
        clearError()
        const data = await execute(() =>
            ordreTravailService.getAll({ statut: filterStatut || undefined, page, pageSize: 20 })
        )
        if (data) {
            setOrdres(data.items)
            setTotal(data.total)
        }
        setLoading(false)
    }, [filterStatut, page, execute, clearError])

    useEffect(() => { load() }, [load])

    const openCreate = () => {
        setEditOrdre(null)
        setForm({ description: '', vehiculeId: 0, priorite: 'MOYENNE' })
        setValidated(false)
        setShowModal(true)
    }

    const openEdit = (ordre: OrdreTravail) => {
        setEditOrdre(ordre)
        setForm({
            description: ordre.description,
            vehiculeId: ordre.vehiculeId,
            technicienId: ordre.technicienId,
            priorite: ordre.priorite,
            dateDebut: ordre.dateDebut ? toLocalDateStr(new Date(ordre.dateDebut)) : '',
            dateFin: ordre.dateFin ? toLocalDateStr(new Date(ordre.dateFin)) : '',
        })
        setValidated(false)
        setShowModal(true)
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (!e.currentTarget.checkValidity()) {
            setValidated(true)
            return
        }

        // ── Custom validations ──────────────────────────────────────────
        if (form.description.trim().length < 10) {
            Swal.fire('Erreur', 'La description doit contenir au moins 10 caractères.', 'error'); return
        }
        if (form.dateDebut && form.dateDebut < todayStr()) {
            Swal.fire('Date invalide', 'La date de début ne peut pas être dans le passé.', 'warning'); return
        }
        if (form.dateDebut && form.dateFin && form.dateFin <= form.dateDebut) {
            Swal.fire('Date invalide', 'La date de fin doit être postérieure à la date de début.', 'warning'); return
        }

        setSaving(true)
        clearError()
        const payload = {
            ...form,
            technicienId: form.technicienId || undefined,
            dateDebut: form.dateDebut ? new Date(form.dateDebut).toISOString() : undefined,
            dateFin: form.dateFin ? new Date(form.dateFin).toISOString() : undefined,
        }

        const response = await execute(async () => {
            if (editOrdre) {
                await ordreTravailService.update(editOrdre.idOrdreTravail, payload)
            } else {
                await ordreTravailService.create(payload)
            }
            return true
        })

        if (response) {
            setShowModal(false)
            await load()
        }
        setSaving(false)
    }

    const handleChangeStatut = async (id: number, statut: string) => {
        try {
            await ordreTravailService.update(id, { statut })
            // Mise à jour locale optimiste
            setOrdres(prev => prev.map(o => o.idOrdreTravail === id ? { ...o, statut } : o))
        } catch {
            load()
        }
    }

    // Suppression en masse : réutilise ordreTravailService.delete unitaire
    const deleteMany = async (ids: number[]) => {
        setDeleting(true)
        clearError()
        try {
            await Promise.all(ids.map(id => ordreTravailService.delete(id)))
            sel.clear()
            await load()
            Swal.fire('Supprimés', `${ids.length} ordre(s) de travail supprimé(s).`, 'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Suppression partielle ou impossible.', 'error')
            await load()
        } finally { setDeleting(false) }
    }

    const handleDelete = async (id: number, ref: string) => {
        const result = await Swal.fire({
            title: `Supprimer ${ref} ?`,
            text: 'Cette action est irréversible.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Supprimer',
            cancelButtonText: 'Annuler',
        })
        if (result.isConfirmed) {
            clearError()
            const success = await execute(async () => {
                await ordreTravailService.delete(id)
                return true
            })
            if (success) {
                Swal.fire('Supprimé !', '', 'success')
                await load()
            }
        }
    }

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result
        if (!destination) return
        if (destination.droppableId === source.droppableId) return

        const id = parseInt(draggableId)
        const newStatut = destination.droppableId

        clearError()
        const success = await execute(async () => {
            await ordreTravailService.update(id, { statut: newStatut })
            return true
        })
        if (success) {
            setOrdres(prev => prev.map(o => o.idOrdreTravail === id ? { ...o, statut: newStatut } : o))
        } else {
            await load()
        }
    }

    return (
        <>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="ri:file-list-3-line" className="me-2 text-primary" />
                        Ordres de Travail
                    </h4>
                    <p className="text-muted mb-0">{total} ordre(s) trouvé(s)</p>
                </Col>
                <Col xs="auto" className="d-flex gap-2 flex-wrap">
                    <BulkDeleteButtons
                        selectedCount={sel.count} totalCount={ordres.length}
                        label="ordre(s) de travail" deleting={deleting}
                        onDeleteSelected={() => deleteMany(sel.selectedIds)}
                        onDeleteAll={() => deleteMany(ordres.map(o => o.idOrdreTravail))}
                    />
                    <div className="btn-group btn-group-sm">
                        <Button variant={viewMode === 'table' ? 'primary' : 'light'} onClick={() => setViewMode('table')}>
                            <IconifyIcon icon="ri:table-line" />
                        </Button>
                        <Button variant={viewMode === 'kanban' ? 'primary' : 'light'} onClick={() => setViewMode('kanban')}>
                            <IconifyIcon icon="ri:kanban-view" />
                        </Button>
                    </div>
                    <Form.Select size="sm" value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setPage(1) }} style={{ width: 140 }}>
                        <option value="">Tous les statuts</option>
                        {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </Form.Select>
                    <Button variant="primary" size="sm" onClick={openCreate} className="px-3">
                        <IconifyIcon icon="ri:add-line" className="me-1" />
                        Nouvel Ordre
                    </Button>
                </Col>
            </Row>

            {error && (
                <AlerteErreur
                    status={error.status}
                    message={error.message}
                    onDismiss={clearError}
                    className="mb-3"
                />
            )}

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : ordres.length === 0 ? (
                <Card className="text-center py-5">
                    <Card.Body>
                        <IconifyIcon icon="ri:file-list-3-line" className="fs-1 text-muted mb-2" />
                        <p className="text-muted">Aucun ordre de travail</p>
                        <Button variant="primary" onClick={openCreate}>Créer le premier</Button>
                    </Card.Body>
                </Card>
            ) : viewMode === 'kanban' ? (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Row className="flex-nowrap overflow-auto pb-3 kanban-container" style={{ minHeight: '600px' }}>
                        {STATUTS.map(s => (
                            <Col key={s} style={{ minWidth: 320 }}>
                                <div className="bg-light rounded p-2 h-100 shadow-none">
                                    <div className="d-flex justify-content-between align-items-center mb-2 px-2">
                                        <h6 className="mb-0 fw-bold">{s.replace('_', ' ')}</h6>
                                        <Badge bg={STATUT_COLORS[s]} pill>{ordres.filter(o => o.statut === s).length}</Badge>
                                    </div>
                                    <Droppable droppableId={s}>
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef} style={{ minHeight: 100 }}>
                                                {ordres.filter(o => o.statut === s).map((ordre, index) => (
                                                    <Draggable key={ordre.idOrdreTravail} draggableId={ordre.idOrdreTravail.toString()} index={index}>
                                                        {(provided) => (
                                                            <Card
                                                                className="mb-2 shadow-sm border-0"
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                ref={provided.innerRef}
                                                            >
                                                                <Card.Body className="p-2">
                                                                    <div className="d-flex justify-content-between mb-1">
                                                                        <small className="fw-bold text-primary">{ordre.reference}</small>
                                                                        <PriorityIcon priority={ordre.priorite} />
                                                                    </div>
                                                                    <div className="fw-semibold mb-1 small">{ordre.vehiculeImmatriculation}</div>
                                                                    <p className="text-muted small mb-2 text-truncate-2" style={{ fontSize: '0.8rem', height: '2.4rem', overflow: 'hidden' }}>
                                                                        {ordre.description}
                                                                    </p>
                                                                    <div className="d-flex justify-content-between align-items-center border-top pt-2">
                                                                        <div className="d-flex align-items-center gap-1">
                                                                            <IconifyIcon icon="ri:tools-line" className="text-muted" style={{ fontSize: '0.9rem' }} />
                                                                            <small className="text-muted">{ordre.nombreInterventions}</small>
                                                                        </div>
                                                                        <div className="d-flex gap-1">
                                                                            <button className="btn btn-sm btn-light p-1" onClick={() => openEdit(ordre)}><IconifyIcon icon="ri:edit-line" /></button>
                                                                            <button className="btn btn-sm btn-light p-1 text-danger" onClick={() => handleDelete(ordre.idOrdreTravail, ordre.reference)}><IconifyIcon icon="ri:delete-bin-line" /></button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-2" style={{ height: '4px' }}>
                                                                        <div className="progress h-100 bg-light">
                                                                            <div
                                                                                className={`progress-bar bg-success`}
                                                                                style={{ width: `${ordre.statut === 'TERMINE' ? 100 : (ordre.statut === 'EN_COURS' ? (ordre.nombreInterventions > 0 ? 50 : 10) : 0)}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </DragDropContext>
            ) : (
                <Card>
                    <div className="table-responsive">
                        <table className="table table-hover table-centered mb-0 border-top">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: 34 }}>
                                        <input type="checkbox" className="form-check-input"
                                            checked={sel.allSelected} onChange={sel.toggleAll}
                                            title="Tout sélectionner" />
                                    </th>
                                    <th style={{ width: '60px' }}>Prio.</th>
                                    <th>Référence</th>
                                    <th>Véhicule</th>
                                    <th>Statut</th>
                                    <th>Début</th>
                                    <th>Fin prévue</th>
                                    <th>Technicien</th>
                                    <th>Interv.</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordres.map(ordre => (
                                    <tr key={ordre.idOrdreTravail}>
                                        <td>
                                            <input type="checkbox" className="form-check-input"
                                                checked={sel.isSelected(ordre.idOrdreTravail)}
                                                onChange={() => sel.toggle(ordre.idOrdreTravail)} />
                                        </td>
                                        <td><PriorityIcon priority={ordre.priorite} /></td>
                                        <td><strong>{ordre.reference}</strong></td>
                                        <td>
                                            <div className="fw-semibold">{ordre.vehiculeImmatriculation}</div>
                                            <small className="text-muted">{ordre.vehiculeMarque} {ordre.vehiculeModele}</small>
                                        </td>
                                        <td>
                                            <Form.Select
                                                size="sm"
                                                value={ordre.statut}
                                                onChange={e => handleChangeStatut(ordre.idOrdreTravail, e.target.value)}
                                                style={{ width: 130 }}
                                                className={`border-0 fw-bold text-${STATUT_COLORS[ordre.statut]}`}
                                            >
                                                {STATUTS.map(s => (
                                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                                ))}
                                            </Form.Select>
                                        </td>
                                        <td>{ordre.dateDebut ? new Date(ordre.dateDebut).toLocaleDateString('fr-FR') : '—'}</td>
                                        <td>{ordre.dateFin ? new Date(ordre.dateFin).toLocaleDateString('fr-FR') : '—'}</td>
                                        <td>{ordre.technicienPrenom} {ordre.technicienNom || <span className="text-muted">—</span>}</td>
                                        <td>
                                            <Badge bg="info" pill>{ordre.nombreInterventions}</Badge>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <Button variant="light" size="sm" onClick={() => openEdit(ordre)} title="Modifier">
                                                    <IconifyIcon icon="ri:edit-line" />
                                                </Button>
                                                <Button variant="light" size="sm" className="text-danger" onClick={() => handleDelete(ordre.idOrdreTravail, ordre.reference)} title="Supprimer">
                                                    <IconifyIcon icon="ri:delete-bin-line" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Pagination visible seulement en mode table */}
            {viewMode === 'table' && total > 20 && (
                <div className="d-flex justify-content-center gap-2 mt-3">
                    <Button variant="outline-primary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        <IconifyIcon icon="ri:arrow-left-s-line" /> Précédent
                    </Button>
                    <span className="align-self-center text-muted">Page {page}</span>
                    <Button variant="outline-primary" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>
                        Suivant <IconifyIcon icon="ri:arrow-right-s-line" />
                    </Button>
                </div>
            )}

            {/* Modal Création/Édition */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>{editOrdre ? 'Modifier l\'ordre' : 'Nouvel ordre de travail'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate validated={validated} onSubmit={handleSave} id="ot-form">
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>🚗 Véhicule <span className="text-danger">*</span></Form.Label>
                                    {loadingVehicules ? (
                                        <div className="d-flex align-items-center gap-2 text-muted small"><Spinner size="sm" /></div>
                                    ) : (
                                        <>
                                            <Form.Select
                                                value={form.vehiculeId || ''}
                                                onChange={e => setForm(f => ({ ...f, vehiculeId: Number(e.target.value) }))}
                                                disabled={!!editOrdre}
                                                required
                                            >
                                                <option value="">— Sélectionner un véhicule —</option>
                                                {vehicules.map(v => (
                                                    <option key={v.idVehicule} value={v.idVehicule}>{v.immatriculation} ({v.marque})</option>
                                                ))}
                                            </Form.Select>
                                            <Form.Control.Feedback type="invalid">Le véhicule est obligatoire.</Form.Control.Feedback>
                                        </>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Priorité</Form.Label>
                                    <Form.Select
                                        value={form.priorite || 'MOYENNE'}
                                        onChange={e => setForm(f => ({ ...f, priorite: e.target.value as any }))}
                                    >
                                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                required
                                minLength={10}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Objectif de la maintenance..."
                            />
                            <Form.Control.Feedback type="invalid">La description est obligatoire (min. 10 caractères).</Form.Control.Feedback>
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date début</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={form.dateDebut || ''}
                                        min={todayStr()}
                                        onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Fin prévue</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={form.dateFin || ''}
                                        onChange={e => setForm(f => ({ ...f, dateFin: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Annuler</Button>
                    <Button variant="primary" type="submit" form="ot-form" disabled={saving}>
                        {saving && <Spinner size="sm" className="me-1" />}
                        {editOrdre ? 'Enregistrer' : 'Créer l\'Ordre'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
