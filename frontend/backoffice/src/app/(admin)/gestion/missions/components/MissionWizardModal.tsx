import React, { useState, useEffect, useCallback } from 'react'
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

const AI_API = process.env.NEXT_PUBLIC_AI_API_URL ?? 'http://localhost:8000'

interface MissionWizardModalProps {
    show: boolean
    onHide: () => void
    reloadList: () => void
}

const nowLocal = () => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// -------------------------------------------------------------------------------------
// AI Prediction state type
// -------------------------------------------------------------------------------------
interface AiPredictionState {
    villeDepart: string
    villeArrivee: string
    predictedCost: number | null
    distanceKm: number | null
    isPredicting: boolean
    cities: string[]
}

// -------------------------------------------------------------------------------------
// AI Prediction card (shown in Step 1 interactively + Step 3 read-only)
// -------------------------------------------------------------------------------------
interface AiPanelProps {
    ai: AiPredictionState
    setAi: React.Dispatch<React.SetStateAction<AiPredictionState>>
    dateDepart: string
    compact?: boolean
}

const AiPanel = ({ ai, setAi, dateDepart, compact = false }: AiPanelProps) => {
    const cityOptions = ai.cities.map(c => ({ value: c, label: c }))

    if (compact) {
        if (!ai.predictedCost) return null
        return (
            <div className="bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-2 p-3 mb-3">
                <div className="d-flex align-items-center justify-content-between">
                    <span className="small fw-bold text-primary d-flex align-items-center gap-2">
                        <IconifyIcon icon="ri:robot-line" />
                        Estimation IA du coût de trajet
                    </span>
                    <Badge bg="primary" className="fs-6 px-3 py-2">
                        {ai.predictedCost.toFixed(2)} DT
                    </Badge>
                </div>
                <p className="mb-0 mt-1 small text-muted">
                    {ai.villeDepart} → {ai.villeArrivee} · {ai.distanceKm} km
                </p>
            </div>
        )
    }

    return (
        <div className="mt-3 border border-dashed rounded-2 p-3 bg-light">
            <h6 className="d-flex align-items-center mb-3 text-primary">
                <IconifyIcon icon="ri:robot-line" className="me-2" />
                Estimation IA du coût (optionnel)
                {ai.cities.length === 0 && (
                    <span className="ms-2 badge bg-secondary fw-normal small">Service IA non disponible</span>
                )}
            </h6>
            <Row className="g-2">
                <Col md={6}>
                    <Form.Label className="small fw-semibold mb-1">Ville de départ</Form.Label>
                    <Select
                        options={cityOptions}
                        value={ai.villeDepart ? { value: ai.villeDepart, label: ai.villeDepart } : null}
                        onChange={(opt: any) =>
                            setAi(s => ({ ...s, villeDepart: opt?.value ?? '', predictedCost: null, distanceKm: null }))
                        }
                        placeholder="Choisir..."
                        isDisabled={ai.cities.length === 0}
                        isClearable
                    />
                </Col>
                <Col md={6}>
                    <Form.Label className="small fw-semibold mb-1">Ville d&apos;arrivée</Form.Label>
                    <Select
                        options={cityOptions}
                        value={ai.villeArrivee ? { value: ai.villeArrivee, label: ai.villeArrivee } : null}
                        onChange={(opt: any) =>
                            setAi(s => ({ ...s, villeArrivee: opt?.value ?? '', predictedCost: null, distanceKm: null }))
                        }
                        placeholder="Choisir..."
                        isDisabled={ai.cities.length === 0}
                        isClearable
                    />
                </Col>
            </Row>

            {ai.isPredicting && (
                <div className="mt-2 d-flex align-items-center gap-2 text-muted small">
                    <Spinner animation="border" size="sm" /> Calcul en cours...
                </div>
            )}

            {!ai.isPredicting && ai.predictedCost !== null && (
                <div className="mt-2 d-flex align-items-center gap-3 flex-wrap">
                    <span className="small text-muted d-flex align-items-center gap-1">
                        <IconifyIcon icon="ri:route-line" /> {ai.distanceKm} km
                    </span>
                    <span className="d-flex align-items-center gap-2">
                        <IconifyIcon icon="ri:money-dollar-circle-line" className="text-success" />
                        <strong className="text-success fs-6">{ai.predictedCost.toFixed(2)} DT</strong>
                        <span className="small text-muted">coût estimé par l&apos;IA</span>
                    </span>
                </div>
            )}

            {!ai.isPredicting && ai.villeDepart && ai.villeArrivee && !dateDepart && ai.predictedCost === null && (
                <p className="small text-warning mt-2 mb-0">
                    <IconifyIcon icon="ri:information-line" className="me-1" />
                    Sélectionnez une date de départ pour calculer l&apos;estimation.
                </p>
            )}
        </div>
    )
}

