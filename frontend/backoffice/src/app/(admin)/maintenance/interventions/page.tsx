import { useState, useEffect, useCallback, useMemo } from 'react'
import { Badge, Button, Card, Col, Modal, Row, Form, Spinner, Alert, ButtonGroup, OverlayTrigger, Tooltip } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import interventionService, { Intervention, CreateInterventionDto } from '@/services/interventionService'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import bootstrapPlugin from '@fullcalendar/bootstrap'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import Swal from 'sweetalert2'
import api from '@/lib/axiosConfig'
import { useApiError } from '@/hooks/useApiError'
import { AlerteErreur } from '@/components/AlerteErreur'



interface VehiculeOption {
    idVehicule: number
    immatriculation: string
    marque: string
    modele: string
}

const STATUT_COLORS: Record<string, string> = {
    EN_ATTENTE: 'secondary',
    PLANIFIEE: 'primary',
    EN_COURS: 'warning',
    TERMINEE: 'success',
    ANNULEE: 'danger',
}

const STATUTS = ['EN_ATTENTE', 'PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE']

const TYPE_COLORS: Record<string, string> = {
    PREVENTIVE: 'info',
    CURATIVE: 'danger',
}

const VEHICLE_ICONS: Record<string, string> = {
    BERLINE: 'ri:car-fill',
    SUV: 'ri:car-washing-fill',
    CAMION: 'ri:truck-fill',
    UTILITAIRE: 'ri:truck-line',
    MOTO: 'ri:motorbike-fill',
    default: 'ri:car-line'
}

