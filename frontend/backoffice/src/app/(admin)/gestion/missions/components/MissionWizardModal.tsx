'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Alert, Badge, Button, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import StepWizard from 'react-step-wizard'
import Select from 'react-select'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import api from '@/lib/axiosConfig'
import Swal from 'sweetalert2'
import missionService from '@/services/missionService'
import employeeService from '@/services/employeeService'
import { useApiError } from '@/hooks/useApiError'
import { AlerteErreur } from '@/components/AlerteErreur'
import { CITY_GROUPS } from '@/data/distanceMatrix'

const AI_API = import.meta.env.VITE_AI_API_URL ?? 'http://localhost:8000'

// ── Grouped city options for react-select ────────────────────────────────────
const GROUPED_CITY_OPTIONS = Object.entries(CITY_GROUPS)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([gov, cities]) => ({
        label: gov,
        options: cities.map(c => ({ value: c, label: c, gov })),
    }))

const formatGroupLabel = (group: any) => (
    <div className="d-flex align-items-center gap-1 py-1">
        <IconifyIcon icon="ri:government-line" className="text-primary" style={{ fontSize: 13 }} />
        <span className="text-primary fw-semibold" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {group.label}
        </span>
        <span className="ms-auto badge bg-light text-secondary" style={{ fontSize: 10 }}>{group.options.length}</span>
    </div>
)

const formatOptionLabel = (opt: any) => (
    <div className="d-flex align-items-center gap-2">
        <IconifyIcon icon="ri:map-pin-line" className="text-muted flex-shrink-0" style={{ fontSize: 13 }} />
        <span style={{ fontSize: 13 }}>{opt.label}</span>
    </div>
)

