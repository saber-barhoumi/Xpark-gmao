import { useState, useEffect, useCallback } from 'react'
import { Badge, Button, Card, Col, Row, Spinner, Alert } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import authService from '@/services/authService'
import api from '@/lib/axiosConfig'
import Swal from 'sweetalert2'
import VehiculeWizard from './components/VehiculeWizard'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useApiError } from '@/hooks/useApiError'
import { AlerteErreur } from '@/components/AlerteErreur'
import useBulkSelection from '@/hooks/useBulkSelection'
import BulkDeleteButtons from '@/components/table/BulkDeleteButtons'



const STATUT_COLORS: Record<string, string> = {
    ACTIF: 'success',
    EN_MAINTENANCE: 'warning',
    HORS_SERVICE: 'danger',
    VENDU: 'secondary',
}

interface Vehicule {
    idVehicule: number
    immatriculation: string
    marque: string
    modele: string
    anneeConstruction: number
    typeCarburant: string
    typeVehicule: string
    kilometrage: number
    statut: string
    couleur?: string
    nombrePlaces?: number
    puissanceFiscale?: number
    consommationMoyenne?: number
    valeurAcquisition?: number
    dateAcquisition?: string
    dateDerniereRevision?: string
    dateProchaineRevision?: string
    actif: boolean
    dateCreation: string
    chargeUtileKg?: number
}