export default function InterventionsPage() {
    const [interventions, setInterventions] = useState<Intervention[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const { error, execute, clearError } = useApiError()
    const [filterStatut, setFilterStatut] = useState('')
    const [filterType, setFilterType] = useState('')
    const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'kanban'>('table')
    const [page, setPage] = useState(1)

    const [vehicules, setVehicules] = useState<VehiculeOption[]>([])
    const [loadingVehicules, setLoadingVehicules] = useState(false)

    // Modal
    const [showModal, setShowModal] = useState(false)
    const [editIntervention, setEditIntervention] = useState<Intervention | null>(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<CreateInterventionDto>({
        dateIntervention: new Date().toISOString().split('T')[0],
        description: '',
        typeIntervention: 'PREVENTIVE',
        cout: 0,
        vehiculeId: 0,
    })
    const [validated, setValidated] = useState(false)

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
        const data = await execute(() => interventionService.getAll({
            statut: filterStatut || undefined,
            type: filterType || undefined,
            page,
            pageSize: 100, // Large for Kanban and Calendar
        }))
        if (data) {
            setInterventions(data.items)
            setTotal(data.total)
        }
        setLoading(false)
    }, [filterStatut, filterType, page, execute, clearError])

    useEffect(() => { load() }, [load])

    const openCreate = () => {
        setEditIntervention(null)
        setForm({ dateIntervention: new Date().toISOString().split('T')[0], description: '', typeIntervention: 'PREVENTIVE', cout: 0, vehiculeId: 0 })
        setValidated(false)
        setShowModal(true)
    }

    const openEdit = (i: Intervention) => {
        setEditIntervention(i)
        setForm({
            dateIntervention: i.dateIntervention.split('T')[0],
            description: i.description,
            typeIntervention: i.typeIntervention,
            cout: i.cout,
            vehiculeId: i.vehiculeId,
            technicienId: i.technicienId,
            ordreTravailId: i.ordreTravailId,
            kilometrageIntervention: i.kilometrageIntervention,
            dureeMinutes: i.dureeMinutes,
            prestataire: i.prestataire,
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
        setSaving(true)
        clearError()
        const payload = {
            ...form,
            dateIntervention: new Date(form.dateIntervention).toISOString(),
            technicienId: form.technicienId || undefined,
            ordreTravailId: form.ordreTravailId || undefined,
        }

        const success = await execute(async () => {
            if (editIntervention) {
                await interventionService.update(editIntervention.idIntervention, payload)
            } else {
                await interventionService.create(payload)
            }
            return true
        })

        if (success) {
            setShowModal(false)
            await load()
        }
        setSaving(false)
    }

    const handleChangeStatut = async (id: number, statut: string) => {
        clearError()
        const success = await execute(async () => {
            await interventionService.updateStatut(id, statut)
            return true
        })
        if (success) {
            setInterventions(prev => prev.map(i => i.idIntervention === id ? { ...i, statut } : i))
        } else {
            await load()
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
            await interventionService.updateStatut(id, newStatut)
            return true
        })
        if (success) {
            setInterventions(prev => prev.map(i => i.idIntervention === id ? { ...i, statut: newStatut } : i))
        } else {
            await load()
        }
    }

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer cette intervention ?',
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
                await interventionService.delete(id)
                return true
            })
            if (success) {
                Swal.fire('Supprimée !', '', 'success')
                await load()
            }
        }
    }

    const calendarEvents = useMemo(() => {
        return interventions.map(i => ({
            id: i.idIntervention.toString(),
            title: `${i.vehiculeImmatriculation} - ${i.typeIntervention}`,
            start: i.dateIntervention,
            end: i.dateFinIntervention || i.dateIntervention,
            backgroundColor: TYPE_COLORS[i.typeIntervention] === 'info' ? '#3b82f6' : '#ef4444',
            borderColor: 'transparent',
            extendedProps: { ...i }
        }))
    }, [interventions])

    const getVehicleIcon = (type?: string) => VEHICLE_ICONS[type?.toUpperCase() || 'default'] || VEHICLE_ICONS['default']

    return (
        <>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="ri:tools-line" className="me-2 text-warning" />
                        Planification des Interventions
                    </h4>
                    <p className="text-muted mb-0">{total} évènements</p>
                </Col>
                <Col xs="auto" className="d-flex gap-2 flex-wrap">
                    <ButtonGroup size="sm">
                        <Button variant={filterType === '' ? 'outline-secondary' : 'light'} onClick={() => setFilterType('')}>Toutes</Button>
                        <Button variant={filterType === 'PREVENTIVE' ? 'info' : 'light'} onClick={() => setFilterType('PREVENTIVE')}>Préventives</Button>
                        <Button variant={filterType === 'CURATIVE' ? 'danger' : 'light'} onClick={() => setFilterType('CURATIVE')}>Curatives</Button>
                    </ButtonGroup>

                    <Form.Select size="sm" value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={{ width: 140 }}>
                        <option value="">Tous statuts</option>
                        {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </Form.Select>

                    <ButtonGroup size="sm">
                        <Button variant={viewMode === 'table' ? 'primary' : 'light'} onClick={() => setViewMode('table')}>
                            <IconifyIcon icon="ri:table-line" />
                        </Button>
                        <Button variant={viewMode === 'kanban' ? 'primary' : 'light'} onClick={() => setViewMode('kanban')}>
                            <IconifyIcon icon="ri:kanban-view" />
                        </Button>
                        <Button variant={viewMode === 'calendar' ? 'primary' : 'light'} onClick={() => setViewMode('calendar')}>
                            <IconifyIcon icon="ri:calendar-2-line" />
                        </Button>
                    </ButtonGroup>

                    <Button variant="warning" size="sm" onClick={openCreate} className="px-3">
                        <IconifyIcon icon="ri:add-line" className="me-1" />
                        Planifier
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
                <div className="text-center py-5"><Spinner animation="border" variant="warning" /></div>
            ) : viewMode === 'kanban' ? (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="d-flex overflow-auto pb-3 gap-3" style={{ minHeight: '650px' }}>
                        {STATUTS.map(s => (
                            <div key={s} className="bg-light rounded p-2" style={{ minWidth: '300px', flex: '0 0 300px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                                    <h6 className="mb-0 fw-bold">{s.replace('_', ' ')}</h6>
                                    <Badge bg={STATUT_COLORS[s]} pill>{interventions.filter(i => i.statut === s).length}</Badge>
                                </div>
                                <Droppable droppableId={s}>
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} style={{ minHeight: '100px' }}>
                                            {interventions.filter(i => i.statut === s).map((i, index) => (
                                                <Draggable key={i.idIntervention} draggableId={i.idIntervention.toString()} index={index}>
                                                    {(provided) => (
                                                        <Card
                                                            className="mb-2 shadow-sm border-0"
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            ref={provided.innerRef}
                                                        >
                                                            <Card.Body className="p-2">
                                                                <div className="d-flex justify-content-between mb-1">
                                                                    <Badge bg={TYPE_COLORS[i.typeIntervention]} className="px-1 small">{i.typeIntervention}</Badge>
                                                                    <small className="text-muted">{new Date(i.dateIntervention).toLocaleDateString('fr-FR')}</small>
                                                                </div>
                                                                <div className="fw-bold small mb-1">{i.vehiculeImmatriculation}</div>
                                                                <p className="text-muted small mb-2 text-truncate-2" style={{ fontSize: '0.8rem', height: '2.4rem', overflow: 'hidden' }}>
                                                                    {i.description}
                                                                </p>
                                                                <div className="d-flex justify-content-between align-items-center border-top pt-2">
                                                                    <small className="fw-bold">{i.cout.toFixed(2)} DT</small>
                                                                    <div className="d-flex gap-1">
                                                                        <button className="btn btn-sm btn-light p-1" onClick={() => openEdit(i)}><IconifyIcon icon="ri:edit-line" /></button>
                                                                        <button className="btn btn-sm btn-light p-1 text-danger" onClick={() => handleDelete(i.idIntervention)}><IconifyIcon icon="ri:delete-bin-line" /></button>
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
                        ))}
                    </div>
                </DragDropContext>
            ) : viewMode === 'calendar' ? (
                <Card className="border-0 shadow-sm">
                    <Card.Body>
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, bootstrapPlugin]}
                            themeSystem="bootstrap"
                            initialView="dayGridMonth"
                            events={calendarEvents}
                            locale="fr"
                            height="auto"
                            eventClick={(info) => openEdit(info.event.extendedProps as Intervention)}
                        />
                    </Card.Body>
                </Card>
            ) : interventions.length === 0 ? (
                <Card className="text-center py-5 border-0 shadow-sm">
                    <Card.Body>
                        <IconifyIcon icon="ri:tools-line" style={{ fontSize: '3rem' }} className="text-muted mb-3" />
                        <h5>Aucune intervention</h5>
                        <Button variant="warning" onClick={openCreate}>Créer la première</Button>
                    </Card.Body>
                </Card>
            ) : (
                <Card className="border-0 shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-muted small text-uppercase">
                                <tr>
                                    <th>Date</th>
                                    <th>Véhicule</th>
                                    <th>Type</th>
                                    <th>Statut</th>
                                    <th>Coût</th>
                                    <th className="text-end px-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {interventions.map(i => (
                                    <tr key={i.idIntervention}>
                                        <td className="small">{new Date(i.dateIntervention).toLocaleDateString('fr-FR')}</td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="bg-light rounded p-2 text-primary">
                                                    <IconifyIcon icon={getVehicleIcon()} />
                                                </div>
                                                <div className="fw-bold">{i.vehiculeImmatriculation}</div>
                                            </div>
                                        </td>
                                        <td><Badge bg={TYPE_COLORS[i.typeIntervention]}>{i.typeIntervention}</Badge></td>
                                        <td>
                                            <Form.Select
                                                size="sm"
                                                value={i.statut}
                                                onChange={e => handleChangeStatut(i.idIntervention, e.target.value)}
                                                style={{ width: 125 }}
                                                className={`border-0 fw-bold text-${STATUT_COLORS[i.statut]}`}
                                            >
                                                {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </Form.Select>
                                        </td>
                                        <td className="fw-bold">{i.cout.toFixed(2)} DT</td>
                                        <td className="text-end px-3">
                                            <div className="d-flex gap-1 justify-content-end">
                                                <Button variant="link" size="sm" onClick={() => openEdit(i)} title="Modifier">
                                                    <IconifyIcon icon="ri:edit-line" fontSize={18} />
                                                </Button>
                                                <Button variant="link" size="sm" className="text-danger" onClick={() => handleDelete(i.idIntervention)} title="Supprimer">
                                                    <IconifyIcon icon="ri:delete-bin-line" fontSize={18} />
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

            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>{editIntervention ? 'Modifier Intervention' : 'Prévoir une Intervention'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate validated={validated} onSubmit={handleSave} id="intervention-form">
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Véhicule <span className="text-danger">*</span></Form.Label>
                                <Form.Select
                                    value={form.vehiculeId || ''}
                                    onChange={e => setForm(f => ({ ...f, vehiculeId: Number(e.target.value) }))}
                                    disabled={!!editIntervention}
                                    required
                                >
                                    <option value="">— Sélectionner —</option>
                                    {vehicules.map(v => <option key={v.idVehicule} value={v.idVehicule}>{v.immatriculation} ({v.marque})</option>)}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">Le véhicule est obligatoire.</Form.Control.Feedback>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Type</Form.Label>
                                <Form.Select value={form.typeIntervention} onChange={e => setForm(f => ({ ...f, typeIntervention: e.target.value }))}>
                                    <option value="PREVENTIVE">🔵 Préventive (Entretien)</option>
                                    <option value="CURATIVE">🔴 Curative (Panne)</option>
                                </Form.Select>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Date <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="date" required value={form.dateIntervention} onChange={e => setForm(f => ({ ...f, dateIntervention: e.target.value }))} />
                                <Form.Control.Feedback type="invalid">La date est obligatoire.</Form.Control.Feedback>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Coût Estimé (DT) <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="number" min="0" step="0.01" required value={form.cout} onChange={e => setForm(f => ({ ...f, cout: Number(e.target.value) }))} />
                                <Form.Control.Feedback type="invalid">Le coût est obligatoire.</Form.Control.Feedback>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Description des Travaux <span className="text-danger">*</span></Form.Label>
                            <Form.Control as="textarea" rows={3} required minLength={5} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            <Form.Control.Feedback type="invalid">La description est obligatoire (min. 5 caractères).</Form.Control.Feedback>
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Prestataire (Optionnel)</Form.Label>
                                <Form.Control type="text" value={form.prestataire || ''} onChange={e => setForm(f => ({ ...f, prestataire: e.target.value }))} />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Kilométrage</Form.Label>
                                <Form.Control type="number" value={form.kilometrageIntervention || 0} onChange={e => setForm(f => ({ ...f, kilometrageIntervention: Number(e.target.value) }))} />
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Annuler</Button>
                    <Button variant="warning" type="submit" form="intervention-form" disabled={saving}>
                        {saving && <Spinner size="sm" className="me-1" />}
                        {editIntervention ? 'Mettre à jour' : 'Confirmer'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
