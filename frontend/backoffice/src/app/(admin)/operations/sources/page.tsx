import { useState, useEffect } from 'react'
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import sourceService, { CreateSourceDto, Source, TypeSource } from '@/services/sourceService'
import Swal from 'sweetalert2'
import useBulkSelection from '@/hooks/useBulkSelection'
import BulkDeleteButtons from '@/components/table/BulkDeleteButtons'

// ─── Helpers ────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<TypeSource, { icon: string; badge: string; label: string }> = {
    STATION_EXTERNE: { icon: 'ri:gas-station-line', badge: 'primary', label: 'Station Externe' },
    DAC_INTERNE: { icon: 'ri:building-2-line', badge: 'success', label: 'DAC Interne' },
    CARTE_CARBURANT: { icon: 'ri:bank-card-line', badge: 'info', label: 'Carte Carburant' },
    CITERE_MOBILE: { icon: 'ri:truck-line', badge: 'warning', label: 'Citerne Mobile' },
    STOCKAGE_PRIVE: { icon: 'ri:archive-2-line', badge: 'secondary', label: 'Stockage Privé' },
}

const emptyForm = (): CreateSourceDto => ({
    nomSource: '',
    typeSource: 'STATION_EXTERNE',
    adresse: '',
    ville: '',
    prixMoyen: undefined,
    remiseFiotte: undefined,
    codeCarte: '',
})

