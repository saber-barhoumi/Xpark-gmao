import React, { useState, useEffect } from 'react'
import { Badge, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap'
import StepWizard from 'react-step-wizard'
import Select from 'react-select'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import api from '@/lib/axiosConfig'
import Swal from 'sweetalert2'
import missionService from '@/services/missionService'
import employeeService from '@/services/employeeService'
import { CreateMissionDto } from '@/types/mission'
import { useApiError } from '@/hooks/useApiError'
import { AlerteErreur } from '@/components/AlerteErreur'



interface MissionWizardModalProps {
    show: boolean
    onHide: () => void
    reloadList: () => void
}

// -------------------------------------------------------------------------------------
// STEP 1 : Détails de la Mission
// -------------------------------------------------------------------------------------
const nowLocal = () => {
    const now = new Date()
    now.setSeconds(0, 0)
    return now.toISOString().slice(0, 16)
}

const Step1 = ({ nextStep, isActive, form, setForm }: any) => {
    const handleNext = () => {
        if (!form.destination || !form.dateDepart || !form.objetMission) {
            Swal.fire('Erreur', 'Veuillez remplir tous les champs obligatoires.', 'error')
            return
        }
        if (new Date(form.dateDepart) < new Date()) {
            Swal.fire('Date invalide', 'La date de départ ne peut pas être dans le passé.', 'warning')
            return
        }
        nextStep()
    }

    return (
        <div className={isActive ? 'd-block' : 'd-none'}>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="mb-0">
                    <IconifyIcon icon="ri:information-line" className="me-2 text-primary" />
                    Étape 1 : Détails de la Mission
                </h5>
                <Badge bg="light" text="primary" className="border">Détails requis</Badge>
            </div>

            <Row className="g-3">
                <Col md={12}>
                    <Form.Group>
                        <Form.Label className="small fw-bold">Destination <span className="text-danger">*</span></Form.Label>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light border-end-0">
                                <IconifyIcon icon="ri:map-pin-2-line" />
                            </span>
                            <Form.Control
                                size="sm"
                                className="border-start-0"
                                value={form.destination}
                                onChange={e => setForm({ ...form, destination: e.target.value })}
                                placeholder="Ex: Tunis, Sousse, Bureau Régional..."
                            />
                        </div>
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="small fw-bold">Date de départ <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            size="sm"
                            type="datetime-local"
                            value={form.dateDepart}
                            min={nowLocal()}
                            onChange={e => setForm({ ...form, dateDepart: e.target.value })}
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                        <Form.Label className="small fw-bold">Date de retour (Prévue)</Form.Label>
                        <Form.Control
                            size="sm"
                            type="datetime-local"
                            value={form.dateRetour}
                            onChange={e => setForm({ ...form, dateRetour: e.target.value })}
                        />
                    </Form.Group>
                </Col>

                <Col md={12}>
                    <Form.Group>
                        <Form.Label className="small fw-bold">Objet de la mission <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            size="sm"
                            as="textarea"
                            rows={2}
                            value={form.objetMission}
                            onChange={e => setForm({ ...form, objetMission: e.target.value })}
                            placeholder="Description succincte de l'objectif de la mission..."
                        />
                    </Form.Group>
                </Col>
            </Row>

            <hr className="my-4 text-muted opacity-25" />

            <div className="mb-3">
                <h6 className="d-flex align-items-center mb-3">
                    <IconifyIcon icon="ri:list-check-2" className="me-2 text-warning" />
                    Checklist Logistique
                </h6>
                <div className="bg-light p-3 rounded-2 border border-dashed">
                    <Row className="g-2">
                        <Col md={6}>
                            <Form.Check
                                type="checkbox"
                                id="bon-carburant"
                                label="Bon de Carburant Accordé"
                                className="small"
                                checked={form.bonCarburantAccorde}
                                onChange={e => setForm({ ...form, bonCarburantAccorde: e.target.checked })}
                            />
                        </Col>
                        {form.bonCarburantAccorde && (
                            <Col md={6}>
                                <Form.Control
                                    size="sm"
                                    type="text"
                                    placeholder="N° du Bon"
                                    value={form.numeroBonCarburant || ''}
                                    onChange={e => setForm({ ...form, numeroBonCarburant: e.target.value })}
                                />
                            </Col>
                        )}
                        <Col md={12}>
                            <Form.Check
                                type="checkbox"
                                id="verif-docs"
                                label="Vérification Documents (Assurance/Visite)"
                                className="small"
                                checked={form.verificationDocuments}
                                onChange={e => setForm({ ...form, verificationDocuments: e.target.checked })}
                            />
                        </Col>
                        <Col md={12}>
                            <Form.Check
                                type="checkbox"
                                id="carte-autoroute"
                                label="Carte Autoroute remise"
                                className="small"
                                checked={form.carteAutorouteRemise}
                                onChange={e => setForm({ ...form, carteAutorouteRemise: e.target.checked })}
                            />
                        </Col>
                    </Row>
                </div>
            </div>

            <div className="d-flex justify-content-end mt-4">
                <Button variant="primary" size="sm" onClick={handleNext} className="px-3">
                    Suivant <IconifyIcon icon="ri:add-line" className="ms-1" />
                </Button>
            </div>
        </div>
    )
}

// -------------------------------------------------------------------------------------
// STEP 2 : Véhicule & Chauffeur
// -------------------------------------------------------------------------------------
const Step2 = ({ previousStep, nextStep, isActive, form, setForm, execute, clearError }: any) => {
    const [vehicles, setVehicles] = useState<any[]>([])
    const [drivers, setDrivers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isActive) {
            loadResources()
        }
    }, [isActive])

    const loadResources = async () => {
        setLoading(true)
        clearError()
        try {
            const res = await execute(async () => {
                const [vRes, dRes] = await Promise.all([
                    api.get('/vehicules/disponibles'),
                    employeeService.getAll({ post: 'CHAUFFEUR', statut: 'DISPONIBLE' })
                ])
                console.log('[Step2] vRes.data:', vRes.data, '| dRes:', dRes)
                return {
                    vehicles: Array.isArray(vRes.data) ? vRes.data : [],
                    drivers: Array.isArray(dRes) ? dRes : []
                }
            })

            if (res) {
                setVehicles(res.vehicles.map((v: any) => ({
                    value: v.idVehicule,
                    label: `${v.immatriculation} - ${v.marque} ${v.modele} (${v.kilometrage} km)`,
                    kilometrage: v.kilometrage
                })))
                setDrivers(res.drivers.map((d: any) => ({
                    value: d.idEmployee,
                    label: `${d.prenom} ${d.name} (${d.numeroMatricule})`
                })))
            }
        } catch {
            // execute() already shows Swal error; catch prevents uncaught promise rejection
        } finally {
            setLoading(false)
        }
    }

    const handleNext = () => {
        if (!form.vehiculeId || !form.employeeId) {
            Swal.fire('Erreur', 'Veuillez sélectionner un véhicule et un chauffeur.', 'error')
            return
        }
        nextStep()
    }

    return (
        <div className={isActive ? 'd-block' : 'd-none'}>
            <h5 className="mb-4">Etape 2 : Véhicule & Chauffeur</h5>
            {loading ? (
                <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
            ) : (
                <>
                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Sélectionner un véhicule <span className="text-danger">*</span></Form.Label>
                                <Select
                                    options={vehicles}
                                    value={vehicles.find(v => v.value === form.vehiculeId)}
                                    onChange={(nv: any) => setForm({
                                        ...form,
                                        vehiculeId: nv?.value,
                                        kilometrageDepart: nv?.kilometrage || 0
                                    })}
                                    placeholder="Choisir un véhicule disponible..."
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Sélectionner un chauffeur <span className="text-danger">*</span></Form.Label>
                                <Select
                                    options={drivers}
                                    value={drivers.find(d => d.value === form.employeeId)}
                                    onChange={(nv: any) => setForm({ ...form, employeeId: nv?.value })}
                                    placeholder="Choisir un chauffeur disponible..."
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-between mt-2">
                        <Button variant="outline-secondary" onClick={previousStep}>
                            <IconifyIcon icon="ri:arrow-left-line" className="me-1" /> Précédent
                        </Button>
                        <Button variant="primary" onClick={handleNext}>
                            Suivant <IconifyIcon icon="ri:arrow-right-line" className="ms-1" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}

// -------------------------------------------------------------------------------------
// STEP 3 : Confirmation
// -------------------------------------------------------------------------------------
const Step3 = ({ previousStep, isActive, form, onFinish, isSaving }: any) => {
    return (
        <div className={isActive ? 'd-block' : 'd-none'}>
            <h5 className="mb-4">Etape 3 : Récapitulatif & Confirmation</h5>
            <div className="bg-light p-3 rounded mb-3">
                <p className="mb-1"><strong>Destination :</strong> {form.destination}</p>
                <p className="mb-1"><strong>Objet :</strong> {form.objetMission}</p>
                <p className="mb-1"><strong>Départ :</strong> {new Date(form.dateDepart).toLocaleString()}</p>
                <p className="mb-1"><strong>Kilométrage départ :</strong> {form.kilometrageDepart} km</p>
            </div>
            <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={previousStep} disabled={isSaving}>
                    <IconifyIcon icon="ri:arrow-left-line" className="me-1" /> Précédent
                </Button>
                <Button variant="success" onClick={onFinish} disabled={isSaving}>
                    {isSaving ? <Spinner animation="border" size="sm" /> : <>Créer la Mission <IconifyIcon icon="ri:check-line" className="ms-1" /></>}
                </Button>
            </div>
        </div>
    )
}

const MissionWizardModal = ({ show, onHide, reloadList }: MissionWizardModalProps) => {
    const [form, setForm] = useState<CreateMissionDto>({
        destination: '',
        dateDepart: new Date().toISOString().slice(0, 16),
        dateRetour: '',
        objetMission: '',
        vehiculeId: 0,
        employeeId: 0,
        kilometrageDepart: 0,
        bonCarburantAccorde: false,
        numeroBonCarburant: '',
        verificationDocuments: false,
        carteAutorouteRemise: false
    } as any)

    const [isSaving, setIsSaving] = useState(false)
    const { error, execute, clearError } = useApiError()

    const handleFinish = async () => {
        setIsSaving(true)
        clearError()
        const success = await execute(async () => {
            await missionService.create(form)
            await Swal.fire('Succès', 'La mission a été créée avec succès.', 'success')
            reloadList()
            onHide()
            // Reset form
            setForm({
                destination: '',
                dateDepart: new Date().toISOString().slice(0, 16),
                dateRetour: '',
                objetMission: '',
                vehiculeId: 0,
                employeeId: 0,
                kilometrageDepart: 0,
                bonCarburantAccorde: false,
                numeroBonCarburant: '',
                verificationDocuments: false,
                carteAutorouteRemise: false
            } as any)
            return true
        })
        setIsSaving(false)
    }

    return (
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                    <IconifyIcon icon="ri:map-pin-add-line" className="me-2" />
                    Nouvelle Mission
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
                <StepWizard>
                    <Step1 form={form} setForm={setForm} />
                    <Step2
                        form={form}
                        setForm={setForm}
                        execute={execute}
                        clearError={clearError}
                    />
                    <Step3 form={form} onFinish={handleFinish} isSaving={isSaving} />
                </StepWizard>
            </Modal.Body>
        </Modal>
    )
}

export default MissionWizardModal
