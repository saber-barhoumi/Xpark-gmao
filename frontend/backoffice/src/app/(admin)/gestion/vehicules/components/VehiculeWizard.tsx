import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button, Col, Form, Modal, Row, Spinner, Table, Badge, Card } from 'react-bootstrap'
import StepWizard from 'react-step-wizard'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { documentAdministratifService, DocumentAdministratif } from '@/services/documentAdministratifService'
import api from '@/lib/axiosConfig'
import Swal from 'sweetalert2'
import { useApiError } from '@/hooks/useApiError'
import { AlerteErreur } from '@/components/AlerteErreur'
import OCRUploadZone from './OCRUploadZone'
import type { ExtractedOCRData } from '@/services/groqOCRService'



const AI_VEHICLE_TYPES = [
    { value: 'LIGHT_VEHICLE', label: 'Véhicule Léger — Berline, SUV, Moto',   fuel: 'Petrol', cons: 8.0,  charge: 800   },
    { value: 'VAN',           label: 'Fourgonnette — Vito, Trafic, HiAce',    fuel: 'Diesel', cons: 10.0, charge: 1000  },
    { value: 'FOURGON',       label: 'Grand Fourgon — Sprinter, Master, Daily',fuel: 'Diesel', cons: 13.0, charge: 2500  },
    { value: 'HEAVY_TRUCK',   label: 'Camion Lourd — Actros, MAN, Volvo FH', fuel: 'Diesel', cons: 32.0, charge: 10000 },
]

const CARBURANT_TO_AI_FUEL: Record<string, string> = {
    ESSENCE: 'Petrol', DIESEL: 'Diesel', ELECTRIQUE: 'Electric', HYBRIDE: 'Hybrid', GPL: 'GPL',
}

const AI_DEFAULTS: Record<string, { consommationAI: number; chargeUtileKgDefault: number }> = {
    LIGHT_VEHICLE: { consommationAI: 8,  chargeUtileKgDefault: 800   },
    VAN:           { consommationAI: 10, chargeUtileKgDefault: 1000  },
    FOURGON:       { consommationAI: 13, chargeUtileKgDefault: 2500  },
    HEAVY_TRUCK:   { consommationAI: 32, chargeUtileKgDefault: 10000 },
}

function computeAIVehicleType(typeVehicule: string, chargeUtileKg: number, modele: string): { type: string; source: string } {
    const lower = modele.toLowerCase()
    const fourgonKw = ['sprinter', 'master', 'daily', 'transit l', 'jumper', 'boxer', 'crafter', 'ducato']
    const vanKw     = ['partner', 'kangoo', 'berlingo', 'express', 'doblo', 'combo', 'vivaro', 'trafic', 'caddy']
    switch (typeVehicule) {
        case 'BERLINE': case 'SUV':
            return { type: 'LIGHT_VEHICLE', source: `typeVehicule (${typeVehicule})` }
        case 'MOTO':
            return { type: 'LIGHT_VEHICLE', source: 'typeVehicule (Moto)' }
        case 'MINIBUS':
            return { type: 'HEAVY_TRUCK', source: 'typeVehicule (Minibus)' }
        case 'UTILITAIRE': {
            const base = chargeUtileKg > 1500 ? 'FOURGON' : 'VAN'
            const src  = `Utilitaire + charge ${chargeUtileKg <= 1500 ? '≤' : '>'} 1 500 kg`
            if (fourgonKw.some(kw => lower.includes(kw))) return { type: 'FOURGON', source: `${src} · modèle "${modele}"` }
            if (vanKw.some(kw => lower.includes(kw)))     return { type: 'VAN',     source: `${src} · modèle "${modele}"` }
            return { type: base, source: src }
        }
        case 'CAMION':
            return chargeUtileKg > 7500
                ? { type: 'HEAVY_TRUCK', source: 'typeVehicule (Camion) + charge > 7 500 kg' }
                : { type: 'FOURGON',     source: 'typeVehicule (Camion) + charge ≤ 7 500 kg' }
        default:
            return { type: 'LIGHT_VEHICLE', source: 'défaut' }
    }
}

const TYPES_VEHICULE = [
    { value: 'BERLINE', label: 'BERLINE' },
    { value: 'UTILITAIRE', label: 'UTILITAIRE' },
    { value: 'MINIBUS', label: 'MINIBUS' },
    { value: 'SUV', label: 'SUV' },
    { value: 'CAMION', label: 'CAMION' },
    { value: 'MOTO', label: 'MOTO' }
]

const TYPES_CARBURANT = [
    { value: 'DIESEL', label: 'DIESEL' },
    { value: 'ESSENCE', label: 'ESSENCE' },
    { value: 'HYBRIDE', label: 'HYBRIDE' },
    { value: 'ELECTRIQUE', label: 'ELECTRIQUE' }
]