// ─── Component ────────────────────────────────────────────────────────────────
export default function SourcesPage() {
    const [sources, setSources] = useState<Source[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [filterType, setFilterType] = useState('')
    const [filterActif, setFilterActif] = useState<'' | 'true' | 'false'>('')
    const [form, setForm] = useState<CreateSourceDto>(emptyForm())
    const [validated, setValidated] = useState(false)

    const load = async () => {
        setLoading(true)
        try { setSources(await sourceService.getAll()) }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    // ── Open Modal ────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditingId(null)
        setForm(emptyForm())
        setValidated(false)
        setShowModal(true)
    }

    const openEdit = (s: Source) => {
        setEditingId(s.idSource)
        setForm({
            nomSource: s.nomSource,
            typeSource: s.typeSource,
            adresse: s.adresse ?? '',
            ville: s.ville ?? '',
            prixMoyen: s.prixMoyen,
            remiseFiotte: s.remiseFiotte,
            codeCarte: s.codeCarte ?? '',
        })
        setValidated(false)
        setShowModal(true)
    }

    // ── Submit ────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (!e.currentTarget.checkValidity()) {
            setValidated(true)
            return
        }
        setSaving(true)
        try {
            if (editingId) {
                await sourceService.update(editingId, form)
                Swal.fire({ icon: 'success', title: 'Mis à jour !', timer: 1500, showConfirmButton: false })
            } else {
                await sourceService.create(form)
                Swal.fire({ icon: 'success', title: 'Source créée !', timer: 1500, showConfirmButton: false })
            }
            setShowModal(false)
            load()
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Une erreur est survenue', 'error')
        } finally {
            setSaving(false)
        }
    }

    // ── Toggle Actif ─────────────────────────────────────────────────────
    const toggleActif = async (s: Source) => {
        await sourceService.update(s.idSource, { actif: !s.actif })
        setSources(prev => prev.map(x => x.idSource === s.idSource ? { ...x, actif: !x.actif } : x))
    }

    // ── Delete ────────────────────────────────────────────────────────────
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer cette source ?',
            text: 'Les relevés liés garderont leur historique.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Supprimer',
        })
        if (result.isConfirmed) {
            await sourceService.delete(id)
            setSources(prev => prev.filter(s => s.idSource !== id))
            Swal.fire({ icon: 'success', title: 'Supprimée !', timer: 1200, showConfirmButton: false })
        }
    }

    // ── Filtered list ─────────────────────────────────────────────────────
    const filtered = sources
        .filter(s => !filterType || s.typeSource === filterType)
        .filter(s => filterActif === '' || String(s.actif) === filterActif)

    // Sélection multiple (suppression en masse)
    const [deleting, setDeleting] = useState(false)
    const sel = useBulkSelection(filtered, x => x.idSource)

    // Suppression en masse : réutilise sourceService.delete unitaire
    const deleteMany = async (ids: number[]) => {
        setDeleting(true)
        try {
            await Promise.all(ids.map(id => sourceService.delete(id)))
            sel.clear()
            await load()
            Swal.fire('Supprimées', `${ids.length} source(s) supprimée(s).`, 'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Suppression partielle ou impossible.', 'error')
            await load()
        } finally { setDeleting(false) }
    }

    const stats = {
        total: sources.length,
        actives: sources.filter(s => s.actif).length,
        pleinsTotal: sources.reduce((acc, s) => acc + s.nombreConsommations, 0),
    }

    return (
        <>
            <PageBreadcrumb title="Sources d'Approvisionnement" subName="Opérations" />

            {/* ── KPI Cards ─────────────────────────────────────────── */}
            <Row className="g-3 mb-4">
                {[
                    { label: 'Sources totales', value: stats.total, icon: 'ri:gas-station-line', color: 'primary' },
                    { label: 'Sources actives', value: stats.actives, icon: 'ri:check-double-line', color: 'success' },
                    { label: 'Pleins enregistrés', value: stats.pleinsTotal, icon: 'ri:drop-line', color: 'info' },
                ].map(({ label, value, icon, color }) => (
                    <Col key={label} md={4}>
                        <Card className="h-100 border-0 shadow-sm">
                            <Card.Body className="d-flex align-items-center gap-3">
                                <span className={`avatar-md rounded-3 bg-${color}-subtle d-flex align-items-center justify-content-center`}>
                                    <IconifyIcon icon={icon} className={`text-${color} fs-24`} />
                                </span>
                                <div>
                                    <p className="text-muted mb-1 fs-13">{label}</p>
                                    <h4 className="mb-0 fw-bold">{value}</h4>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* ── Table ─────────────────────────────────────────────── */}
            <Card className="shadow-sm">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <h5 className="mb-0 fw-semibold">
                            <IconifyIcon icon="ri:gas-station-line" className="me-2 text-primary" />
                            Sources ({filtered.length})
                        </h5>
                        <div className="d-flex gap-2 flex-wrap">
                            <Form.Select size="sm" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 200 }}>
                                <option value="">Tous les types</option>
                                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </Form.Select>
                            <Form.Select size="sm" value={filterActif} onChange={e => setFilterActif(e.target.value as any)} style={{ width: 140 }}>
                                <option value="">Tous statuts</option>
                                <option value="true">Actif</option>
                                <option value="false">Inactif</option>
                            </Form.Select>
                            <BulkDeleteButtons
                                selectedCount={sel.count} totalCount={filtered.length}
                                label="source(s)" deleting={deleting}
                                onDeleteSelected={() => deleteMany(sel.selectedIds)}
                                onDeleteAll={() => deleteMany(filtered.map(x => x.idSource))}
                            />
                            <Button variant="primary" size="sm" onClick={openCreate}>
                                <IconifyIcon icon="ri:add-line" className="me-1" />
                                Ajouter Source
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <IconifyIcon icon="ri:gas-station-line" className="fs-60 mb-2" />
                            <p>Aucune source trouvée.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-sm align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: 34 }}>
                                            <input type="checkbox" className="form-check-input"
                                                checked={sel.allSelected} onChange={sel.toggleAll}
                                                title="Tout sélectionner" />
                                        </th>
                                        <th>Type</th>
                                        <th>Nom</th>
                                        <th>Ville</th>
                                        <th>Prix Moyen</th>
                                        <th>Remise Flotte</th>
                                        <th>Nb Pleins</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(s => {
                                        const cfg = TYPE_CONFIG[s.typeSource] ?? { icon: 'ri:map-pin-line', badge: 'secondary', label: s.typeSource }
                                        return (
                                            <tr key={s.idSource}>
                                                <td>
                                                    <input type="checkbox" className="form-check-input"
                                                        checked={sel.isSelected(s.idSource)}
                                                        onChange={() => sel.toggle(s.idSource)} />
                                                </td>
                                                <td>
                                                    <Badge bg={cfg.badge} className="d-inline-flex align-items-center gap-1">
                                                        <IconifyIcon icon={cfg.icon} />
                                                        {cfg.label}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <strong>{s.nomSource}</strong>
                                                    {s.codeCarte && <div className="text-muted small"><IconifyIcon icon="ri:bank-card-line" /> {s.codeCarte}</div>}
                                                </td>
                                                <td className="text-muted">{s.ville || '—'}</td>
                                                <td>{s.prixMoyen ? <><strong>{s.prixMoyen.toFixed(3)}</strong> <small className="text-muted">TND/L</small></> : '—'}</td>
                                                <td>
                                                    {s.remiseFiotte
                                                        ? <Badge bg="success-subtle" text="success" className="border border-success">{s.remiseFiotte}%</Badge>
                                                        : '—'}
                                                </td>
                                                <td><Badge bg="light" text="dark">{s.nombreConsommations}</Badge></td>
                                                <td>
                                                    <div className="form-check form-switch mb-0">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={s.actif}
                                                            onChange={() => toggleActif(s)}
                                                            title={s.actif ? 'Désactiver' : 'Activer'}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button size="sm" variant="outline-primary" onClick={() => openEdit(s)} title="Modifier">
                                                            <IconifyIcon icon="ri:edit-line" />
                                                        </Button>
                                                        <Button size="sm" variant="outline-danger" onClick={() => handleDelete(s.idSource)} title="Supprimer">
                                                            <IconifyIcon icon="ri:delete-bin-line" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* ── Modal Créer / Modifier ─────────────────────────────── */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton className="border-bottom">
                    <Modal.Title>
                        <IconifyIcon icon={editingId ? 'ri:edit-2-line' : 'ri:add-circle-line'} className="me-2 text-primary" />
                        {editingId ? 'Modifier la source' : 'Nouvelle source'}
                    </Modal.Title>
                </Modal.Header>
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Label className="fw-semibold">Type de source *</Form.Label>
                                <Form.Select
                                    value={form.typeSource}
                                    onChange={e => setForm({ ...form, typeSource: e.target.value as TypeSource, codeCarte: '' })}
                                    required
                                >
                                    {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">Le type de source est obligatoire.</Form.Control.Feedback>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold">Nom de la source *</Form.Label>
                                <Form.Control
                                    value={form.nomSource}
                                    onChange={e => setForm({ ...form, nomSource: e.target.value })}
                                    placeholder="Ex : Station Agil Menzah 6"
                                    required
                                    minLength={2}
                                />
                                <Form.Control.Feedback type="invalid">Le nom de la source est obligatoire (min. 2 caractères).</Form.Control.Feedback>
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold">Ville</Form.Label>
                                <Form.Control
                                    value={form.ville ?? ''}
                                    onChange={e => setForm({ ...form, ville: e.target.value })}
                                    placeholder="Tunis"
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold">Adresse</Form.Label>
                                <Form.Control
                                    value={form.adresse ?? ''}
                                    onChange={e => setForm({ ...form, adresse: e.target.value })}
                                    placeholder="Avenue Habib Bourguiba"
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold">Prix moyen (TND/L)</Form.Label>
                                <Form.Control
                                    type="number" step="0.001" min="0"
                                    value={form.prixMoyen ?? ''}
                                    onChange={e => setForm({ ...form, prixMoyen: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    placeholder="2.150"
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-semibold">Remise flotte (%)</Form.Label>
                                <Form.Control
                                    type="number" step="0.1" min="0" max="100"
                                    value={form.remiseFiotte ?? ''}
                                    onChange={e => setForm({ ...form, remiseFiotte: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    placeholder="5.0"
                                />
                            </Col>
                            {form.typeSource === 'CARTE_CARBURANT' && (
                                <Col md={12}>
                                    <Form.Label className="fw-semibold">Code carte carburant</Form.Label>
                                    <Form.Control
                                        value={form.codeCarte ?? ''}
                                        onChange={e => setForm({ ...form, codeCarte: e.target.value })}
                                        placeholder="Ex : TOTAL-123456"
                                    />
                                </Col>
                            )}
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="border-top">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? <><Spinner size="sm" className="me-1" />{editingId ? 'Enregistrement...' : 'Création...'}</> : editingId ? 'Enregistrer' : 'Créer'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    )
}
