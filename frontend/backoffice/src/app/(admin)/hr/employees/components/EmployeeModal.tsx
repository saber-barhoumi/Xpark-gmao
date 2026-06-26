import { useState, useEffect } from 'react'
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap'
import {
    Employee,
    EmployeeDto,
    PostEmployee,
    ServiceEmployee,
    StatutEmployee,
    SpecialtyTechnician,
    LevelTechnician,
    CategoriePermis
} from '@/types/employee'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import OCRUploadZone from '../../../gestion/vehicules/components/OCRUploadZone'
import { ExtractedOCRData } from '@/services/groqOCRService'

interface EmployeeModalProps {
    show: boolean
    onHide: () => void
    onSave: (data: EmployeeDto) => Promise<void>
    employee: Employee | null
}

const EmployeeModal = ({ show, onHide, onSave, employee }: EmployeeModalProps) => {
    const [saving, setSaving] = useState(false)
    const [validated, setValidated] = useState(false)
    const [form, setForm] = useState<EmployeeDto>({
        name: '',
        prenom: '',
        numeroMatricule: '',
        telephone: '',
        dateEmbauche: new Date().toISOString().split('T')[0],
        post: PostEmployee.ADMINISTRATEUR,
        service: ServiceEmployee.ADMINISTRATION,
        statut: StatutEmployee.DISPONIBLE,
        numeroPermis: '',
        categoriePermis: CategoriePermis.B,
        dateExpirationPermis: '',
        specialty: SpecialtyTechnician.MECANIQUE,
        level: LevelTechnician.JUNIOR
    })

    useEffect(() => {
        if (employee) {
            setForm({
                name: employee.name,
                prenom: employee.prenom,
                numeroMatricule: employee.numeroMatricule,
                telephone: employee.telephone,
                dateEmbauche: employee.dateEmbauche.split('T')[0],
                post: employee.post,
                service: employee.service,
                statut: employee.statut,
                numeroPermis: employee.numeroPermis || '',
                categoriePermis: employee.categoriePermis || CategoriePermis.B,
                dateExpirationPermis: employee.dateExpirationPermis?.split('T')[0] || '',
                specialty: employee.specialty || SpecialtyTechnician.MECANIQUE,
                level: employee.level || LevelTechnician.JUNIOR
            })
        } else {
            setForm({
                name: '',
                prenom: '',
                numeroMatricule: '',
                telephone: '',
                dateEmbauche: new Date().toISOString().split('T')[0],
                post: PostEmployee.ADMINISTRATEUR,
                service: ServiceEmployee.ADMINISTRATION,
                statut: StatutEmployee.DISPONIBLE,
                numeroPermis: '',
                categoriePermis: CategoriePermis.B,
                dateExpirationPermis: '',
                specialty: SpecialtyTechnician.MECANIQUE,
                level: LevelTechnician.JUNIOR
            })
        }
    }, [employee, show])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (!e.currentTarget.checkValidity()) {
            setValidated(true)
            return
        }
        setValidated(false)
        setSaving(true)
        try {
            // Prepare data: set inactive fields to null/undefined if needed, 
            // but the backend handles it via nullable fields.
            const dataToSave = { ...form };
            if (form.post !== PostEmployee.CHAUFFEUR) {
                delete dataToSave.numeroPermis;
                delete dataToSave.categoriePermis;
                delete dataToSave.dateExpirationPermis;
            }
            if (form.post !== PostEmployee.TECHNICIEN) {
                delete dataToSave.specialty;
                delete dataToSave.level;
            }

            await onSave(dataToSave)
            onHide()
        } catch (error) {
            console.error('Error saving employee:', error)
        } finally {
            setSaving(false)
        }
    }

    const today = new Date().toISOString().split('T')[0]

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>{employee ? 'Modifier l\'employé' : 'Ajouter un employé'}</Modal.Title>
            </Modal.Header>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Label className="small fw-bold">Nom <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                required
                                minLength={2}
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Nom"
                            />
                            <Form.Control.Feedback type="invalid">Le nom est obligatoire (min. 2 caractères).</Form.Control.Feedback>
                        </Col>
                        <Col md={6}>
                            <Form.Label className="small fw-bold">Prénom <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                required
                                minLength={2}
                                value={form.prenom}
                                onChange={e => setForm({ ...form, prenom: e.target.value })}
                                placeholder="Prénom"
                            />
                            <Form.Control.Feedback type="invalid">Le prénom est obligatoire (min. 2 caractères).</Form.Control.Feedback>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Label className="small fw-bold">Numéro Matricule <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                required
                                value={form.numeroMatricule}
                                onChange={e => setForm({ ...form, numeroMatricule: e.target.value })}
                                placeholder="Ex: EMP-001"
                            />
                            <Form.Control.Feedback type="invalid">Le numéro matricule est obligatoire.</Form.Control.Feedback>
                        </Col>
                        <Col md={6}>
                            <Form.Label className="small fw-bold">Téléphone <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                required
                                value={form.telephone}
                                onChange={e => setForm({ ...form, telephone: e.target.value })}
                                placeholder="Ex: +216 22 123 456"
                            />
                            <Form.Control.Feedback type="invalid">Le téléphone est obligatoire.</Form.Control.Feedback>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Label className="small fw-bold">Poste</Form.Label>
                            <Form.Select
                                value={form.post}
                                onChange={e => setForm({ ...form, post: e.target.value as PostEmployee })}
                            >
                                {Object.values(PostEmployee).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Form.Label className="small fw-bold">Service</Form.Label>
                            <Form.Select
                                value={form.service}
                                onChange={e => setForm({ ...form, service: e.target.value as ServiceEmployee })}
                            >
                                {Object.values(ServiceEmployee).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={4}>
                            <Form.Label className="small fw-bold">Statut</Form.Label>
                            <Form.Select
                                value={form.statut}
                                onChange={e => setForm({ ...form, statut: e.target.value as StatutEmployee })}
                            >
                                {Object.values(StatutEmployee).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Label className="small fw-bold">Date d'embauche <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="date"
                                required
                                value={form.dateEmbauche}
                                onChange={e => setForm({ ...form, dateEmbauche: e.target.value })}
                            />
                            <Form.Control.Feedback type="invalid">La date d'embauche est obligatoire.</Form.Control.Feedback>
                        </Col>
                    </Row>

                    {/* Conditional Rendering Logic: CHAUFFEUR */}
                    {form.post === PostEmployee.CHAUFFEUR && (
                        <div className="p-3 bg-light rounded border border-success mb-3 animate__animated animate__fadeIn">
                            <h6 className="text-success mb-3"><IconifyIcon icon="ri:steering-2-line" className="me-1" /> Détails Chauffeur</h6>
                            
                            <OCRUploadZone 
                                onLoading={setSaving} 
                                onExtracted={(data: ExtractedOCRData) => {
                                    const updates: any = {};
                                    if (data.nom) updates.name = data.nom;
                                    if (data.prenom) updates.prenom = data.prenom;
                                    if (data.numeroPermis) updates.numeroPermis = data.numeroPermis;
                                    if (data.categoriePermis) updates.categoriePermis = data.categoriePermis;
                                    if (data.dateExpirationPermis) updates.dateExpirationPermis = data.dateExpirationPermis;
                                    
                                    setForm(prev => ({ ...prev, ...updates }));
                                }} 
                                title="Scan automatique du permis"
                                subtitle="Uploadez le permis de conduire pour extraire les informations automatiquement"
                                defaultType="PERMIS_CONDUIRE"
                            />

                            <Row className="mt-3">
                                <Col md={4}>
                                    <Form.Label className="small fw-bold">Numéro de Permis</Form.Label>
                                    <Form.Control
                                        required
                                        value={form.numeroPermis}
                                        onChange={e => setForm({ ...form, numeroPermis: e.target.value })}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Form.Label className="small fw-bold">Catégorie Permis</Form.Label>
                                    <Form.Select
                                        value={form.categoriePermis}
                                        onChange={e => setForm({ ...form, categoriePermis: e.target.value as CategoriePermis })}
                                    >
                                        {Object.values(CategoriePermis).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={4}>
                                    <Form.Label className="small fw-bold">Date Expiration</Form.Label>
                                    <Form.Control
                                        type="date"
                                        required
                                        min={today}
                                        value={form.dateExpirationPermis}
                                        onChange={e => setForm({ ...form, dateExpirationPermis: e.target.value })}
                                    />
                                </Col>
                            </Row>
                        </div>
                    )}

                    {/* Conditional Rendering Logic: TECHNICIEN */}
                    {form.post === PostEmployee.TECHNICIEN && (
                        <div className="p-3 bg-light rounded border border-primary mb-3 animate__animated animate__fadeIn">
                            <h6 className="text-primary mb-3"><IconifyIcon icon="ri:tools-line" className="me-1" /> Détails Technicien</h6>
                            <Row>
                                <Col md={6}>
                                    <Form.Label className="small fw-bold">Spécialité</Form.Label>
                                    <Form.Select
                                        value={form.specialty}
                                        onChange={e => setForm({ ...form, specialty: e.target.value as SpecialtyTechnician })}
                                    >
                                        {Object.values(SpecialtyTechnician).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={6}>
                                    <Form.Label className="small fw-bold">Niveau</Form.Label>
                                    <Form.Select
                                        value={form.level}
                                        onChange={e => setForm({ ...form, level: e.target.value as LevelTechnician })}
                                    >
                                        {Object.values(LevelTechnician).map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                            </Row>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-light border-0">
                    <Button variant="outline-secondary" onClick={onHide} disabled={saving}>Annuler</Button>
                    <Button variant="outline-warning" onClick={() => setForm({
                        name: '', prenom: '', numeroMatricule: '', telephone: '',
                        dateEmbauche: new Date().toISOString().split('T')[0],
                        post: PostEmployee.ADMINISTRATEUR, service: ServiceEmployee.ADMINISTRATION,
                        statut: StatutEmployee.DISPONIBLE
                    })} disabled={saving}>Réinitialiser</Button>
                    <Button variant="success" type="submit" disabled={saving}>
                        {saving ? <Spinner size="sm" className="me-1" /> : <IconifyIcon icon="ri:save-line" className="me-1" />}
                        Enregistrer
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}

export default EmployeeModal
