import { useState, useEffect, useCallback, useMemo } from 'react'
import { Badge, Button, Card, Col, Modal, Row, Form, Spinner, Alert, InputGroup, OverlayTrigger, Popover, Tooltip } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import pieceRechangeService, { PieceRechange, CreatePieceRechangeDto, UpdatePieceRechangeDto, CATEGORIES_PIECE } from '@/services/pieceRechangeService'
import Swal from 'sweetalert2'
import useBulkSelection from '@/hooks/useBulkSelection'
import BulkDeleteButtons from '@/components/table/BulkDeleteButtons'

export default function PiecesRechangePage() {
    const [pieces, setPieces] = useState<PieceRechange[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filterCategorie, setFilterCategorie] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const [uploading, setUploading] = useState(false)

    const API_BASE_URL = (import.meta as any).env?.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:5000'

    // Modal Création / Edition
    const [showModal, setShowModal] = useState(false)
    const [editPiece, setEditPiece] = useState<PieceRechange | null>(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<CreatePieceRechangeDto>({
        reference: '',
        designation: '',
        categorie: 'AUTRE',
        stockActuel: 0,
        stockMinimum: 5,
        stockMaximum: 100,
        prixUnitaire: 0,
        imageUrl: '',
    })
    const [validated, setValidated] = useState(false)

    // Sélection multiple (suppression en masse)
    const [deleting, setDeleting] = useState(false)

    // Modal Ajuster Stock
    const [showStockModal, setShowStockModal] = useState(false)
    const [selectedPiece, setSelectedPiece] = useState<PieceRechange | null>(null)
    const [stockDelta, setStockDelta] = useState(0)
    const [updatingStock, setUpdatingStock] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await pieceRechangeService.getAll({ categorie: filterCategorie || undefined, page, pageSize: 150 })
            setPieces(data.items || [])
            setTotal(data.total || 0)
        } catch {
            setError('Impossible de charger les pièces.')
        } finally {
            setLoading(false)
        }
    }, [filterCategorie, page])

    useEffect(() => { load() }, [load])

    // Filtrage local pour la recherche (Code-barres ou Désignation)
    const filteredPieces = useMemo(() => {
        if (!searchQuery) return pieces
        const q = searchQuery.toLowerCase()
        return pieces.filter(p =>
            (p.reference?.toLowerCase().includes(q)) ||
            (p.designation?.toLowerCase().includes(q))
        )
    }, [pieces, searchQuery])

    // Sélection multiple sur la liste filtrée
    const sel = useBulkSelection(filteredPieces, p => p.idPiece)

    const openCreate = () => {
        setEditPiece(null)
        setForm({
            reference: '',
            designation: '',
            categorie: 'AUTRE',
            stockActuel: 0,
            stockMinimum: 5,
            stockMaximum: 100,
            prixUnitaire: 0,
            imageUrl: '',
        })
        setValidated(false)
        setShowModal(true)
    }

    const openEdit = (p: PieceRechange) => {
        setEditPiece(p)
        setForm({
            reference: p.reference,
            designation: p.designation,
            categorie: p.categorie,
            stockActuel: p.stockActuel,
            stockMinimum: p.stockMinimum,
            stockMaximum: p.stockMaximum,
            prixUnitaire: p.prixUnitaire,
            fournisseur: p.fournisseur,
            imageUrl: p.imageUrl || '',
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
        try {
            if (editPiece) {
                const updateDto: UpdatePieceRechangeDto = { ...form }
                await pieceRechangeService.update(editPiece.idPiece, updateDto)
            } else {
                await pieceRechangeService.create(form)
            }
            setShowModal(false)
            await load()
            Swal.fire('Succès', 'Pièce enregistrée avec succès.', 'success')
        } catch {
            Swal.fire('Erreur', 'Impossible d\'enregistrer la pièce.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const imageUrl = await pieceRechangeService.uploadImage(file)
            setForm(f => ({ ...f, imageUrl }))
        } catch {
            Swal.fire('Erreur', 'Impossible d\'uploader l\'image.', 'error')
        } finally {
            setUploading(false)
        }
    }

    const openStockModal = (piece: PieceRechange) => {
        setSelectedPiece(piece)
        setStockDelta(0)
        setShowStockModal(true)
    }

    const handleAjusterStock = async () => {
        if (!selectedPiece || stockDelta === 0) return
        setUpdatingStock(true)
        try {
            const result = await pieceRechangeService.ajusterStock(selectedPiece.idPiece, stockDelta)
            setShowStockModal(false)
            await load()
            Swal.fire('Stock mis à jour', `Nouveau stock : ${result.stockActuel} unités`, 'success')
        } catch {
            Swal.fire('Erreur', 'Impossible de mettre à jour le stock.', 'error')
        } finally {
            setUpdatingStock(false)
        }
    }

    // Suppression en masse : réutilise pieceRechangeService.delete unitaire
    const deleteMany = async (ids: number[]) => {
        setDeleting(true)
        try {
            await Promise.all(ids.map(id => pieceRechangeService.delete(id)))
            sel.clear()
            await load()
            Swal.fire('Supprimées', `${ids.length} pièce(s) supprimée(s).`, 'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Suppression partielle ou impossible.', 'error')
            await load()
        } finally { setDeleting(false) }
    }

    const handleDelete = async (id: number, designation: string) => {
        const result = await Swal.fire({
            title: `Désactiver ${designation} ?`,
            text: 'La pièce sera désactivée.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Désactiver',
            cancelButtonText: 'Annuler',
        })
        if (result.isConfirmed) {
            try {
                await pieceRechangeService.delete(id)
                await load()
                Swal.fire('Désactivée', 'La pièce a été désactivée.', 'success')
            } catch (err: any) {
                const msg = err.response?.data?.message || err.response?.status === 403
                    ? 'Accès refusé. Seul un ADMIN peut désactiver.'
                    : 'Impossible de désactiver la pièce.'
                Swal.fire('Erreur', msg, 'error')
            }
        }
    }

    const lowStockCount = useMemo(() => pieces.filter(p => p.stockActuel <= p.stockMinimum).length, [pieces])

    const getPieceImage = (p: PieceRechange) => {
        if (!p.imageUrl) return `https://api.dicebear.com/7.x/initials/svg?seed=${p.reference || 'part'}&backgroundColor=f1f5f9&fontSize=32`
        if (p.imageUrl.startsWith('http')) return p.imageUrl
        return `${API_BASE_URL}${p.imageUrl}`
    }

    return (
        <>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="ri:settings-4-line" className="me-2 text-success" />
                        Gestion du Stock Pièces
                    </h4>
                    <p className="text-muted mb-0">
                        {total} références au catalogue
                        {lowStockCount > 0 && (
                            <Badge bg="danger" className="ms-2">
                                <IconifyIcon icon="ri:error-warning-line" className="me-1" />
                                {lowStockCount} ALERTES STOCK
                            </Badge>
                        )}
                    </p>
                </Col>
                <Col xs="auto" className="d-flex gap-2 flex-wrap">
                    <InputGroup size="sm" style={{ width: 250 }}>
                        <InputGroup.Text className="bg-white border-end-0">
                            <IconifyIcon icon="ri:barcode-line" />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Recherche / Code-barres..."
                            className="border-start-0"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </InputGroup>

                    <Form.Select size="sm" value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)} style={{ width: 160 }}>
                        <option value="">Toutes catégories</option>
                        {CATEGORIES_PIECE.map(c => <option key={c} value={c}>{c}</option>)}
                    </Form.Select>
                    <BulkDeleteButtons
                        selectedCount={sel.count} totalCount={filteredPieces.length}
                        label="pièce(s)" deleting={deleting}
                        onDeleteSelected={() => deleteMany(sel.selectedIds)}
                        onDeleteAll={() => deleteMany(filteredPieces.map(p => p.idPiece))}
                    />
                    <Button variant="success" size="sm" onClick={openCreate} className="px-3">
                        <IconifyIcon icon="ri:add-line" className="me-1" />
                        Ajouter
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>
            ) : pieces.length === 0 ? (
                <Card className="text-center py-5 border-0 shadow-sm">
                    <Card.Body>
                        <IconifyIcon icon="ri:list-settings-line" className="fs-1 text-muted mb-2" />
                        <p className="text-muted">Aucune pièce trouvée</p>
                        <Button variant="success" size="sm" onClick={openCreate}>Créer une pièce</Button>
                    </Card.Body>
                </Card>
            ) : (
                <Card className="border-0 shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-muted small text-uppercase">
                                <tr>
                                    <th style={{ width: 34 }}>
                                        <input type="checkbox" className="form-check-input"
                                            checked={sel.allSelected} onChange={sel.toggleAll}
                                            title="Tout sélectionner" />
                                    </th>
                                    <th>Image</th>
                                    <th>Référence</th>
                                    <th>Désignation</th>
                                    <th>Stock act.</th>
                                    <th>Min/Max</th>
                                    <th>Prix Unitaire</th>
                                    <th className="text-end px-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPieces.map(p => {
                                    const isLowStock = p.stockActuel <= p.stockMinimum;
                                    const isCritical = p.stockActuel === 0;

                                    return (
                                        <tr key={p.idPiece} style={isLowStock ? { backgroundColor: 'rgba(255, 193, 7, 0.1)' } : {}}>
                                            <td>
                                                <input type="checkbox" className="form-check-input"
                                                    checked={sel.isSelected(p.idPiece)}
                                                    onChange={() => sel.toggle(p.idPiece)} />
                                            </td>
                                            <td style={{ width: '80px' }}>
                                                <OverlayTrigger
                                                    placement="right"
                                                    overlay={
                                                        <Popover id={`popover-${p.idPiece}`} className="shadow-lg border-0">
                                                            <Popover.Body className="p-1">
                                                                <img src={getPieceImage(p)} alt={p.designation} style={{ width: '150px', height: '150px', borderRadius: '4px', objectFit: 'cover' }} />
                                                            </Popover.Body>
                                                        </Popover>
                                                    }
                                                >
                                                    <div className="bg-light rounded p-1 text-center" style={{ width: '40px', height: '40px', cursor: 'pointer' }}>
                                                        <img src={getPieceImage(p)} alt="part" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    </div>
                                                </OverlayTrigger>
                                            </td>
                                            <td><code className="fw-bold">{p.reference}</code></td>
                                            <td>
                                                <div className="fw-bold">{p.designation}</div>
                                                <small className="text-muted">{p.categorie}</small>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className={`fs-5 fw-bold ${isCritical ? 'text-danger' : isLowStock ? 'text-warning' : 'text-success'}`}>
                                                        {p.stockActuel}
                                                    </span>
                                                    {isLowStock && (
                                                        <OverlayTrigger overlay={<Tooltip>Stock faible !</Tooltip>}>
                                                            <span className="text-danger">
                                                                <IconifyIcon icon="ri:alert-fill" fontSize={18} />
                                                            </span>
                                                        </OverlayTrigger>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-muted small">Min: {p.stockMinimum} / Max: {p.stockMaximum}</td>
                                            <td className="fw-bold">{p.prixUnitaire.toFixed(3)} DT</td>
                                            <td className="text-end px-3">
                                                <div className="d-flex gap-1 justify-content-end">
                                                    <Button variant="link" size="sm" className="text-primary p-0" onClick={() => openEdit(p)} title="Modifier">
                                                        <IconifyIcon icon="ri:edit-line" fontSize={20} />
                                                    </Button>
                                                    <Button variant="link" size="sm" className="text-success p-0" onClick={() => openStockModal(p)} title="Ajuster stock">
                                                        <IconifyIcon icon="ri:add-circle-fill" fontSize={20} />
                                                    </Button>
                                                    <Button variant="link" size="sm" className="text-danger p-0" onClick={() => handleDelete(p.idPiece, p.designation)} title="Désactiver">
                                                        <IconifyIcon icon="ri:delete-bin-line" fontSize={20} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>{editPiece ? `Modifier ${editPiece.designation}` : 'Référencer une nouvelle pièce'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate validated={validated} onSubmit={handleSave} id="piece-form">
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Référence (Code-barres)</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light"><IconifyIcon icon="ri:barcode-line" /></InputGroup.Text>
                                    <Form.Control
                                        value={form.reference}
                                        onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                                        placeholder="Ex: PR-12345"
                                        disabled={!!editPiece}
                                        required
                                        minLength={2}
                                    />
                                    <Form.Control.Feedback type="invalid">La référence est obligatoire.</Form.Control.Feedback>
                                </InputGroup>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Désignation <span className="text-danger">*</span></Form.Label>
                                <Form.Control value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="Ex: Filtre à air..." required minLength={2} />
                                <Form.Control.Feedback type="invalid">La désignation est obligatoire.</Form.Control.Feedback>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Catégorie</Form.Label>
                                <Form.Select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}>
                                    {CATEGORIES_PIECE.map(c => <option key={c} value={c}>{c}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-bold">Prix d'achat unitaire (DT) <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="number" step="0.001" min="0" required value={form.prixUnitaire} onChange={e => setForm(f => ({ ...f, prixUnitaire: Number(e.target.value) }))} />
                                <Form.Control.Feedback type="invalid">Le prix unitaire est obligatoire.</Form.Control.Feedback>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={12}>
                                <Form.Label className="small fw-bold">Image de la pièce</Form.Label>
                                <div className="d-flex align-items-center gap-3 border rounded p-2 bg-light">
                                    <div
                                        className="bg-white border rounded d-flex align-items-center justify-content-center overflow-hidden"
                                        style={{ width: '80px', height: '80px', flexShrink: 0 }}
                                    >
                                        {uploading ? (
                                            <Spinner animation="border" size="sm" variant="success" />
                                        ) : form.imageUrl ? (
                                            <img
                                                src={form.imageUrl.startsWith('http') ? form.imageUrl : `${API_BASE_URL}${form.imageUrl}`}
                                                alt="preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <IconifyIcon icon="ri:image-add-line" className="fs-2 text-muted" />
                                        )}
                                    </div>
                                    <div className="flex-grow-1">
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            disabled={uploading}
                                        />
                                        <small className="text-muted d-block mt-1">
                                            Choisissez une photo depuis votre ordinateur (JPG, PNG, GIF)
                                        </small>
                                    </div>
                                    {form.imageUrl && (
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                                            title="Supprimer l'image"
                                        >
                                            <IconifyIcon icon="ri:delete-bin-line" />
                                        </Button>
                                    )}
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}><Form.Label className="small fw-bold">Stock Actuel</Form.Label><Form.Control type="number" value={form.stockActuel} onChange={e => setForm(f => ({ ...f, stockActuel: Number(e.target.value) }))} disabled={!!editPiece} /></Col>
                            <Col md={4}><Form.Label className="small fw-bold">Stock Min (Alerte)</Form.Label><Form.Control type="number" value={form.stockMinimum} onChange={e => setForm(f => ({ ...f, stockMinimum: Number(e.target.value) }))} /></Col>
                            <Col md={4}><Form.Label className="small fw-bold">Stock Max</Form.Label><Form.Control type="number" value={form.stockMaximum} onChange={e => setForm(f => ({ ...f, stockMaximum: Number(e.target.value) }))} /></Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Annuler</Button>
                    <Button variant="success" type="submit" form="piece-form" disabled={saving}>
                        {saving && <Spinner size="sm" className="me-1" />}
                        {editPiece ? 'Enregistrer les modifications' : 'Créer la pièce'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showStockModal} onHide={() => setShowStockModal(false)} centered>
                <Modal.Header closeButton className="bg-light"><Modal.Title>Mouvement de Stock</Modal.Title></Modal.Header>
                <Modal.Body className="text-center py-4">
                    <div className="mb-3">
                        <h6 className="text-muted text-uppercase small">Pièce sélectionnée</h6>
                        <h5 className="fw-bold">{selectedPiece?.designation}</h5>
                        <code className="text-primary">{selectedPiece?.reference}</code>
                    </div>

                    <div className="d-flex justify-content-center align-items-center gap-4 my-4">
                        <Button variant="outline-danger" className="rounded-circle p-3" onClick={() => setStockDelta(d => d - 1)} style={{ width: '50px', height: '50px' }}><IconifyIcon icon="ri:subtract-line" /></Button>
                        <div className="text-center">
                            <h2 className="mb-0 fw-bold">{selectedPiece ? selectedPiece.stockActuel + stockDelta : 0}</h2>
                            <small className="text-muted">Nouveau Stock</small>
                        </div>
                        <Button variant="outline-success" className="rounded-circle p-3" onClick={() => setStockDelta(d => d + 1)} style={{ width: '50px', height: '50px' }}><IconifyIcon icon="ri:add-line" /></Button>
                    </div>

                    <div className={`p-2 rounded small ${stockDelta > 0 ? 'bg-success text-white' : stockDelta < 0 ? 'bg-danger text-white' : 'bg-light text-muted'}`}>
                        {stockDelta > 0 ? `Addition de ${stockDelta} unités` : stockDelta < 0 ? `Soustraction de ${Math.abs(stockDelta)} unités` : 'Ajustez la quantité'}
                    </div>
                </Modal.Body>
                <Modal.Footer className="bg-light border-0">
                    <Button variant="primary" className="w-100" onClick={handleAjusterStock} disabled={updatingStock || stockDelta === 0}>
                        {updatingStock && <Spinner size="sm" className="me-1" />}
                        Valider le mouvement
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