export default function VehiculesPage() {
    const [vehicules, setVehicules] = useState<Vehicule[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const { error, execute, clearError } = useApiError()
    const [page, setPage] = useState(1)

    // RBAC
    const currentUser = authService.getCurrentUser()
    const isAdmin = currentUser?.role === 'ADMIN'
    const isGestionnaire = currentUser?.role === 'GESTIONNAIRE'
    const canWrite = isAdmin

    // Modal Wizard
    const [showWizard, setShowWizard] = useState(false)
    const [vehiculeToEdit, setVehiculeToEdit] = useState<Vehicule | null>(null)

    // Sélection multiple (suppression en masse)
    const [deleting, setDeleting] = useState(false)
    const sel = useBulkSelection(vehicules, v => v.idVehicule)

    const load = useCallback(async () => {
        setLoading(true)
        clearError()
        const res = await execute(() => api.get('/vehicules', {
            params: { page, pageSize: 20 }
        }))

        if (res) {
            const data = res.data
            const items = data?.data ?? data?.items ?? []
            const count = data?.totalCount ?? data?.total ?? items.length
            setVehicules(items)
            setTotal(count)
        }
        setLoading(false)
    }, [page, execute, clearError])

    useEffect(() => { load() }, [load])

    const handleDelete = async (id: number, immat: string) => {
        const result = await Swal.fire({
            title: `Supprimer ${immat} ?`,
            text: 'Le véhicule sera désactivé.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Supprimer',
            cancelButtonText: 'Annuler',
        })
        if (result.isConfirmed) {
            clearError()
            const success = await execute(() => api.delete(`/vehicules/${id}`))
            if (success) {
                await load()
                Swal.fire('Supprimé', 'Le véhicule a été supprimé.', 'success')
            }
        }
    }

    // Suppression en masse : réutilise le endpoint DELETE unitaire existant
    const deleteMany = async (ids: number[]) => {
        setDeleting(true)
        clearError()
        try {
            await Promise.all(ids.map(id => api.delete(`/vehicules/${id}`)))
            sel.clear()
            await load()
            Swal.fire('Supprimé', `${ids.length} véhicule(s) supprimé(s).`, 'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Suppression partielle ou impossible.', 'error')
            await load()
        } finally { setDeleting(false) }
    }

    const openCreate = () => {
        setVehiculeToEdit(null)
        setShowWizard(true)
    }

    const openEdit = (v: Vehicule) => {
        setVehiculeToEdit(v)
        setShowWizard(true)
    }

    return (
        <>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="ri:car-line" className="me-2 text-primary" />
                        Gestion des Véhicules
                    </h4>
                    <p className="text-muted mb-0">
                        {total} véhicule(s) enregistré(s)
                        {!canWrite && (
                            <Badge bg="info" className="ms-2">
                                <IconifyIcon icon="ri:eye-line" className="me-1" />
                                Lecture seule
                            </Badge>
                        )}
                    </p>
                </Col>
                <Col xs="auto" className="d-flex gap-2 flex-wrap">
                    {canWrite && (
                        <BulkDeleteButtons
                            selectedCount={sel.count} totalCount={vehicules.length}
                            label="véhicule(s)" deleting={deleting}
                            onDeleteSelected={() => deleteMany(sel.selectedIds)}
                            onDeleteAll={() => deleteMany(vehicules.map(v => v.idVehicule))}
                        />
                    )}
                    {canWrite && (
                        <Button variant="primary" onClick={openCreate}>
                            <IconifyIcon icon="ri:add-line" className="me-1" />
                            Ajouter un véhicule
                        </Button>
                    )}
                    {(isGestionnaire || !canWrite) && !isAdmin && (
                        <span className="text-muted small fst-italic">
                            <IconifyIcon icon="ri:lock-line" className="me-1" />
                            Contactez un administrateur pour ajouter un véhicule.
                        </span>
                    )}
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
            ) : vehicules.length === 0 ? (
                <Card className="text-center py-5">
                    <Card.Body>
                        <IconifyIcon icon="ri:car-line" className="fs-1 text-muted mb-2" />
                        <p className="text-muted fw-semibold">Aucun véhicule enregistré</p>
                        {canWrite ? (
                            <Button variant="primary" onClick={openCreate}>
                                Ajouter le premier véhicule
                            </Button>
                        ) : (
                            <p className="text-muted small">Demandez à votre administrateur d'ajouter des véhicules.</p>
                        )}
                    </Card.Body>
                </Card>
            ) : (
                <Card>
                    <div className="table-responsive">
                        <table className="table table-hover table-centered mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    {canWrite && (
                                        <th style={{ width: 34 }}>
                                            <input type="checkbox" className="form-check-input"
                                                checked={sel.allSelected} onChange={sel.toggleAll}
                                                title="Tout sélectionner" />
                                        </th>
                                    )}
                                    <th>Immatriculation</th>
                                    <th>Marque / Modèle</th>
                                    <th>Type / Carburant</th>
                                    <th>Année</th>
                                    <th>Kilométrage</th>
                                    <th>Puissance</th>
                                    <th>Statut</th>
                                    {canWrite && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {vehicules.map(v => (
                                    <tr key={v.idVehicule}>
                                        {canWrite && (
                                            <td>
                                                <input type="checkbox" className="form-check-input"
                                                    checked={sel.isSelected(v.idVehicule)}
                                                    onChange={() => sel.toggle(v.idVehicule)} />
                                            </td>
                                        )}
                                        <td>
                                            <strong className="text-primary">{v.immatriculation}</strong>
                                        </td>
                                        <td>
                                            <div className="fw-semibold">{v.marque} {v.modele}</div>
                                            {v.couleur && <small className="text-muted">{v.couleur}</small>}
                                        </td>
                                        <td>
                                            <Badge bg="light" text="dark" className="d-block mb-1">{v.typeVehicule}</Badge>
                                            <span className="text-muted small">{v.typeCarburant}</span>
                                        </td>
                                        <td>{v.anneeConstruction}</td>
                                        <td>{v.kilometrage?.toLocaleString('fr-FR')} km</td>
                                        <td>{v.puissanceFiscale ? `${v.puissanceFiscale} CV` : '-'}</td>
                                        <td>
                                            <Badge bg={STATUT_COLORS[v.statut] ?? 'secondary'}>
                                                {v.statut?.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        {canWrite && (
                                            <td>
                                                <Button
                                                    variant="light" size="sm" className="me-1 text-primary"
                                                    onClick={() => openEdit(v)} title="Modifier/Voir"
                                                >
                                                    <IconifyIcon icon="ri:edit-2-line" />
                                                </Button>
                                                <Button
                                                    variant="light" size="sm" className="text-danger"
                                                    onClick={() => handleDelete(v.idVehicule, v.immatriculation)} title="Supprimer"
                                                >
                                                    <IconifyIcon icon="ri:delete-bin-line" />
                                                </Button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {total > 20 && (
                <div className="d-flex justify-content-center gap-2 mt-3">
                    <Button variant="outline-secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        <IconifyIcon icon="ri:arrow-left-s-line" /> Précédent
                    </Button>
                    <span className="align-self-center text-muted">Page {page}</span>
                    <Button variant="outline-secondary" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>
                        Suivant <IconifyIcon icon="ri:arrow-right-s-line" />
                    </Button>
                </div>
            )}

            {/* Modale Wizard pour la Création / Modification */}
            <ErrorBoundary>
                <VehiculeWizard
                    show={showWizard}
                    onHide={() => setShowWizard(false)}
                    vehiculeToEdit={vehiculeToEdit}
                    reloadList={load}
                />
            </ErrorBoundary>
        </>
    )
}