const TYPES_DOCUMENT = [
    { value: 'CARTE_GRISE', label: 'Carte Grise' },
    { value: 'ASSURANCE', label: 'Assurance' },
    { value: 'VIGNETTE', label: 'Vignette' },
    { value: 'VISITE_TECHNIQUE', label: 'Visite Technique' },
    { value: 'AUTRE', label: 'Autre' }
]

const NumberInput = ({ value, onChange, label, min = 0, max = 99999 }: any) => {
    return (
        <Form.Group className="mb-3">
            <Form.Label>{label}</Form.Label>
            <div className="input-group">
                <Button variant="outline-secondary" onClick={() => onChange(Math.max(min, value - 1))}>
                    <IconifyIcon icon="ri:subtract-line" />
                </Button>
                <Form.Control
                    type="number"
                    className="text-center"
                    value={value}
                    onChange={e => onChange(Number(e.target.value))}
                />
                <Button variant="outline-secondary" onClick={() => onChange(Math.min(max, value + 1))}>
                    <IconifyIcon icon="ri:add-line" />
                </Button>
            </div>
        </Form.Group>
    )
}

// -------------------------------------------------------------------------------------
// STEP 1 : Infos Techniques
// -------------------------------------------------------------------------------------
// Helper: OCR label with badge
const OcrLabel = ({ label, isOcr, required }: { label: string; isOcr: boolean; required?: boolean }) => (
    <Form.Label className="d-flex align-items-center gap-1">
        {label}
        {required && <span className="text-danger">*</span>}
        {isOcr && (
            <Badge bg="success" className="fw-normal ms-1" style={{ fontSize: 9, padding: '2px 5px' }}>
                <IconifyIcon icon="tabler:wand" className="me-1" style={{ fontSize: 9 }} />
                OCR
            </Badge>
        )}
    </Form.Label>
)

const ocrInputStyle = (isOcr: boolean) =>
    isOcr
        ? { borderColor: 'rgba(25,135,84,.5)', background: 'rgba(25,135,84,.04)' }
        : {}