interface MissionWizardModalProps {
    show: boolean
    onHide: () => void
    reloadList: () => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const nowLocal = () => {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// Handles plain arrays AND paginated { data:[...] } / { items:[...] } responses
const toArray = (val: unknown): any[] => {
    if (Array.isArray(val)) return val
    if (val && typeof val === 'object') {
        const v = val as Record<string, unknown>
        for (const k of ['data', 'items', 'results', 'value']) {
            if (Array.isArray(v[k])) return v[k] as any[]
        }
    }
    return []
}

// ── Form state ───────────────────────────────────────────────────────────────

interface WizardForm {
    // Step 1 — Route
    villeDepart: string
    villeArrivee: string
    distanceEstimee: number
    travelHours: number
    departureGovernorate: string
    arrivalGovernorate: string
    // Step 1 — Mission basics
    dateDepart: string
    dateRetour: string
    objetMission: string
    // Step 2 — Resources
    vehiculeId: number
    vehiculeType: string
    vehiculeCarburant: string
    vehiculeConsommation: number
    employeeId: number
    kilometrageDepart: number
    // Step 2 — Trip params for AI
    cargoWeight: number
    passengerCount: number
    luggageWeight: number
    trafficCondition: string
    weatherCondition: string
    // Step 2 — Checklist
    bonCarburantAccorde: boolean
    numeroBonCarburant: string
    verificationDocuments: boolean
    carteAutorouteRemise: boolean
    // Step 3 — Cost
    coutEstime: number
    useManualCost: boolean
    manualCoutInput: string
}

const emptyForm = (): WizardForm => ({
    villeDepart: '', villeArrivee: '', distanceEstimee: 0, travelHours: 0,
    departureGovernorate: '', arrivalGovernorate: '',
    dateDepart: nowLocal(), dateRetour: '', objetMission: '',
    vehiculeId: 0, vehiculeType: '', vehiculeCarburant: '', vehiculeConsommation: 0,
    employeeId: 0, kilometrageDepart: 0,
    cargoWeight: 0, passengerCount: 1, luggageWeight: 0,
    trafficCondition: 'Normal', weatherCondition: 'Sunny',
    bonCarburantAccorde: false, numeroBonCarburant: '', verificationDocuments: false, carteAutorouteRemise: false,
    coutEstime: 0, useManualCost: false, manualCoutInput: '',
})

// ── AI prediction data from the /predict endpoint ────────────────────────────
interface PredictionData {
    predicted_cost_tnd: number
    distance_km: number
    travel_hours: number
    fuel_cost_tnd: number
    labor_cost_tnd: number
    toll_cost_tnd: number
    driver_allowance_tnd: number
    vehicle_type_used: string
    fuel_type_used: string
}

// ── STEP 1 — Route & Mission Details ─────────────────────────────────────────
const Step1 = ({ nextStep, isActive, form, setForm }: any) => {
    const [distError, setDistError] = useState('')
    const [distLoading, setDistLoading] = useState(false)

    useEffect(() => {
        if (!form.villeDepart || !form.villeArrivee) { setDistError(''); return }
        if (form.villeDepart === form.villeArrivee) {
            setDistError("Départ et arrivée doivent être différents."); return
        }
        setDistLoading(true)
        setDistError('')
        fetch(`${AI_API}/distance?departure=${encodeURIComponent(form.villeDepart)}&arrival=${encodeURIComponent(form.villeArrivee)}`)
            .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
            .then((d: any) => {
                setForm((f: WizardForm) => ({
                    ...f,
                    distanceEstimee: d.distance_km,
                    travelHours: d.travel_hours,
                    departureGovernorate: d.departure_governorate,
                    arrivalGovernorate: d.arrival_governorate,
                }))
            })
            .catch(() => {
                setDistError('Distance non disponible pour cette paire de villes.')
                setForm((f: WizardForm) => ({ ...f, distanceEstimee: 0, travelHours: 0, departureGovernorate: '', arrivalGovernorate: '' }))
            })
            .finally(() => setDistLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.villeDepart, form.villeArrivee])

    const handleNext = () => {
        if (!form.villeDepart) { Swal.fire('Erreur', 'La ville de départ est obligatoire.', 'error'); return }
        if (!form.villeArrivee) { Swal.fire('Erreur', 'La ville d\'arrivée est obligatoire.', 'error'); return }
        if (form.villeDepart === form.villeArrivee) { Swal.fire('Erreur', 'Départ et arrivée doivent être différents.', 'error'); return }
        if (distLoading) { Swal.fire('Patientez', 'Calcul de la distance en cours…', 'info'); return }
        if (form.distanceEstimee <= 0) { Swal.fire('Erreur', 'Impossible de calculer la distance. Vérifiez les villes.', 'warning'); return }
        if (!form.dateDepart) { Swal.fire('Erreur', 'La date de départ est obligatoire.', 'error'); return }
        if (!form.objetMission?.trim()) { Swal.fire('Erreur', "L'objet de la mission est obligatoire.", 'error'); return }
        if (form.objetMission.trim().length < 5) { Swal.fire('Erreur', "L'objet de la mission doit contenir au moins 5 caractères.", 'error'); return }

        const depDt = new Date(form.dateDepart)
        if (isNaN(depDt.getTime())) { Swal.fire('Date invalide', 'La date de départ est invalide.', 'error'); return }
        if (depDt < new Date()) { Swal.fire('Date invalide', 'La date de départ ne peut pas être dans le passé.', 'warning'); return }
        if (form.dateRetour) {
            const retDt = new Date(form.dateRetour)
            if (!isNaN(retDt.getTime()) && retDt <= depDt) {
                Swal.fire('Date invalide', 'La date de retour doit être postérieure à la date de départ.', 'warning'); return
            }
        }
        nextStep()
    }

    return (
        <div className={isActive ? 'd-block' : 'd-none'}>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="mb-0">
                    <IconifyIcon icon="ri:route-line" className="me-2 text-primary" />
                    Étape 1 — Informations du Trajet
                </h5>
                <Badge bg="primary" className="opacity-75">1 / 3</Badge>
            </div>

            {/* ── Departure / Arrival cities ───────────────────────── */}
            <div className="border rounded-2 p-3 mb-3 bg-light">
                <h6 className="mb-3 text-primary d-flex align-items-center gap-2">
                    <IconifyIcon icon="ri:map-pin-2-line" /> Route
                </h6>
                <Row className="g-3">
                    <Col md={6}>
                        <Form.Label className="small fw-bold">
                            <IconifyIcon icon="ri:map-pin-2-fill" className="text-success me-1" />
                            Ville de départ <span className="text-danger">*</span>
                        </Form.Label>
                        <Select
                            options={GROUPED_CITY_OPTIONS}
                            formatGroupLabel={formatGroupLabel}
                            formatOptionLabel={formatOptionLabel}
                            value={form.villeDepart ? { value: form.villeDepart, label: form.villeDepart } : null}
                            onChange={(o: any) => setForm((f: WizardForm) => ({ ...f, villeDepart: o?.value ?? '', distanceEstimee: 0, travelHours: 0, departureGovernorate: '', arrivalGovernorate: '' }))}
                            placeholder="Tapez ou choisissez la ville…"
                            isClearable
                            noOptionsMessage={() => 'Aucune ville trouvée'}
                        />
                    </Col>
                    <Col md={6}>
                        <Form.Label className="small fw-bold">
                            <IconifyIcon icon="ri:map-pin-2-fill" className="text-danger me-1" />
                            Ville d&apos;arrivée <span className="text-danger">*</span>
                        </Form.Label>
                        <Select
                            options={GROUPED_CITY_OPTIONS}
                            formatGroupLabel={formatGroupLabel}
                            formatOptionLabel={formatOptionLabel}
                            value={form.villeArrivee ? { value: form.villeArrivee, label: form.villeArrivee } : null}
                            onChange={(o: any) => setForm((f: WizardForm) => ({ ...f, villeArrivee: o?.value ?? '', distanceEstimee: 0, travelHours: 0, departureGovernorate: '', arrivalGovernorate: '' }))}
                            placeholder="Tapez ou choisissez la ville…"
                            isClearable
                            noOptionsMessage={() => 'Aucune ville trouvée'}
                        />
                    </Col>
                </Row>

                {distLoading && (
                    <div className="mt-3 d-flex align-items-center gap-2 text-muted small">
                        <Spinner animation="border" size="sm" /> Calcul de la distance…
                    </div>
                )}

                {!distLoading && form.distanceEstimee > 0 && (
                    <div className="mt-3 d-flex flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-2 bg-white border rounded-2 px-3 py-2">
                            <IconifyIcon icon="ri:road-map-line" className="text-primary fs-5" />
                            <div>
                                <div className="fw-bold text-primary fs-6">{form.distanceEstimee.toFixed(0)} km</div>
                                <div className="small text-muted">Distance route</div>
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 bg-white border rounded-2 px-3 py-2">
                            <IconifyIcon icon="ri:time-line" className="text-secondary fs-5" />
                            <div>
                                <div className="fw-bold text-secondary fs-6">~{form.travelHours.toFixed(1)} h</div>
                                <div className="small text-muted">Durée estimée</div>
                            </div>
                        </div>
                        {form.departureGovernorate && (
                            <div className="d-flex align-items-center gap-2 bg-white border rounded-2 px-3 py-2">
                                <IconifyIcon icon="ri:government-line" className="text-info fs-5" />
                                <div>
                                    <div className="fw-bold text-info small">{form.departureGovernorate} → {form.arrivalGovernorate}</div>
                                    <div className="small text-muted">Gouvernorats</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {distError && <Alert variant="warning" className="mt-2 py-2 small mb-0">{distError}</Alert>}
            </div>

            {/* ── Mission basics ───────────────────────────────────── */}
            <div className="border rounded-2 p-3 mb-3">
                <h6 className="mb-3 text-dark d-flex align-items-center gap-2">
                    <IconifyIcon icon="ri:file-text-line" /> Détails de la Mission
                </h6>
                <Row className="g-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="small fw-bold">Date de départ <span className="text-danger">*</span></Form.Label>
                            <Form.Control size="sm" type="datetime-local"
                                value={form.dateDepart} min={nowLocal()}
                                onChange={e => setForm((f: WizardForm) => ({ ...f, dateDepart: e.target.value }))}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="small fw-bold">Date de retour prévue</Form.Label>
                            <Form.Control size="sm" type="datetime-local"
                                value={form.dateRetour}
                                onChange={e => setForm((f: WizardForm) => ({ ...f, dateRetour: e.target.value }))}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={12}>
                        <Form.Group>
                            <Form.Label className="small fw-bold">Objet de la mission <span className="text-danger">*</span></Form.Label>
                            <Form.Control size="sm" as="textarea" rows={2}
                                value={form.objetMission}
                                onChange={e => setForm((f: WizardForm) => ({ ...f, objetMission: e.target.value }))}
                                placeholder="Description succincte de l'objectif…"
                            />
                        </Form.Group>
                    </Col>
                </Row>
            </div>

            <div className="d-flex justify-content-end mt-3">
                <Button variant="primary" size="sm" onClick={handleNext} className="px-4">
                    Suivant <IconifyIcon icon="ri:arrow-right-line" className="ms-1" />
                </Button>
            </div>
        </div>
    )
}

// ── STEP 2 — Ressources & Paramètres ─────────────────────────────────────────
const Step2 = ({ previousStep, nextStep, isActive, form, setForm, execute, clearError }: any) => {
    const [vehicles, setVehicles] = useState<any[]>([])
    const [drivers, setDrivers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isActive) { loadResources() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    vehicles: toArray(vRes.data),
                    drivers: toArray(dRes),
                }
            })
            if (res) {
                setVehicles(res.vehicles.map((v: any) => ({
                    value: v.idVehicule,
                    label: `${v.immatriculation} — ${v.marque} ${v.modele} [${v.typeVehicule ?? '?'}] (${v.kilometrage} km)`,
                    kilometrage: v.kilometrage ?? 0,
                    typeVehicule: v.typeVehicule ?? '',
                    typeCarburant: v.typeCarburant ?? '',
                    consommation: v.consommationMoyenne ?? 0,
                })))
                setDrivers(res.drivers.map((d: any) => ({
                    value: d.idEmployee,
                    label: `${d.prenom ?? ''} ${d.name ?? d.nom ?? ''} (${d.numeroMatricule ?? ''})`.trim(),
                })))
            }
        } catch {
            // execute() already shows Swal error
        } finally {
            setLoading(false)
        }
    }

    const handleVehicleChange = (opt: any) => {
        setForm((f: WizardForm) => ({
            ...f,
            vehiculeId: opt?.value ?? 0,
            kilometrageDepart: opt?.kilometrage ?? 0,
            vehiculeType: opt?.typeVehicule ?? '',
            vehiculeCarburant: opt?.typeCarburant ?? '',
            vehiculeConsommation: opt?.consommation ?? 0,
        }))
    }

    const handleNext = () => {
        if (!form.vehiculeId || !form.employeeId) {
            Swal.fire('Erreur', 'Veuillez sélectionner un véhicule et un chauffeur.', 'error'); return
        }
        if (form.bonCarburantAccorde && !form.numeroBonCarburant?.trim()) {
            Swal.fire('Erreur', 'Veuillez saisir le numéro du bon de carburant.', 'error'); return
        }
        nextStep()
    }

    const trafficOptions = [
        { value: 'Light', label: 'Fluide' },
        { value: 'Normal', label: 'Normal' },
        { value: 'Heavy', label: 'Dense' },
    ]
    const weatherOptions = [
        { value: 'Sunny', label: 'Ensoleillé' },
        { value: 'Rainy', label: 'Pluvieux' },
        { value: 'Foggy', label: 'Brouillard' },
    ]

    return (
        <div className={isActive ? 'd-block' : 'd-none'}>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="mb-0">
                    <IconifyIcon icon="ri:car-line" className="me-2 text-primary" />
                    Étape 2 — Ressources & Paramètres
                </h5>
                <Badge bg="primary" className="opacity-75">2 / 3</Badge>
            </div>

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : (
                <>
                    {/* ── Vehicle & Driver ─────────────────────── */}
                    <div className="border rounded-2 p-3 mb-3">
                        <h6 className="mb-3 text-dark d-flex align-items-center gap-2">
                            <IconifyIcon icon="ri:car-washing-line" /> Véhicule & Chauffeur
                        </h6>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Label className="small fw-bold">Véhicule <span className="text-danger">*</span></Form.Label>
                                <Select
                                    options={vehicles}
                                    value={vehicles.find(v => v.value === form.vehiculeId) ?? null}
                                    onChange={handleVehicleChange}
                                    placeholder="Choisir un véhicule disponible…"
                                    noOptionsMessage={() => 'Aucun véhicule disponible'}
                                />
                                {form.vehiculeType && (
                                    <div className="mt-1 d-flex gap-2">
                                        <Badge bg="secondary" className="fw-normal">{form.vehiculeType}</Badge>
                                        <Badge bg="info" className="fw-normal text-dark">{form.vehiculeCarburant}</Badge>
                                        {form.vehiculeConsommation > 0 && (
                                            <Badge bg="light" className="fw-normal text-dark border">{form.vehiculeConsommation} L/100km</Badge>
                                        )}
                                    </div>
                                )}
                            </Col>
                            <Col md={12}>
                                <Form.Label className="small fw-bold">Chauffeur <span className="text-danger">*</span></Form.Label>
                                <Select
                                    options={drivers}
                                    value={drivers.find(d => d.value === form.employeeId) ?? null}
                                    onChange={(o: any) => setForm((f: WizardForm) => ({ ...f, employeeId: o?.value ?? 0 }))}
                                    placeholder="Choisir un chauffeur disponible…"
                                    noOptionsMessage={() => 'Aucun chauffeur disponible'}
                                />
                            </Col>
                        </Row>
                    </div>

                    {/* ── Trip params for AI ───────────────────── */}
                    <div className="border rounded-2 p-3 mb-3">
                        <h6 className="mb-3 text-dark d-flex align-items-center gap-2">
                            <IconifyIcon icon="ri:settings-3-line" /> Paramètres du trajet
                            <span className="badge bg-light text-secondary fw-normal small">utilisés par l&apos;IA</span>
                        </h6>
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Poids fret (kg)</Form.Label>
                                    <Form.Control size="sm" type="number" min={0} step={10}
                                        value={form.cargoWeight}
                                        onChange={e => setForm((f: WizardForm) => ({ ...f, cargoWeight: +e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Passagers</Form.Label>
                                    <Form.Control size="sm" type="number" min={1} max={50}
                                        value={form.passengerCount}
                                        onChange={e => setForm((f: WizardForm) => ({ ...f, passengerCount: +e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Bagages (kg)</Form.Label>
                                    <Form.Control size="sm" type="number" min={0} step={5}
                                        value={form.luggageWeight}
                                        onChange={e => setForm((f: WizardForm) => ({ ...f, luggageWeight: +e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Condition de trafic</Form.Label>
                                <Select
                                    options={trafficOptions}
                                    value={trafficOptions.find(o => o.value === form.trafficCondition)}
                                    onChange={(o: any) => setForm((f: WizardForm) => ({ ...f, trafficCondition: o?.value ?? 'Normal' }))}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Conditions météo</Form.Label>
                                <Select
                                    options={weatherOptions}
                                    value={weatherOptions.find(o => o.value === form.weatherCondition)}
                                    onChange={(o: any) => setForm((f: WizardForm) => ({ ...f, weatherCondition: o?.value ?? 'Sunny' }))}
                                />
                            </Col>
                        </Row>
                    </div>

                    {/* ── Checklist ────────────────────────────── */}
                    <div className="border rounded-2 p-3 mb-3">
                        <h6 className="mb-3 text-dark d-flex align-items-center gap-2">
                            <IconifyIcon icon="ri:list-check-2" /> Checklist Logistique
                        </h6>
                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Check type="checkbox" id="bon-carb" label="Bon de Carburant Accordé" className="small"
                                    checked={form.bonCarburantAccorde}
                                    onChange={e => setForm((f: WizardForm) => ({ ...f, bonCarburantAccorde: e.target.checked }))}
                                />
                            </Col>
                            {form.bonCarburantAccorde && (
                                <Col md={6}>
                                    <Form.Control size="sm" placeholder="N° du Bon"
                                        value={form.numeroBonCarburant}
                                        onChange={e => setForm((f: WizardForm) => ({ ...f, numeroBonCarburant: e.target.value }))}
                                    />
                                </Col>
                            )}
                            <Col md={6}>
                                <Form.Check type="checkbox" id="verif-docs" label="Vérification Documents (Assurance/Visite)" className="small"
                                    checked={form.verificationDocuments}
                                    onChange={e => setForm((f: WizardForm) => ({ ...f, verificationDocuments: e.target.checked }))}
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Check type="checkbox" id="autoroute" label="Carte Autoroute remise" className="small"
                                    checked={form.carteAutorouteRemise}
                                    onChange={e => setForm((f: WizardForm) => ({ ...f, carteAutorouteRemise: e.target.checked }))}
                                />
                            </Col>
                        </Row>
                    </div>

                    <div className="d-flex justify-content-between mt-3">
                        <Button variant="outline-secondary" size="sm" onClick={previousStep}>
                            <IconifyIcon icon="ri:arrow-left-line" className="me-1" /> Précédent
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleNext} className="px-4">
                            Suivant <IconifyIcon icon="ri:arrow-right-line" className="ms-1" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}

// ── STEP 3 — Estimation IA & Confirmation ────────────────────────────────────
const Step3 = ({ previousStep, isActive, form, setForm, onFinish, isSaving }: any) => {
    const [isPredicting, setIsPredicting] = useState(false)
    const [prediction, setPrediction] = useState<PredictionData | null>(null)
    const [predError, setPredError] = useState('')

    useEffect(() => {
        if (!isActive) return
        if (!form.villeDepart || !form.villeArrivee || form.distanceEstimee <= 0) return

        setIsPredicting(true)
        setPredError('')

        fetch(`${AI_API}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                departure: form.villeDepart,
                arrival: form.villeArrivee,
                date_depart: form.dateDepart,
                vehicle_type_gmao: form.vehiculeType || undefined,
                fuel_type_gmao: form.vehiculeCarburant || undefined,
                fuel_consumption_per_100km: form.vehiculeConsommation > 0 ? form.vehiculeConsommation : undefined,
                has_autoroute: form.carteAutorouteRemise,
                cargo_weight: form.cargoWeight,
                passenger_count: form.passengerCount,
                luggage_weight: form.luggageWeight,
                traffic_condition: form.trafficCondition,
                weather_condition: form.weatherCondition,
            }),
        })
            .then(r => {
                if (!r.ok) throw new Error('Erreur IA')
                return r.json()
            })
            .then((d: PredictionData) => {
                setPrediction(d)
                if (!form.useManualCost) {
                    setForm((f: WizardForm) => ({ ...f, coutEstime: d.predicted_cost_tnd }))
                }
            })
            .catch(() => setPredError('Service IA indisponible — saisissez le coût manuellement.'))
            .finally(() => setIsPredicting(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive])

    const finalCout = form.useManualCost
        ? parseFloat(form.manualCoutInput) || 0
        : form.coutEstime

    return (
        <div className={isActive ? 'd-block' : 'd-none'}>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="mb-0">
                    <IconifyIcon icon="ri:robot-line" className="me-2 text-primary" />
                    Étape 3 — Estimation IA & Confirmation
                </h5>
                <Badge bg="primary" className="opacity-75">3 / 3</Badge>
            </div>

            {/* ── AI Prediction ────────────────────────────────── */}
            {isPredicting && (
                <div className="text-center py-4 border rounded-2 mb-3">
                    <Spinner animation="border" className="text-primary mb-2" />
                    <div className="small text-muted">Calcul du coût de trajet par l&apos;IA…</div>
                </div>
            )}

            {predError && (
                <Alert variant="warning" className="mb-3 py-2 small">
                    <IconifyIcon icon="ri:information-line" className="me-1" />
                    {predError}
                </Alert>
            )}

            {!isPredicting && prediction && (
                <div className="border border-primary border-opacity-25 rounded-2 p-3 mb-3 bg-primary bg-opacity-10">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0 text-primary d-flex align-items-center gap-2">
                            <IconifyIcon icon="ri:robot-line" /> Estimation du coût par l&apos;IA
                        </h6>
                        <Badge bg="primary" className="fs-6 px-3 py-2">
                            {prediction.predicted_cost_tnd.toFixed(2)} DT
                        </Badge>
                    </div>
                    <Table size="sm" borderless className="mb-0 small">
                        <tbody>
                            <tr>
                                <td className="text-muted ps-0">Distance</td>
                                <td className="text-end fw-semibold">{prediction.distance_km.toFixed(0)} km</td>
                            </tr>
                            <tr>
                                <td className="text-muted ps-0">Durée estimée</td>
                                <td className="text-end fw-semibold">{prediction.travel_hours.toFixed(1)} h</td>
                            </tr>
                            <tr>
                                <td className="text-muted ps-0">Carburant</td>
                                <td className="text-end fw-semibold">{prediction.fuel_cost_tnd.toFixed(2)} DT</td>
                            </tr>
                            <tr>
                                <td className="text-muted ps-0">Main-d&apos;œuvre</td>
                                <td className="text-end fw-semibold">{prediction.labor_cost_tnd.toFixed(2)} DT</td>
                            </tr>
                            {prediction.toll_cost_tnd > 0 && (
                                <tr>
                                    <td className="text-muted ps-0">Péage autoroute</td>
                                    <td className="text-end fw-semibold">{prediction.toll_cost_tnd.toFixed(2)} DT</td>
                                </tr>
                            )}
                            <tr>
                                <td className="text-muted ps-0">Indemnité chauffeur</td>
                                <td className="text-end fw-semibold">{prediction.driver_allowance_tnd.toFixed(2)} DT</td>
                            </tr>
                        </tbody>
                    </Table>
                </div>
            )}

            {/* ── Accept AI price or enter manually ───────────── */}
            <div className="border rounded-2 p-3 mb-3">
                <h6 className="mb-3">Coût estimé de la mission</h6>
                <div className="d-flex gap-3 mb-3">
                    <Form.Check type="radio" id="use-ai" label="Utiliser le prix IA"
                        checked={!form.useManualCost}
                        onChange={() => {
                            const cost = prediction?.predicted_cost_tnd ?? 0
                            setForm((f: WizardForm) => ({ ...f, useManualCost: false, coutEstime: cost }))
                        }}
                        disabled={!prediction}
                    />
                    <Form.Check type="radio" id="use-manual" label="Saisir manuellement"
                        checked={form.useManualCost}
                        onChange={() => setForm((f: WizardForm) => ({ ...f, useManualCost: true }))}
                    />
                </div>
                {form.useManualCost ? (
                    <div className="d-flex align-items-center gap-2">
                        <Form.Control size="sm" type="number" min={0} step={0.5} style={{ maxWidth: 160 }}
                            placeholder="Ex: 85.00"
                            value={form.manualCoutInput}
                            onChange={e => setForm((f: WizardForm) => ({ ...f, manualCoutInput: e.target.value, coutEstime: parseFloat(e.target.value) || 0 }))}
                        />
                        <span className="text-muted small">DT</span>
                    </div>
                ) : (
                    <div className="fs-5 fw-bold text-primary">
                        {(prediction?.predicted_cost_tnd ?? 0).toFixed(2)} DT
                    </div>
                )}
            </div>

            {/* ── Recap ────────────────────────────────────────── */}
            <div className="bg-light border rounded-2 p-3 mb-3">
                <h6 className="mb-2">Récapitulatif</h6>
                <Table size="sm" borderless className="mb-0 small">
                    <tbody>
                        <tr><td className="text-muted">Trajet</td><td><strong>{form.villeDepart}</strong> → <strong>{form.villeArrivee}</strong></td></tr>
                        <tr><td className="text-muted">Distance</td><td>{form.distanceEstimee.toFixed(0)} km</td></tr>
                        <tr><td className="text-muted">Départ</td><td>{form.dateDepart ? new Date(form.dateDepart).toLocaleString('fr-FR') : '—'}</td></tr>
                        <tr><td className="text-muted">Objet</td><td>{form.objetMission}</td></tr>
                        <tr><td className="text-muted">Coût estimé</td><td className="fw-bold text-success">{finalCout.toFixed(2)} DT</td></tr>
                    </tbody>
                </Table>
            </div>

            <div className="d-flex justify-content-between mt-3">
                <Button variant="outline-secondary" size="sm" onClick={previousStep} disabled={isSaving}>
                    <IconifyIcon icon="ri:arrow-left-line" className="me-1" /> Précédent
                </Button>
                <Button variant="success" size="sm" onClick={onFinish} disabled={isSaving} className="px-4">
                    {isSaving
                        ? <><Spinner animation="border" size="sm" className="me-1" /> Création…</>
                        : <><IconifyIcon icon="ri:check-line" className="me-1" /> Créer la Mission</>
                    }
                </Button>
            </div>
        </div>
    )
}

// ── Root modal ────────────────────────────────────────────────────────────────
const MissionWizardModal = ({ show, onHide, reloadList }: MissionWizardModalProps) => {
    const [form, setForm] = useState<WizardForm>(emptyForm())
    const [isSaving, setIsSaving] = useState(false)
    const { error, execute, clearError } = useApiError()

    const resetAll = useCallback(() => setForm(emptyForm()), [])

    const handleFinish = async () => {
        setIsSaving(true)
        clearError()

        const finalCout = form.useManualCost ? parseFloat(form.manualCoutInput) || 0 : form.coutEstime

        await execute(async () => {
            await missionService.create({
                dateDepart: form.dateDepart,
                dateRetour: form.dateRetour || undefined,
                destination: form.villeArrivee || 'N/A',
                kilometrageDepart: form.kilometrageDepart,
                objetMission: form.objetMission,
                vehiculeId: form.vehiculeId,
                employeeId: form.employeeId,
                bonCarburantAccorde: form.bonCarburantAccorde,
                numeroBonCarburant: form.numeroBonCarburant || undefined,
                verificationDocuments: form.verificationDocuments,
                carteAutorouteRemise: form.carteAutorouteRemise,
                villeDepart: form.villeDepart,
                villeArrivee: form.villeArrivee,
                distanceEstimee: form.distanceEstimee,
                coutEstime: finalCout,
            })
            await Swal.fire('Succès', 'La mission a été créée avec succès.', 'success')
            reloadList()
            onHide()
            resetAll()
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
                    <AlerteErreur status={error.status} message={error.message}
                        onDismiss={clearError} className="mb-3" />
                )}
                <StepWizard>
                    <Step1 form={form} setForm={setForm} />
                    <Step2 form={form} setForm={setForm} execute={execute} clearError={clearError} />
                    <Step3 form={form} setForm={setForm} onFinish={handleFinish} isSaving={isSaving} />
                </StepWizard>
            </Modal.Body>
        </Modal>
    )
}

export default MissionWizardModal
