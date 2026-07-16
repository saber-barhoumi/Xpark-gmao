import { useState, useEffect, useCallback } from 'react'
import { Badge, Button, Card, Col, Row, Spinner, Alert, Form, InputGroup } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import authService from '@/services/authService'
import equipmentService from '@/services/equipmentService'
import Swal from 'sweetalert2'
import { EquipementListItem, FilterEquipements, TypeEquipement, EtatEquipement, CategorieEquipement, EquipementDetail } from '@/types/equipment'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import EquipmentModal from './components/EquipmentModal'
import { useNavigate } from 'react-router-dom'
import useBulkSelection from '@/hooks/useBulkSelection'
import BulkDeleteButtons from '@/components/table/BulkDeleteButtons'

const ETAT_COLORS: Record<string, string> = {
    Neuf: 'success',
    Bon: 'primary',
    Use: 'warning',
    ARemplacer: 'danger',
    HorsService: 'secondary',
}

const TYPE_ICONS: Record<string, string> = {
    Fixe: 'ri:anchor-line',
    Mobile: 'ri:truck-line',
    Obligatoire: 'ri:shield-check-line',
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'

export default function EquipementsPage() {
    const navigate = useNavigate()
    const [equipements, setEquipements] = useState<EquipementListItem[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<FilterEquipements>({
        page: 1,
        limit: 10,
        sortOrder: 'desc',
        sortBy: 'IdEquipement'
    })

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [equipmentToEdit, setEquipmentToEdit] = useState<EquipementDetail | null>(null)

    // Sélection multiple (désactivation en masse)
    const [deleting, setDeleting] = useState(false)
    const sel = useBulkSelection(equipements, eq => eq.id)

    const currentUser = authService.getCurrentUser()
    const canWrite = currentUser?.role === 'ADMIN' || currentUser?.role === 'GESTIONNAIRE'

    const openCreate = () => {
        setEquipmentToEdit(null)
        setShowModal(true)
    }

    const openEdit = async (eq: EquipementListItem) => {
        try {
            const detail = await equipmentService.getById(eq.id)
            setEquipmentToEdit(detail)
            setShowModal(true)
        } catch (err) {
            Swal.fire('Erreur', 'Impossible de charger les détails de l\'équipement', 'error')
        }
    }

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await equipmentService.getAll(filters)
            setEquipements(data.data)
            setTotal(data.total)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Impossible de charger les équipements.')
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => { load() }, [load])

    const handleDelete = async (id: number, nom: string) => {
        const result = await Swal.fire({
            title: `Désactiver ${nom} ?`,
            text: 'L\'équipement ne sera plus disponible pour les missions.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Désactiver',
            cancelButtonText: 'Annuler',
        })
        if (result.isConfirmed) {
            try {
                await equipmentService.delete(id)
                await load()
                Swal.fire('Désactivé', '', 'success')
            } catch (err) {
                Swal.fire('Erreur', 'Impossible de désactiver l\'équipement', 'error')
            }
        }
    }

    // Désactivation en masse : réutilise equipmentService.delete unitaire
    const deleteMany = async (ids: number[]) => {
        setDeleting(true)
        try {
            await Promise.all(ids.map(id => equipmentService.delete(id)))
            sel.clear()
            await load()
            Swal.fire('Désactivé', `${ids.length} équipement(s) désactivé(s).`, 'success')
        } catch {
            Swal.fire('Erreur', 'Désactivation partielle ou impossible.', 'error')
            await load()
        } finally { setDeleting(false) }
    }

    const handleFilterChange = (field: keyof FilterEquipements, value: any) => {
        setFilters(prev => ({ ...prev, [field]: value, page: 1 }))
    }

    return (
        <>
            <PageBreadcrumb title='Gestion des Équipements' />

            <Row className="mb-4">
                <Col xl={3} md={6}>
                    <Card className="bg-primary text-white border-0">
                        <Card.Body>
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <h5 className="mb-1">Total Équipements</h5>
                                    <h3 className="mb-0">{total}</h3>
                                </div>
                                <div className="flex-shrink-0">
                                    <IconifyIcon icon="ri:tools-line" className="fs-32" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                {/* KPIs will be added here once we have them from the API */}
            </Row>

            <Card className="mb-4 shadow-sm border-0">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={4}>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-0">
                                    <IconifyIcon icon="ri:search-line" />
                                </InputGroup.Text>
                                <Form.Control 
                                    className="bg-light border-0" 
                                    placeholder="Rechercher (Nom, Code, Marque...)" 
                                    value={filters.search || ''}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={2}>
                            <Form.Select 
                                className="bg-light border-0"
                                value={filters.type || ''}
                                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                            >
                                <option value="">Tous les Types</option>
                                <option value="Fixe">Fixe</option>
                                <option value="Mobile">Mobile</option>
                                <option value="Obligatoire">Obligatoire</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Select 
                                className="bg-light border-0"
                                value={filters.etat || ''}
                                onChange={(e) => handleFilterChange('etat', e.target.value || undefined)}
                            >
                                <option value="">Tous les États</option>
                                <option value="Neuf">Neuf</option>
                                <option value="Bon">Bon</option>
                                <option value="Use">Usé</option>
                                <option value="ARemplacer">À Remplacer</option>
                                <option value="HorsService">Hors Service</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Select 
                                className="bg-light border-0"
                                value={filters.categorie || ''}
                                onChange={(e) => handleFilterChange('categorie', e.target.value || undefined)}
                            >
                                <option value="">Toutes Catégories</option>
                                <option value="Securite">Sécurité</option>
                                <option value="Mecanique">Mécanique</option>
                                <option value="Electroniques">Électronique</option>
                                <option value="Outillage">Outillage</option>
                                <option value="Autre">Autre</option>
                            </Form.Select>
                        </Col>
                        <Col md={2} className="text-end">
                            {canWrite && (
                                <>
                                    <div className="d-flex gap-2 justify-content-end mb-2">
                                        <BulkDeleteButtons
                                            selectedCount={sel.count} totalCount={0}
                                            label="équipement(s)" deleting={deleting}
                                            onDeleteSelected={() => deleteMany(sel.selectedIds)}
                                            onDeleteAll={async () => {}}
                                            warning="Les équipements seront désactivés."
                                        />
                                    </div>
                                    <Button variant="primary" className="w-100 shadow-sm" onClick={openCreate}>
                                        <IconifyIcon icon="ri:add-line" className="me-1" />
                                        Nouvel Objet
                                    </Button>
                                </>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger" className="border-0 shadow-sm">{error}</Alert>}

            <Card className="border-0 shadow-sm">
                <div className="table-responsive">
                    <table className="table table-hover table-centered mb-0 align-middle">
                        <thead className="bg-light text-muted small text-uppercase">
                            <tr>
                                {canWrite && (
                                    <th style={{ width: 34 }}>
                                        <input type="checkbox" className="form-check-input"
                                            checked={sel.allSelected} onChange={sel.toggleAll}
                                            title="Tout sélectionner" />
                                    </th>
                                )}
                                <th className="ps-4">Équipement</th>
                                <th>Type & Catégorie</th>
                                <th>Véhicule Associé</th>
                                <th>Statistiques</th>
                                <th>État</th>
                                <th className="pe-4 text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-5">
                                        <Spinner animation="border" variant="primary" />
                                    </td>
                                </tr>
                            ) : equipements.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-5">
                                        <div className="text-muted">
                                            <IconifyIcon icon="ri:tools-line" className="fs-48 mb-3 d-block mx-auto opacity-25" />
                                            <p className="fw-semibold">Aucun équipement trouvé</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                equipements.map(eq => (
                                    <tr key={eq.id}>
                                        {canWrite && (
                                            <td>
                                                <input type="checkbox" className="form-check-input"
                                                    checked={sel.isSelected(eq.id)}
                                                    onChange={() => sel.toggle(eq.id)} />
                                            </td>
                                        )}
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className="avatar-sm rounded me-3 d-flex align-items-center justify-content-center bg-soft-primary overflow-hidden">
                                                    {eq.imageUrl ? (
                                                        <img 
                                                            src={eq.imageUrl.startsWith('http') ? eq.imageUrl : `${API_URL.replace('/api', '')}${eq.imageUrl}`} 
                                                            alt="" 
                                                            className="img-fluid w-100 h-100 object-fit-cover" 
                                                        />
                                                    ) : (
                                                        <IconifyIcon icon={TYPE_ICONS[eq.type]} className="fs-20 text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h6 className="mb-0 text-dark">{eq.nom}</h6>
                                                    <small className="text-muted">{eq.codeInventaire}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="small fw-semibold text-dark">{eq.type}</div>
                                            <div className="text-muted small">{eq.categorie}</div>
                                        </td>
                                        <td>
                                            {eq.immatriculationVehicule ? (
                                                <div className="d-flex align-items-center">
                                                    <IconifyIcon icon="ri:car-line" className="text-muted me-1" />
                                                    <span className="fw-semibold text-primary">{eq.immatriculationVehicule}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted small italic">Non assigné (Pool)</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="small">
                                                <IconifyIcon icon="ri:refresh-line" className="text-muted me-1" />
                                                {eq.nombreUtilisations} utilisations
                                            </div>
                                            <div className="small text-muted">
                                                {eq.heuresUtilisation} heures d'usage
                                            </div>
                                        </td>
                                        <td>
                                            <Badge bg={ETAT_COLORS[eq.etat]} className="rounded-pill px-2">
                                                {eq.etat}
                                            </Badge>
                                        </td>
                                        <td className="pe-4 text-end">
                                            <Button 
                                                variant="light" size="sm" className="me-1 text-primary shadow-none border-0 bg-transparent"
                                                onClick={() => navigate(`/gestion/equipements/${eq.id}`)}
                                            >
                                                <IconifyIcon icon="ri:eye-line" className="fs-18" />
                                            </Button>
                                            <Button 
                                                variant="light" size="sm" className="me-1 text-info shadow-none border-0 bg-transparent"
                                                onClick={() => openEdit(eq)}
                                            >
                                                <IconifyIcon icon="ri:edit-2-line" className="fs-18" />
                                            </Button>
                                            {canWrite && (
                                                <Button 
                                                    variant="light" size="sm" className="text-danger shadow-none border-0 bg-transparent"
                                                    onClick={() => handleDelete(eq.id, eq.nom)}
                                                >
                                                    <IconifyIcon icon="ri:delete-bin-line" className="fs-18" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {total > filters.limit && (
                    <Card.Footer className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                        <div className="small text-muted">
                            Affichage de {equipements.length} sur {total} équipements
                        </div>
                        <div className="d-flex gap-2">
                            <Button 
                                variant="outline-light" size="sm" className="text-dark border-0 shadow-none" 
                                disabled={filters.page === 1}
                                onClick={() => handleFilterChange('page', filters.page - 1)}
                            >
                                <IconifyIcon icon="ri:arrow-left-s-line" className="me-1" /> Précédent
                            </Button>
                            <span className="bg-soft-primary px-3 py-1 rounded small fw-bold text-primary">
                                Page {filters.page}
                            </span>
                            <Button 
                                variant="outline-light" size="sm" className="text-dark border-0 shadow-none" 
                                disabled={filters.page * filters.limit >= total}
                                onClick={() => handleFilterChange('page', filters.page + 1)}
                            >
                                Suivant <IconifyIcon icon="ri:arrow-right-s-line" className="ms-1" />
                            </Button>
                        </div>
                    </Card.Footer>
                )}
            </Card>

            <EquipmentModal 
                show={showModal}
                onHide={() => setShowModal(false)}
                equipmentToEdit={equipmentToEdit}
                reloadList={load}
            />
        </>
    )
}