const Step1 = ({ nextStep, goToStep, isActive, form, setForm, isEdit, ocrFields, setOcrFields, ocrLoading, setOcrLoading, fillFromOCR,
    aiTypeOverridden, setAiTypeOverridden, aiTypeSuggested, setAiTypeSuggested, aiTypeSource, setAiTypeSource, consAiTouched, setConsAiTouched }: any) => {

    // Auto-compute AI vehicle type whenever key fields change
    useEffect(() => {
        if (!form.typeVehicule) return
        const { type, source } = computeAIVehicleType(form.typeVehicule, form.chargeUtileKg ?? 0, form.modele ?? '')
        setAiTypeSuggested(type)
        setAiTypeSource(source)
        if (!aiTypeOverridden) {
            setForm((f: any) => ({ ...f, aiVehiculeType: type }))
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.typeVehicule, form.chargeUtileKg, form.modele, aiTypeOverridden])

    // Auto-fill consommationAI when aiVehiculeType changes (unless user touched it)
    useEffect(() => {
        if (!form.aiVehiculeType || consAiTouched) return
        const def = AI_DEFAULTS[form.aiVehiculeType]
        if (def) setForm((f: any) => ({ ...f, consommationAI: def.consommationAI }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.aiVehiculeType, consAiTouched])

    const handleNext = async () => {
        if (!form.immatriculation || !form.marque || !form.modele) {
            Swal.fire('Erreur', 'L\'immatriculation, la marque et le modèle sont obligatoires.', 'error')
            return
        }
        if (aiTypeOverridden && form.aiVehiculeType && aiTypeSuggested && form.aiVehiculeType !== aiTypeSuggested) {
            await Swal.fire({
                icon: 'warning',
                title: 'Type IA modifié manuellement',
                html: `Suggestion automatique : <strong>${aiTypeSuggested}</strong><br/>Profil sélectionné : <strong>${form.aiVehiculeType}</strong><br/><br/>Cela affectera les prédictions de coût pour ce véhicule.`,
                confirmButtonText: 'Continuer quand même',
            })
        }
        nextStep()
    }

    const isOcr = (field: string) => ocrFields?.has?.(field) ?? false

    // When user manually edits an OCR field, remove OCR badge
    const setFormField = (field: string, value: any) => {
        setForm({ ...form, [field]: value })
        if (ocrFields?.has?.(field)) {
            const next = new Set(ocrFields)
            next.delete(field)
            setOcrFields?.(next)
        }
    }

    return (
        <div className={isActive ? 'd-block' : 'd-none'}>
            <h5 className="mb-4">Etape 1 : Informations Techniques</h5>

            {/* ── Zone OCR Gemini ─────────────────────────── */}
            {!isEdit && (
                <OCRUploadZone
                    onExtracted={fillFromOCR}
                    onLoading={setOcrLoading}
                />
            )}

            {ocrLoading && (
                <div className="text-center py-3">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Gemini analyse les documents...</p>
                </div>
            )}

            <Row>
                <Col md={4}>
                    <Form.Group className="mb-3">
                        <OcrLabel label="Immatriculation" required isOcr={isOcr('immatriculation')} />
                        <Form.Control
                            value={form.immatriculation}
                            onChange={e => setFormField('immatriculation', e.target.value)}
                            placeholder="Ex: 156 TUN 4520"
                            style={ocrInputStyle(isOcr('immatriculation'))}
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group className="mb-3">
                        <OcrLabel label="Marque" required isOcr={isOcr('marque')} />
                        <CreatableSelect
                            isClearable
                            options={[{ value: 'Peugeot', label: 'Peugeot' }, { value: 'Renault', label: 'Renault' }, { value: 'Volkswagen', label: 'Volkswagen' }, { value: 'Toyota', label: 'Toyota' }, { value: 'Kia', label: 'Kia' }, { value: 'Hyundai', label: 'Hyundai' }, { value: 'Mercedes', label: 'Mercedes' }, { value: 'BMW', label: 'BMW' }, { value: 'Volvo', label: 'Volvo' }, { value: 'Citroën', label: 'Citroën' }]}
                            value={form.marque ? { value: form.marque, label: form.marque } : null}
                            onChange={(nv: any) => setFormField('marque', nv?.value || '')}
                            styles={isOcr('marque') ? { control: (base: any) => ({ ...base, borderColor: 'rgba(25,135,84,.5)', background: 'rgba(25,135,84,.04)' }) } : {}}
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group className="mb-3">
                        <OcrLabel label="Modèle" required isOcr={isOcr('modele')} />
                        <CreatableSelect
                            isClearable
                            options={[{ value: 'Partner', label: 'Partner' }, { value: 'Kangoo', label: 'Kangoo' }]}
                            value={form.modele ? { value: form.modele, label: form.modele } : null}
                            onChange={(nv: any) => setFormField('modele', nv?.value || '')}
                            styles={isOcr('modele') ? { control: (base: any) => ({ ...base, borderColor: 'rgba(25,135,84,.5)', background: 'rgba(25,135,84,.04)' }) } : {}}
                        />
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col md={4}>
                    <Form.Group className="mb-3">
                        <OcrLabel label="N° Châssis / VIN" isOcr={isOcr('numeroChassis')} />
                        <Form.Control
                            value={form.numeroChassis}
                            onChange={e => setFormField('numeroChassis', e.target.value)}
                            style={ocrInputStyle(isOcr('numeroChassis'))}
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group className="mb-3">
                        <OcrLabel label="Type de véhicule" isOcr={isOcr('typeVehicule')} />
                        <Select
                            options={TYPES_VEHICULE}
                            value={TYPES_VEHICULE.find(t => t.value === form.typeVehicule)}
                            onChange={(nv: any) => setFormField('typeVehicule', nv?.value || '')}
                            styles={isOcr('typeVehicule') ? { control: (base: any) => ({ ...base, borderColor: 'rgba(25,135,84,.5)', background: 'rgba(25,135,84,.04)' }) } : {}}
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group className="mb-3">
                        <OcrLabel label="Couleur" isOcr={isOcr('couleur')} />
                        <CreatableSelect
                            isClearable
                            options={[{ value: 'Blanc', label: 'Blanc' }, { value: 'Noir', label: 'Noir' }, { value: 'Gris', label: 'Gris' }, { value: 'Rouge', label: 'Rouge' }, { value: 'Bleu', label: 'Bleu' }, { value: 'Beige', label: 'Beige' }]}
                            value={form.couleur ? { value: form.couleur, label: form.couleur } : null}
                            onChange={(nv: any) => setFormField('couleur', nv?.value || '')}
                            styles={isOcr('couleur') ? { control: (base: any) => ({ ...base, borderColor: 'rgba(25,135,84,.5)', background: 'rgba(25,135,84,.04)' }) } : {}}
                        />
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col md={4}>
                    <Form.Group className="mb-3">
                        <OcrLabel label="Carburant" isOcr={isOcr('typeCarburant')} />
                        <Select
                            options={TYPES_CARBURANT}
                            value={TYPES_CARBURANT.find(t => t.value === form.typeCarburant)}
                            onChange={(nv: any) => setFormField('typeCarburant', nv?.value || '')}
                            styles={isOcr('typeCarburant') ? { control: (base: any) => ({ ...base, borderColor: 'rgba(25,135,84,.5)', background: 'rgba(25,135,84,.04)' }) } : {}}
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <NumberInput
                        label="Kilométrage Actuel"
                        value={form.kilometrage}
                        onChange={(v: number) => setFormField('kilometrage', v)}
                    />
                </Col>
                <Col md={4}>
                    <Form.Group className="mb-3">
                        <Form.Label>Consommation moyenne (L/100km)</Form.Label>
                        <Form.Control
                            type="number"
                            step="0.1"
                            value={form.consommationMoyenne}
                            onChange={e => setForm({ ...form, consommationMoyenne: Number(e.target.value) })}
                        />
                    </Form.Group>
                </Col>
            </Row>

            {/* ── AI Classification ───────────────────────── */}
            <hr className="my-3" />
            <h6 className="mb-3 d-flex align-items-center gap-2">
                <IconifyIcon icon="ri:robot-line" className="text-primary" />
                Paramètres Modèle IA — Calcul de Prix Trajet
                <Badge bg="info" className="fw-normal" style={{ fontSize: 10 }}>optionnel mais recommandé</Badge>
            </h6>

            <Row>
                <Col md={12}>
                    <Form.Group className="mb-1">
                        <Form.Label className="small fw-bold">
                            Type IA <span className="text-muted fw-normal">(classification pour la prédiction de coût)</span>
                        </Form.Label>
                        <Select
                            isClearable
                            options={AI_VEHICLE_TYPES.map(t => ({ value: t.value, label: t.label }))}
                            value={form.aiVehiculeType
                                ? { value: form.aiVehiculeType, label: AI_VEHICLE_TYPES.find(t => t.value === form.aiVehiculeType)?.label ?? form.aiVehiculeType }
                                : null
                            }
                            onChange={(nv: any) => {
                                setAiTypeOverridden(true)
                                setForm((f: any) => ({ ...f, aiVehiculeType: nv?.value ?? '' }))
                            }}
                            placeholder="Sélectionner le type IA…"
                        />
                    </Form.Group>
                    <div className="d-flex align-items-center gap-2 mt-1 mb-1">
                        {!aiTypeOverridden ? (
                            <Badge bg="success" className="fw-normal">Automatique ✓</Badge>
                        ) : (
                            <>
                                <Badge bg="warning" text="dark" className="fw-normal">⚠ Modifié manuellement</Badge>
                                <Button variant="link" size="sm" className="p-0 text-decoration-underline"
                                    onClick={() => { setAiTypeOverridden(false); setForm((f: any) => ({ ...f, aiVehiculeType: aiTypeSuggested })) }}>
                                    Réinitialiser
                                </Button>
                            </>
                        )}
                    </div>
                    {aiTypeSource && (
                        <p className="text-muted small mb-3">Source : {aiTypeSource}</p>
                    )}
                </Col>
            </Row>

            {form.aiVehiculeType && (
                <Card className="border-info mb-3 shadow-none">
                    <Card.Body className="py-2 px-3">
                        <div className="small fw-semibold text-info mb-2 d-flex align-items-center gap-1">
                            <IconifyIcon icon="ri:robot-line" /> Profil IA résolu
                        </div>
                        <div className="row g-1 small">
                            <div className="col-md-3 text-muted">Carburant IA</div>
                            <div className="col-md-9">
                                <Badge bg="light" text="dark" className="border fw-normal">
                                    {CARBURANT_TO_AI_FUEL[form.typeCarburant] ?? '—'}
                                </Badge>
                                <span className="text-success ms-2 small">← synchronisé auto</span>
                            </div>
                            <div className="col-md-3 text-muted align-self-center">Consommation</div>
                            <div className="col-md-9">
                                <div className="d-flex align-items-center gap-2">
                                    <Form.Control type="number" size="sm" step="0.5" min={1} style={{ width: 80 }}
                                        value={form.consommationAI ?? ''}
                                        onChange={e => { setConsAiTouched(true); setForm((f: any) => ({ ...f, consommationAI: parseFloat(e.target.value) })) }}
                                    />
                                    <span className="text-muted">L/100km</span>
                                    {consAiTouched && (
                                        <Button variant="link" size="sm" className="p-0" style={{ fontSize: 11 }}
                                            onClick={() => { setConsAiTouched(false); setForm((f: any) => ({ ...f, consommationAI: AI_DEFAULTS[form.aiVehiculeType]?.consommationAI ?? 0 })) }}>
                                            Valeur par défaut
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-3 text-muted align-self-center">Charge utile</div>
                            <div className="col-md-9">
                                <div className="d-flex align-items-center gap-2">
                                    <Form.Control type="number" size="sm" min={0} style={{ width: 100 }}
                                        value={form.chargeUtileKg ?? ''}
                                        onChange={e => setForm((f: any) => ({ ...f, chargeUtileKg: parseInt(e.target.value) || 0 }))}
                                    />
                                    <span className="text-muted">kg</span>
                                </div>
                            </div>
                            {aiTypeOverridden && aiTypeSuggested && (
                                <>
                                    <div className="col-12"><hr className="my-1" /></div>
                                    <div className="col-md-3 text-muted">Suggestion auto</div>
                                    <div className="col-md-9 fst-italic">{aiTypeSuggested}</div>
                                    <div className="col-md-3 text-muted">Raison</div>
                                    <div className="col-md-9 text-muted fst-italic">{aiTypeSource}</div>
                                </>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            )}

            <div className="d-flex justify-content-end mt-2">
                <Button variant="primary" onClick={handleNext}>
                    Suivant <IconifyIcon icon="ri:arrow-right-line" className="ms-1" />
                </Button>
            </div>
        </div>
    )
}

// -------------------------------------------------------------------------------------
// STEP 2 : Admin & Finances
// -------------------------------------------------------------------------------------
const Step2 = ({ previousStep, nextStep, isActive, form, setForm, saveVehicule, isSavingVehicule }: any) => {
    const handleNext = async () => {
        // Enregistrer le véhicule en base de données avant de passer aux documents
        const success = await saveVehicule()
        if (success) {
            nextStep()
        }
    }

    return (
        <div className={isActive ? 'd-block' : 'd-none'}>
            <h5 className="mb-4">Etape 2 : Administratif et Financier</h5>

            <Row>
                <Col md={4}>
                    <NumberInput
                        label="Année de Construction"
                        value={form.anneeConstruction}
                        min={1990} max={new Date().getFullYear() + 1}
                        onChange={(v: number) => setForm({ ...form, anneeConstruction: v })}
                    />
                </Col>
                <Col md={4}>
                    <NumberInput
                        label="Nombre de places"
                        value={form.nombrePlaces}
                        min={1} max={100}
                        onChange={(v: number) => setForm({ ...form, nombrePlaces: v })}
                    />
                </Col>
                <Col md={4}>
                    <NumberInput
                        label="Puissance Fiscale (CV)"
                        value={form.puissanceFiscale}
                        min={1} max={50}
                        onChange={(v: number) => setForm({ ...form, puissanceFiscale: v })}
                    />
                </Col>
            </Row>

            <Row>
                <Col md={4}>
                    <Form.Group className="mb-3">
                        <Form.Label>Date d'Acquisition</Form.Label>
                        <Form.Control
                            type="date"
                            value={form.dateAcquisition ? new Date(form.dateAcquisition).toISOString().split('T')[0] : ''}
                            onChange={e => setForm({ ...form, dateAcquisition: e.target.value })}
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group className="mb-3">
                        <Form.Label>Valeur d'Acquisition (DT)</Form.Label>
                        <Form.Control
                            type="number"
                            value={form.valeurAcquisition}
                            onChange={e => setForm({ ...form, valeurAcquisition: Number(e.target.value) })}
                        />
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Date de Dernière Révision</Form.Label>
                        <Form.Control
                            type="date"
                            value={form.dateDerniereRevision ? new Date(form.dateDerniereRevision).toISOString().split('T')[0] : ''}
                            onChange={e => setForm({ ...form, dateDerniereRevision: e.target.value })}
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Date Prochaine Révision</Form.Label>
                        <Form.Control
                            type="date"
                            value={form.dateProchaineRevision ? new Date(form.dateProchaineRevision).toISOString().split('T')[0] : ''}
                            onChange={e => setForm({ ...form, dateProchaineRevision: e.target.value })}
                        />
                    </Form.Group>
                </Col>
            </Row>

            <div className="d-flex justify-content-between mt-2">
                <Button variant="outline-secondary" onClick={previousStep} disabled={isSavingVehicule}>
                    <IconifyIcon icon="ri:arrow-left-line" className="me-1" /> Précédent
                </Button>
                <Button variant="primary" onClick={handleNext} disabled={isSavingVehicule}>
                    {isSavingVehicule ? <Spinner size="sm" /> : <>Enregistrer et Passer aux Documents <IconifyIcon icon="ri:arrow-right-line" className="ms-1" /></>}
                </Button>
            </div>
        </div>
    )
}

// -------------------------------------------------------------------------------------
// STEP 3 : Documents
// -------------------------------------------------------------------------------------
const Step3 = ({ previousStep, isActive, idVehicule, onFinished }: any) => {
    const { error, execute, clearError } = useApiError()
    const [documents, setDocuments] = useState<DocumentAdministratif[]>([])
    const [loading, setLoading] = useState(false)
    const [docForm, setDocForm] = useState({
        typeDocument: 'CARTE_GRISE',
        numeroDocument: '',
        dateEmission: '',
        dateExpiration: '',
        observations: ''
    })
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const loadDocs = async () => {
        if (!idVehicule) return
        const docs = await documentAdministratifService.getByVehiculeId(idVehicule)
        setDocuments(docs)
    }

    React.useEffect(() => {
        if (isActive && idVehicule) {
            loadDocs()
        }
    }, [isActive, idVehicule])

    const handleUpload = async () => {
        if (!docForm.numeroDocument || !docForm.dateEmission || !docForm.dateExpiration) {
            Swal.fire('Erreur', 'Remplissez le Numéro et les dates d\'émission/expiration.', 'error')
            return
        }

        setLoading(true)
        clearError()
        const res = await execute(async () => {
            const formData = new FormData()
            formData.append('typeDocument', docForm.typeDocument)
            formData.append('numeroDocument', docForm.numeroDocument)
            formData.append('dateEmission', new Date(docForm.dateEmission).toISOString())
            formData.append('dateExpiration', new Date(docForm.dateExpiration).toISOString())
            formData.append('vehiculeId', idVehicule.toString())
            if (docForm.observations) formData.append('observations', docForm.observations)
            if (file) formData.append('file', file)

            return await documentAdministratifService.create(formData)
        })

        if (res) {
            // reset form
            setDocForm({ typeDocument: 'CARTE_GRISE', numeroDocument: '', dateEmission: '', dateExpiration: '', observations: '' })
            setFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''

            Swal.fire({ title: 'Document ajouté !', icon: 'success', timer: 1500, showConfirmButton: false })
            loadDocs()
        }
        setLoading(false)
    }

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer ce document ?',
            text: 'Cette action est irréversible.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Supprimer',
            cancelButtonText: 'Annuler',
        })
        if (result.isConfirmed) {
            try {
                await documentAdministratifService.delete(id)
                Swal.fire({ icon: 'success', title: 'Document supprimé !', timer: 1200, showConfirmButton: false })
                loadDocs()
            } catch (err: any) {
                const msg = err?.response?.data?.message || 'Impossible de supprimer ce document.'
                Swal.fire('Erreur', msg, 'error')
            }
        }
    }

    return (
        <div className={isActive ? 'd-block' : 'd-none'}>
            <h5 className="mb-4">Etape 3 : Documents Administratifs</h5>

            {error && (
                <AlerteErreur
                    status={error.status}
                    message={error.message}
                    onDismiss={clearError}
                    className="mb-4"
                />
            )}

            {/* Formulaire d'upload */}
            <Card className="shadow-none border mb-4">
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Type</Form.Label>
                                <Select
                                    options={TYPES_DOCUMENT}
                                    value={TYPES_DOCUMENT.find(t => t.value === docForm.typeDocument)}
                                    onChange={(nv: any) => setDocForm({ ...docForm, typeDocument: nv?.value || 'AUTRE' })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>N° Document *</Form.Label>
                                <Form.Control
                                    value={docForm.numeroDocument}
                                    onChange={e => setDocForm({ ...docForm, numeroDocument: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Date Émission *</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={docForm.dateEmission}
                                    onChange={e => setDocForm({ ...docForm, dateEmission: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Date Expiration *</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={docForm.dateExpiration}
                                    onChange={e => setDocForm({ ...docForm, dateExpiration: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Fichier (PDF, Image)</Form.Label>
                                <Form.Control
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e: any) => setFile(e.target.files[0])}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6} className="d-flex align-items-end mb-3">
                            <Button variant="info" className="w-100" onClick={handleUpload} disabled={loading}>
                                {loading ? <Spinner size="sm" /> : <><IconifyIcon icon="ri:upload-cloud-2-line" className="me-1" /> Uploader le document</>}
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Liste des documents */}
            {documents.length > 0 ? (
                <Table size="sm" bordered hover>
                    <thead className="table-light">
                        <tr>
                            <th>Type</th>
                            <th>N° Document</th>
                            <th>Émission</th>
                            <th>Expiration</th>
                            <th>Alerte Expiration</th>
                            <th>Fichier</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map(d => {
                            const isExpired = new Date(d.dateExpiration).getTime() < new Date().getTime()
                            return (
                                <tr key={d.idDocument}>
                                    <td>{d.typeDocument}</td>
                                    <td>{d.numeroDocument}</td>
                                    <td>{new Date(d.dateEmission).toLocaleDateString()}</td>
                                    <td>{new Date(d.dateExpiration).toLocaleDateString()}</td>
                                    <td>
                                        {isExpired ? <Badge bg="danger">Expiré</Badge> : <Badge bg="success">Valide</Badge>}
                                    </td>
                                    <td>
                                        {d.fichierPath ? (
                                            <a href={`http://localhost:5000${d.fichierPath}`} target="_blank" rel="noreferrer">Ouvrir</a>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <Button variant="light" size="sm" className="text-danger" onClick={() => handleDelete(d.idDocument)}>
                                            <IconifyIcon icon="ri:delete-bin-line" />
                                        </Button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </Table>
            ) : (
                <p className="text-muted text-center my-3">Aucun document ajouté pour ce véhicule.</p>
            )}

            <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={previousStep}>
                    <IconifyIcon icon="ri:arrow-left-line" className="me-1" /> Retour
                </Button>
                <Button variant="success" onClick={onFinished}>
                    <IconifyIcon icon="ri:check-line" className="me-1" /> Terminer
                </Button>
            </div>
        </div>
    )
}

// -------------------------------------------------------------------------------------
// MAIN WIZARD COMPONENT
// -------------------------------------------------------------------------------------

export default function VehiculeWizard({ show, onHide, vehiculeToEdit, reloadList }: any) {
    const wizardRef = useRef<any>(null)
    const [activeStep, setActiveStep] = useState(1)
    const [idVehiculeCreated, setIdVehiculeCreated] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const { error, execute, clearError } = useApiError()

    // ── OCR state ──────────────────────────────────────────
    const [ocrFields, setOcrFields] = useState<Set<string>>(new Set())
    const [ocrLoading, setOcrLoading] = useState(false)

    // ── AI classification override tracking ────────────────
    const [aiTypeOverridden, setAiTypeOverridden] = useState(false)
    const [aiTypeSuggested, setAiTypeSuggested]   = useState('')
    const [aiTypeSource, setAiTypeSource]         = useState('')
    const [consAiTouched, setConsAiTouched]       = useState(false)

    const emptyForm = () => ({
        immatriculation: '', marque: '', modele: '', numeroChassis: '',
        anneeConstruction: new Date().getFullYear(), typeCarburant: 'DIESEL',
        typeVehicule: 'UTILITAIRE', kilometrage: 0, couleur: '',
        nombrePlaces: 5, consommationMoyenne: 8, valeurAcquisition: 0,
        puissanceFiscale: 5, dateAcquisition: new Date().toISOString().split('T')[0],
        dateDerniereRevision: '', dateProchaineRevision: '',
        aiVehiculeType: '', chargeUtileKg: 0, consommationAI: 0,
    })

    const [form, setForm] = useState<any>(emptyForm())

    // ── Auto-fill from OCR ──────────────────────────
    const fillFromOCR = useCallback((data: ExtractedOCRData) => {
        const newOcrFields = new Set<string>()
        const updates: Record<string, any> = {}

        // Mapping carburant Gemini → enum backend
        const mapCarburant: Record<string, string> = {
            'essence': 'ESSENCE', 'diesel': 'DIESEL', 'gasoil': 'DIESEL',
            'hybride': 'HYBRIDE', 'électrique': 'ELECTRIQUE',
            'electrique': 'ELECTRIQUE', 'gpl': 'GPL',
        }
        // Mapping type véhicule Gemini → enum backend
        const mapType: Record<string, string> = {
            'vp': 'BERLINE', 'berline': 'BERLINE', 'suv': 'SUV',
            'vu': 'UTILITAIRE', 'utilitaire': 'UTILITAIRE',
            'camion': 'CAMION', 'moto': 'MOTO', 'bus': 'MINIBUS',
            'minibus': 'MINIBUS',
        }

        const set = (formKey: string, val: any) => {
            if (val !== null && val !== undefined && val !== '') {
                updates[formKey] = val
                newOcrFields.add(formKey)
            }
        }

        set('immatriculation', data.immatriculation)
        set('marque', data.marque)
        set('modele', data.modele)
        set('numeroChassis', data.vin)
        set('couleur', data.couleur)
        if (data.annee) set('anneeConstruction', data.annee)
        if (data.puissanceFiscale) set('puissanceFiscale', data.puissanceFiscale)
        if (data.nombrePlaces) set('nombrePlaces', data.nombrePlaces)
        if (data.carburant) {
            const mapped = mapCarburant[data.carburant.toLowerCase()] || data.carburant.toUpperCase()
            set('typeCarburant', mapped)
        }
        if (data.typeVehicule) {
            const mapped = mapType[data.typeVehicule.toLowerCase()] || data.typeVehicule.toUpperCase()
            set('typeVehicule', mapped)
        }

        console.log('[OCR] Extracted fields:', updates)
        setForm((prev: any) => ({ ...prev, ...updates }))
        setOcrFields(newOcrFields)
    }, [])

    React.useEffect(() => {
        if (show) {
            setActiveStep(1)
            setIdVehiculeCreated(vehiculeToEdit?.idVehicule || null)
            setOcrFields(new Set())
            setOcrLoading(false)
            // When editing a vehicle that already has aiVehiculeType saved, treat it as a
            // manually-set override so the auto-compute doesn't silently overwrite it.
            setAiTypeOverridden(!!vehiculeToEdit?.aiVehiculeType)
            setAiTypeSuggested('')
            setAiTypeSource('')
            setConsAiTouched(!!vehiculeToEdit?.consommationAI)
            if (wizardRef.current) {
                try { wizardRef.current.goToStep(1) } catch { }
            }
            if (vehiculeToEdit) {
                setForm({
                    ...vehiculeToEdit,
                    dateAcquisition: vehiculeToEdit.dateAcquisition ? new Date(vehiculeToEdit.dateAcquisition).toISOString().split('T')[0] : '',
                    dateDerniereRevision: vehiculeToEdit.dateDerniereRevision ? new Date(vehiculeToEdit.dateDerniereRevision).toISOString().split('T')[0] : '',
                    dateProchaineRevision: vehiculeToEdit.dateProchaineRevision ? new Date(vehiculeToEdit.dateProchaineRevision).toISOString().split('T')[0] : ''
                })
            } else {
                setForm(emptyForm())
            }
        }
    }, [show, vehiculeToEdit])

    const saveVehiculeMethod = async () => {
        setIsSaving(true)
        clearError()
        const success = await execute(async () => {
            const payload = {
                ...form,
                dateAcquisition: form.dateAcquisition ? new Date(form.dateAcquisition).toISOString() : undefined,
                dateDerniereRevision: form.dateDerniereRevision ? new Date(form.dateDerniereRevision).toISOString() : undefined,
                dateProchaineRevision: form.dateProchaineRevision ? new Date(form.dateProchaineRevision).toISOString() : undefined,
            }

            if (idVehiculeCreated) {
                // Update
                await api.put(`/vehicules/${idVehiculeCreated}`, {
                    ...payload,
                    aiVehiculeType: form.aiVehiculeType || null,
                    chargeUtileKg: form.chargeUtileKg || 0,
                    consommationAI: form.consommationAI || 0,
                })
                reloadList()
                return true
            } else {
                // Create
                const res = await api.post('/vehicules', {
                    ...payload,
                    statut: 'ACTIF',
                    actif: true,
                    dateCreation: new Date().toISOString(),
                    aiVehiculeType: form.aiVehiculeType || null,
                    chargeUtileKg: form.chargeUtileKg || 0,
                    consommationAI: form.consommationAI || 0,
                })

                setIdVehiculeCreated(res.data.idVehicule)
                reloadList()
                return true
            }
        })
        setIsSaving(false)
        return !!success
    }

    const handleHide = () => {
        onHide()
    }

    return (
        <Modal show={show} onHide={handleHide} centered size="xl" backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>
                    <IconifyIcon icon="ri:car-line" className="me-2 text-primary" />
                    {vehiculeToEdit ? 'Modifier le Véhicule' : 'Nouveau Véhicule'}
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

                {/* Custom Tabs / Steps Indicator */}
                <ul className="nav nav-pills nav-justified form-wizard-header mb-4">
                    {[1, 2, 3].map(step => (
                        <li key={step} className="nav-item">
                            <span className={`nav-link rounded-0 py-2 ${activeStep === step ? 'active' : ''} ${activeStep > step ? 'bg-light text-success' : ''}`}>
                                {step === 1 && <IconifyIcon icon="ri:information-line" className="me-2" />}
                                {step === 2 && <IconifyIcon icon="ri:money-dollar-circle-line" className="me-2" />}
                                {step === 3 && <IconifyIcon icon="ri:folder-open-line" className="me-2" />}
                                <span className="d-none d-sm-inline">
                                    {step === 1 ? 'Infos Techniques' : step === 2 ? 'Admin & Finances' : 'Documents'}
                                </span>
                            </span>
                        </li>
                    ))}
                </ul>

                <StepWizard
                    instance={(wizard: any) => { wizardRef.current = wizard }}
                    onStepChange={(stats) => setActiveStep(stats.activeStep)}
                >
                    <Step1 form={form} setForm={setForm} isEdit={!!vehiculeToEdit}
                        ocrFields={ocrFields} setOcrFields={setOcrFields} ocrLoading={ocrLoading} setOcrLoading={setOcrLoading} fillFromOCR={fillFromOCR}
                        aiTypeOverridden={aiTypeOverridden} setAiTypeOverridden={setAiTypeOverridden}
                        aiTypeSuggested={aiTypeSuggested} setAiTypeSuggested={setAiTypeSuggested}
                        aiTypeSource={aiTypeSource} setAiTypeSource={setAiTypeSource}
                        consAiTouched={consAiTouched} setConsAiTouched={setConsAiTouched}
                    />
                    <Step2 form={form} setForm={setForm} saveVehicule={saveVehiculeMethod} isSavingVehicule={isSaving} />
                    <Step3 idVehicule={idVehiculeCreated} onFinished={handleHide} />
                </StepWizard>

            </Modal.Body>
        </Modal>
    )
}
