import { useState, useEffect } from 'react'
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap'
import { CreateEquipement, EquipementDetail, TypeEquipement, EtatEquipement, CategorieEquipement } from '@/types/equipment'
import equipmentService from '@/services/equipmentService'
import api from '@/lib/axiosConfig'
import Swal from 'sweetalert2'
import { useApiError } from '@/hooks/useApiError'
import { AlerteErreur } from '@/components/AlerteErreur'

interface EquipmentModalProps {
    show: boolean
    onHide: () => void
    equipmentToEdit: EquipementDetail | null
    reloadList: () => void
}



export default function EquipmentModal({ show, onHide, equipmentToEdit, reloadList }: EquipmentModalProps) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [validated, setValidated] = useState(false)
    const [vehicles, setVehicles] = useState<any[]>([])
    const { error, execute, clearError } = useApiError()
    const [formData, setFormData] = useState<CreateEquipement>({
        nom: '',
        codeInventaire: '',
        type: 'Mobile',
        categorie: 'Autre',
        etat: 'Neuf',
        dureeVieTheoriqueEnMois: 60,
        seuilUsureUtilisations: 500,
        seuilRemplacementUtilisations: 1000
    })

    useEffect(() => {
        if (show) {
            loadVehicles()
            if (equipmentToEdit) {
                setFormData({
                    nom: equipmentToEdit.nom,
                    codeInventaire: equipmentToEdit.codeInventaire,
                    type: equipmentToEdit.type,
                    categorie: equipmentToEdit.categorie,
                    etat: equipmentToEdit.etat,
                    marque: equipmentToEdit.marque,
                    modele: equipmentToEdit.modele,
                    numeroSerie: equipmentToEdit.numeroSerie,
                    fournisseur: equipmentToEdit.fournisseur,
                    imageUrl: equipmentToEdit.imageUrl,
                    documentsUrls: equipmentToEdit.documentsUrls,
                    dateAchat: equipmentToEdit.dateAchat?.split('T')[0],
                    prixAchat: equipmentToEdit.prixAchat,
                    dateFinGarantie: equipmentToEdit.dateFinGarantie?.split('T')[0],
                    dureeVieTheoriqueEnMois: equipmentToEdit.dureeVieTheoriqueEnMois,
                    seuilUsureUtilisations: equipmentToEdit.seuilUsureUtilisations,
                    seuilRemplacementUtilisations: equipmentToEdit.seuilRemplacementUtilisations,
                    vehiculeId: equipmentToEdit.vehiculeId,
                    notes: equipmentToEdit.notesGenerales
                })
            } else {
                setFormData({
                    nom: '',
                    codeInventaire: '',
                    type: 'Mobile',
                    categorie: 'Autre',
                    etat: 'Neuf',
                    dureeVieTheoriqueEnMois: 60,
                    seuilUsureUtilisations: 500,
                    seuilRemplacementUtilisations: 1000
                })
            }
        }
    }, [show, equipmentToEdit])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        clearError()
        const imageUrl = await execute(() => equipmentService.uploadImage(file))
        if (imageUrl) {
            setFormData(prev => ({ ...prev, imageUrl }))
        }
        setUploading(false)
    }

    const loadVehicles = async () => {
        const res = await execute(() => api.get('/vehicules'))
        if (res) {
            setVehicles(res.data.data || [])
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        e.stopPropagation()
        const form = e.currentTarget
        if (!form.checkValidity()) {
            setValidated(true)
            return
        }
        setLoading(true)

        // Nettoyage des données pour éviter les erreurs de type sur le backend
        const submissionData = {
            ...formData,
            dateAchat: formData.dateAchat === '' ? null : formData.dateAchat,
            dateFinGarantie: formData.dateFinGarantie === '' ? null : formData.dateFinGarantie
        }

        const success = await execute(async () => {
            if (equipmentToEdit) {
                await equipmentService.update(equipmentToEdit.id, { ...submissionData, id: equipmentToEdit.id } as any)
                Swal.fire('Succès', 'Équipement mis à jour', 'success')
            } else {
                await equipmentService.create(submissionData as any)
                Swal.fire('Succès', 'Nouvel équipement créé', 'success')
            }
            reloadList()
            onHide()
            return true
        })

        setLoading(false)
    }

    return (
        <Modal show={show} onHide={onHide} size="lg" centered border-0>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>{equipmentToEdit ? 'Modifier' : 'Nouveau'} Équipement</Modal.Title>
            </Modal.Header>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                    {error && (
                        <AlerteErreur
                            status={error.status}
                            message={error.message}
                            onDismiss={clearError}
                            className="mb-4"
                        />
                    )}
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Nom de l'objet <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    required
                                    value={formData.nom}
                                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                                    placeholder="ex: Extincteur CO2 5kg"
                                />
                                <Form.Control.Feedback type="invalid">Le nom de l'équipement est obligatoire.</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Code Inventaire <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    required
                                    value={formData.codeInventaire}
                                    onChange={e => setFormData({ ...formData, codeInventaire: e.target.value })}
                                    placeholder="ex: EQ-2024-001"
                                />
                                <Form.Control.Feedback type="invalid">Le code inventaire est obligatoire.</Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Type *</Form.Label>
                                <Form.Select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as TypeEquipement })}
                                >
                                    <option value="Fixe">Fixe (Installé dans véhicule)</option>
                                    <option value="Mobile">Mobile (Gestion Pool)</option>
                                    <option value="Obligatoire">Obligatoire (Sécurité)</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Catégorie *</Form.Label>
                                <Form.Select
                                    value={formData.categorie}
                                    onChange={e => setFormData({ ...formData, categorie: e.target.value as CategorieEquipement })}
                                >
                                    <option value="Securite">Sécurité</option>
                                    <option value="Mecanique">Mécanique</option>
                                    <option value="Electronique">Électronique</option>
                                    <option value="Outillage">Outillage</option>
                                    <option value="Autre">Autre</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>État Initial *</Form.Label>
                                <Form.Select
                                    value={formData.etat}
                                    onChange={e => setFormData({ ...formData, etat: e.target.value as EtatEquipement })}
                                >
                                    <option value="Neuf">Neuf</option>
                                    <option value="Bon">Bon</option>
                                    <option value="Use">Usé</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Marque</Form.Label>
                                <Form.Control
                                    value={formData.marque || ''}
                                    onChange={e => setFormData({ ...formData, marque: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Numéro de Série</Form.Label>
                                <Form.Control
                                    value={formData.numeroSerie || ''}
                                    onChange={e => setFormData({ ...formData, numeroSerie: e.target.value })}
                                    placeholder="S/N"
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Fournisseur</Form.Label>
                                <Form.Control
                                    value={formData.fournisseur || ''}
                                    onChange={e => setFormData({ ...formData, fournisseur: e.target.value })}
                                    placeholder="Nom du fournisseur"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Prix d'Achat (DT) <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="number"
                                    required
                                    min="0"
                                    step="0.001"
                                    value={formData.prixAchat || ''}
                                    onChange={e => setFormData({ ...formData, prixAchat: Number(e.target.value) })}
                                    placeholder="Obligatoire pour KPI"
                                />
                                <Form.Control.Feedback type="invalid">Le prix d'achat est obligatoire.</Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Photo de l'Équipement</Form.Label>
                                <div className="d-flex align-items-center gap-3 p-3 border rounded bg-light bg-opacity-50">
                                    <div
                                        className="rounded border d-flex align-items-center justify-content-center bg-white overflow-hidden"
                                        style={{ width: '100px', height: '100px', minWidth: '100px' }}
                                    >
                                        {formData.imageUrl ? (
                                            <img
                                                src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:5000'}${formData.imageUrl}`}
                                                alt="Preview"
                                                className="w-100 h-100 object-fit-cover"
                                            />
                                        ) : (
                                            <i className="ri-image-add-line fs-24 text-muted"></i>
                                        )}
                                    </div>
                                    <div className="flex-grow-1">
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                        />
                                        <Form.Text className="text-muted">
                                            {uploading ? (
                                                <><Spinner size="sm" className="me-1" /> Téléchargement en cours...</>
                                            ) : (
                                                "JPG, PNG ou WEBP. Taille conseillée : 400x400px"
                                            )}
                                        </Form.Text>
                                    </div>
                                    {formData.imageUrl && (
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                        >
                                            <i className="ri-delete-bin-line"></i>
                                        </Button>
                                    )}
                                </div>
                            </Form.Group>
                        </Col>

                        {(formData.type === 'Fixe' || formData.type === 'Obligatoire') && (
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Véhicule Associé (Obligatoire)</Form.Label>
                                    <Form.Select
                                        required
                                        value={formData.vehiculeId || ''}
                                        onChange={e => setFormData({ ...formData, vehiculeId: Number(e.target.value) || undefined })}
                                    >
                                        <option value="">Sélectionner un véhicule</option>
                                        {vehicles.map(v => (
                                            <option key={v.idVehicule} value={v.idVehicule}>
                                                {v.immatriculation} - {v.marque} {v.modele}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        )}

                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Date Achat</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.dateAchat || ''}
                                    onChange={e => setFormData({ ...formData, dateAchat: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Fin Garantie</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.dateFinGarantie || ''}
                                    onChange={e => setFormData({ ...formData, dateFinGarantie: e.target.value })}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Durée Vie Théorique (Mois)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.dureeVieTheoriqueEnMois}
                                    onChange={e => setFormData({ ...formData, dureeVieTheoriqueEnMois: Number(e.target.value) })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Seuil Usure (Utilisations)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.seuilUsureUtilisations || ''}
                                    onChange={e => setFormData({ ...formData, seuilUsureUtilisations: Number(e.target.value) })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Seuil Remplacement (Utilisations)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.seuilRemplacementUtilisations || ''}
                                    onChange={e => setFormData({ ...formData, seuilRemplacementUtilisations: Number(e.target.value) })}
                                    placeholder="ex: 1000 missions"
                                />
                            </Form.Group>
                        </Col>

                        {equipmentToEdit && equipmentToEdit.dateEstimationRemplacement && (
                            <Col md={12}>
                                <div className="p-2 bg-soft-info rounded border border-info border-opacity-25 d-flex align-items-center mb-2">
                                    <i className="ri-lightbulb-flash-line me-2 text-info fs-20"></i>
                                    <span className="small">
                                        <strong>Estimation du remplacement :</strong> {new Date(equipmentToEdit.dateEstimationRemplacement).toLocaleDateString()} (basée sur l'usage actuel).
                                    </span>
                                </div>
                            </Col>
                        )}

                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Notes & Observations</Form.Label>
                                <Form.Control
                                    as="textarea" rows={3}
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="outline-secondary" onClick={onHide} disabled={loading}>
                        Annuler
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner size="sm" className="me-1" /> : null}
                        {equipmentToEdit ? 'Enregistrer les modifications' : 'Créer l\'équipement'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}