// -------------------------------------------------------------------------------------
// STEP 1 : Détails de la Mission
// -------------------------------------------------------------------------------------
const Step1 = ({ nextStep, isActive, form, setForm, ai, setAi }: any) => {
    // Trigger AI prediction whenever departure city, arrival city, or date changes
    useEffect(() => {
        if (!ai.villeDepart || !ai.villeArrivee || !form.dateDepart) {
            setAi((s: AiPredictionState) => ({ ...s, predictedCost: null, distanceKm: null, isPredicting: false }))
            return
        }

        setAi((s: AiPredictionState) => ({ ...s, isPredicting: true }))

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${AI_API}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        departure: ai.villeDepart,
                        arrival: ai.villeArrivee,
                        date_depart: form.dateDepart,
                        has_autoroute: form.carteAutorouteRemise,
                    }),
                })
                if (res.ok) {
                    const data = await res.json()
                    setAi((s: AiPredictionState) => ({
                        ...s,
                        isPredicting: false,
                        predictedCost: data.predicted_cost_tnd,
                        distanceKm: data.distance_km,
                    }))
                } else {
                    setAi((s: AiPredictionState) => ({ ...s, isPredicting: false, predictedCost: null, distanceKm: null }))
                }
            } catch {
                setAi((s: AiPredictionState) => ({ ...s, isPredicting: false, predictedCost: null, distanceKm: null }))
            }
        }, 600)

        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ai.villeDepart, ai.villeArrivee, form.dateDepart, form.carteAutorouteRemise])

    const handleNext = () => {
        if (!form.destination?.trim()) {
            Swal.fire('Erreur', 'La destination est obligatoire.', 'error'); return
        }
        if (form.destination.trim().length < 3) {
            Swal.fire('Erreur', 'La destination doit contenir au moins 3 caractères.', 'error'); return
        }
        if (!form.dateDepart) {
            Swal.fire('Erreur', 'La date de départ est obligatoire.', 'error'); return
        }
        if (!form.objetMission?.trim()) {
            Swal.fire('Erreur', "L'objet de la mission est obligatoire.", 'error'); return
        }
        if (form.objetMission.trim().length < 5) {
            Swal.fire('Erreur', "L'objet de la mission doit contenir au moins 5 caractères.", 'error'); return
        }

        const selectedDt = new Date(form.dateDepart)
        if (isNaN(selectedDt.getTime())) {
            Swal.fire('Date invalide', 'La date de départ est invalide.', 'error'); return
        }
        if (selectedDt < new Date()) {
            Swal.fire('Date invalide', 'La date et heure de départ ne peuvent pas être dans le passé.', 'warning'); return
        }
        if (form.dateRetour) {
            const retourDt = new Date(form.dateRetour)
            if (!isNaN(retourDt.getTime()) && retourDt <= selectedDt) {
                Swal.fire('Date invalide', 'La date de retour doit être postérieure à la date de départ.', 'warning'); return
            }
        }

        if (form.bonCarburantAccorde && !form.numeroBonCarburant?.trim()) {
            Swal.fire('Erreur', 'Veuillez saisir le numéro du bon de carburant.', 'error'); return
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

            <AiPanel ai={ai} setAi={setAi} dateDepart={form.dateDepart} />

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
            // execute() already shows Swal error
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
const Step3 = ({ previousStep, isActive, form, onFinish, isSaving, ai }: any) => {
    return (
        <div className={isActive ? 'd-block' : 'd-none'}>
            <h5 className="mb-4">Etape 3 : Récapitulatif & Confirmation</h5>

            <AiPanel ai={ai} setAi={() => {}} dateDepart={form.dateDepart} compact />

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

// -------------------------------------------------------------------------------------
// Root modal
// -------------------------------------------------------------------------------------
const emptyForm = (): any => ({
    destination: '',
    dateDepart: nowLocal(),
    dateRetour: '',
    objetMission: '',
    vehiculeId: 0,
    employeeId: 0,
    kilometrageDepart: 0,
    bonCarburantAccorde: false,
    numeroBonCarburant: '',
    verificationDocuments: false,
    carteAutorouteRemise: false,
})

const MissionWizardModal = ({ show, onHide, reloadList }: MissionWizardModalProps) => {
    const [form, setForm] = useState<CreateMissionDto>(emptyForm())
    const [isSaving, setIsSaving] = useState(false)
    const { error, execute, clearError } = useApiError()

    const [ai, setAi] = useState<AiPredictionState>({
        villeDepart: '',
        villeArrivee: '',
        predictedCost: null,
        distanceKm: null,
        isPredicting: false,
        cities: [],
    })

    // Fetch city list once from FastAPI; silently degrades if service is offline
    useEffect(() => {
        fetch(`${AI_API}/cities`)
            .then(r => r.json())
            .then(d => setAi(s => ({ ...s, cities: d.cities ?? [] })))
            .catch(() => {})
    }, [])

    const resetAll = useCallback(() => {
        setForm(emptyForm())
        setAi(s => ({
            ...s,
            villeDepart: '',
            villeArrivee: '',
            predictedCost: null,
            distanceKm: null,
            isPredicting: false,
        }))
    }, [])

    const handleFinish = async () => {
        setIsSaving(true)
        clearError()
        await execute(async () => {
            await missionService.create(form)
            await Swal.fire('Succès', 'La mission a été créée avec succès.', 'success')
            reloadList()
            onHide()
            resetAll()
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
                    <Step1 form={form} setForm={setForm} ai={ai} setAi={setAi} />
                    <Step2
                        form={form}
                        setForm={setForm}
                        execute={execute}
                        clearError={clearError}
                    />
                    <Step3 form={form} onFinish={handleFinish} isSaving={isSaving} ai={ai} />
                </StepWizard>
            </Modal.Body>
        </Modal>
    )
}

export default MissionWizardModal
