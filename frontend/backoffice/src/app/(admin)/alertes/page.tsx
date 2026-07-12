
import { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Row, Spinner } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Swal from 'sweetalert2'
import alerteService, { Alerte } from '@/services/alerteService'
import { useApiError } from '@/hooks/useApiError'
import { AlerteErreur } from '@/components/AlerteErreur'



const TYPE_BADGE: Record<string, { bg: string; label: string; icon: string }> = {
    ASSURANCE: { bg: 'danger', label: 'Assurance', icon: 'ri:shield-check-line' },
    VISITE_TECHNIQUE: { bg: 'warning', label: 'Visite Technique', icon: 'ri:car-line' },
    VEHICULE_BESOIN_MAINTENANCE: { bg: 'primary', label: 'Révision', icon: 'ri:tools-line' },
    STOCK_RUPTURE: { bg: 'danger', label: 'Rupture Stock', icon: 'ri:box-3-line' },
    OT_EN_RETARD: { bg: 'warning', label: 'OT en retard', icon: 'ri:time-line' },
    INTERVENTION_UPCOMING: { bg: 'info', label: 'Intervention', icon: 'ri:calendar-line' },
    EMPLOYE_PERMIS_EXPIRE: { bg: 'danger', label: 'Permis Expiré', icon: 'ri:id-card-line' },
    EQUIPEMENT_HORS_SERVICE: { bg: 'danger', label: 'Éq. Hors Service', icon: 'ri:error-warning-fill' },
    EQUIPEMENT_A_REMPLACER: { bg: 'warning', label: 'Éq. À Remplacer', icon: 'ri:exchange-line' },
    GARANTIE_EXPIRANTE: { bg: 'warning', label: 'Garantie Expirante', icon: 'ri:shield-star-line' },
    GARANTIE_EXPIREE: { bg: 'info', label: 'Garantie Expirée', icon: 'ri:shield-cross-line' },
    CONTRAT_EXPIRANT: { bg: 'warning', label: 'Contrat Expirant', icon: 'ri:file-text-line' },
    ROTATION_FAIBLE: { bg: 'info', label: 'Rotation Faible', icon: 'ri:bar-chart-line' },
    MISSION_EN_RETARD: { bg: 'warning', label: 'Mission en retard', icon: 'ri:time-line' },
    MISSION_SANS_EQUIPEMENTS: { bg: 'info', label: 'Mission sans éq.', icon: 'ri:luggage-cart-line' },
    SYSTEM: { bg: 'dark', label: 'Système', icon: 'ri:settings-line' },
    // ── Types générés par les microservices (Alerts.API) ──
    ASSURANCE_EXPIRATION: { bg: 'danger', label: 'Assurance', icon: 'ri:shield-check-line' },
    VIGNETTE_EXPIRATION: { bg: 'warning', label: 'Vignette', icon: 'ri:price-tag-3-line' },
    VISITE_TECHNIQUE_EXPIRATION: { bg: 'warning', label: 'Visite Technique', icon: 'ri:car-line' },
    KILOMETRAGE_MAINTENANCE: { bg: 'primary', label: 'Révision', icon: 'ri:tools-line' },
    FACTURE_IMPAYEE: { bg: 'danger', label: 'Facture impayée', icon: 'ri:bill-line' },
    MISSION_SANS_AFFECTATION: { bg: 'danger', label: 'Mission sans chauffeur', icon: 'ri:user-unfollow-line' },
    MISSION_RETARD: { bg: 'warning', label: 'Mission en retard', icon: 'ri:time-line' },
}

const STATUS_BADGE: Record<string, { bg: string; label: string }> = {
    ACTIVE: { bg: 'danger', label: 'Non Lue' },
    LUE: { bg: 'primary', label: 'Lue' },
    TRAITEE: { bg: 'success', label: 'Traitée' },
    IGNOREE: { bg: 'secondary', label: 'Ignorée' },
}

type Tab = 'ALL' | 'ACTIVE' | 'LUE' | 'TRAITEE'

const AlertesPage = () => {
    const [alertes, setAlertes] = useState<Alerte[]>([])
    const [loading, setLoading] = useState(false)
    const { error, execute, clearError } = useApiError()
    const [refreshing, setRefreshing] = useState(false)
    const [tab, setTab] = useState<Tab>('ALL')
    const [selected, setSelected] = useState<Set<number>>(new Set())
    const [deleting, setDeleting] = useState(false)

    const fetchAll = async () => {
        setLoading(true)
        clearError()
        const data = await execute(() => alerteService.getAll())
        if (data) {
            setAlertes(Array.isArray(data) ? data : [])
        }
        setLoading(false)
    }

    const runChecks = async () => {
        setRefreshing(true)
        clearError()
        const success = await execute(async () => {
            await alerteService.runChecks()
            return true
        })
        if (success) {
            await fetchAll()
        }
        setRefreshing(false)
    }

    useEffect(() => { fetchAll() }, [])


    const markAsRead = async (id: number) => {
        clearError()
        const success = await execute(async () => {
            await alerteService.markAsRead(id)
            return true
        })
        if (success) {
            setAlertes(prev => prev.map(a => a.idAlerte === id ? { ...a, statut: 'LUE' } : a))
        }
    }

    const markAsTraitee = async (id: number) => {
        clearError()
        const success = await execute(async () => {
            await alerteService.markAsTraitee(id)
            return true
        })
        if (success) {
            setAlertes(prev => prev.map(a => a.idAlerte === id ? { ...a, statut: 'TRAITEE' } : a))
        }
    }

    // ── Suppression (unitaire, sélection, tout) ──────────────────────────────
    const removeOne = async (id: number) => {
        const confirm = await Swal.fire({
            title: 'Supprimer cette alerte ?', icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Supprimer',
            cancelButtonText: 'Annuler', confirmButtonColor: '#dc3545',
        })
        if (!confirm.isConfirmed) return
        clearError()
        const success = await execute(async () => { await alerteService.remove(id); return true })
        if (success) {
            setAlertes(prev => prev.filter(a => a.idAlerte !== id))
            setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
        }
    }

    const removeSelected = async () => {
        const ids = [...selected]
        const confirm = await Swal.fire({
            title: `Supprimer ${ids.length} alerte(s) ?`, icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Supprimer la sélection',
            cancelButtonText: 'Annuler', confirmButtonColor: '#dc3545',
        })
        if (!confirm.isConfirmed) return
        setDeleting(true); clearError()
        const success = await execute(async () => { await alerteService.removeMany(ids); return true })
        if (success) {
            setAlertes(prev => prev.filter(a => !selected.has(a.idAlerte)))
            setSelected(new Set())
        }
        setDeleting(false)
    }

    const removeAll = async () => {
        const confirm = await Swal.fire({
            title: 'Tout supprimer ?',
            text: `Les ${alertes.length} alertes seront définitivement supprimées.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Tout supprimer', cancelButtonText: 'Annuler',
            confirmButtonColor: '#dc3545',
        })
        if (!confirm.isConfirmed) return
        setDeleting(true); clearError()
        const success = await execute(async () => { await alerteService.removeAll(); return true })
        if (success) { setAlertes([]); setSelected(new Set()) }
        setDeleting(false)
    }

    const toggleSelect = (id: number) => setSelected(prev => {
        const n = new Set(prev)
        if (n.has(id)) n.delete(id); else n.add(id)
        return n
    })

    const filtered = tab === 'ALL' ? alertes : alertes.filter(a => a.statut === tab)
    const allFilteredSelected = filtered.length > 0 && filtered.every(a => selected.has(a.idAlerte))
    const toggleSelectAll = () => setSelected(
        allFilteredSelected ? new Set() : new Set(filtered.map(a => a.idAlerte)))

    const countActive = alertes.filter(a => a.statut === 'ACTIVE').length
    const countDanger = alertes.filter(a => a.priorite === 'CRITIQUE').length
    const countWarning = alertes.filter(a => a.priorite === 'HAUTE').length

    /** Le champ API est dateCreation ; garde anti « Invalid Date » */
    const formatDate = (d?: string) => {
        if (!d) return '—'
        const date = new Date(d)
        return isNaN(date.getTime()) ? '—' : date.toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <>
            <PageBreadcrumb title="Alertes & Notifications" subName="Gestion" />

            {error && (
                <AlerteErreur
                    status={error.status}
                    message={error.message}
                    onDismiss={clearError}
                    className="mb-3"
                />
            )}

            <Row className="g-3 mb-3 align-items-center">
                <Col>
                    <div className="d-flex flex-wrap gap-2">
                        {(['ALL', 'ACTIVE', 'LUE', 'TRAITEE'] as Tab[]).map(t => (
                            <Button
                                key={t}
                                variant={tab === t ? 'primary' : 'outline-secondary'}
                                size="sm"
                                onClick={() => setTab(t)}
                            >
                                {t === 'ALL' && 'Toutes'}
                                {t === 'ACTIVE' && <><span>Non lues</span> <Badge bg="danger" pill>{alertes.filter(a => a.statut === 'ACTIVE').length}</Badge></>}
                                {t === 'LUE' && 'Lues'}
                                {t === 'TRAITEE' && 'Traitées'}
                            </Button>
                        ))}
                    </div>
                </Col>
                <Col xs="auto" className="d-flex gap-2 flex-wrap">
                    {selected.size > 0 && (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={removeSelected}
                            disabled={deleting}
                            className="d-flex align-items-center gap-2"
                        >
                            <IconifyIcon icon="ri:delete-bin-line" />
                            Supprimer la sélection ({selected.size})
                        </Button>
                    )}
                    {alertes.length > 0 && (
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={removeAll}
                            disabled={deleting}
                            className="d-flex align-items-center gap-2"
                        >
                            <IconifyIcon icon="ri:delete-bin-6-line" />
                            Tout supprimer
                        </Button>
                    )}
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={runChecks}
                        disabled={refreshing}
                        className="d-flex align-items-center gap-2"
                    >
                        {refreshing
                            ? <Spinner size="sm" animation="border" />
                            : <IconifyIcon icon="ri:refresh-line" />}
                        {refreshing ? 'Analyse en cours...' : 'Actualiser les alertes'}
                    </Button>
                </Col>
            </Row>

            {/* ── KPI Cards ────────────────────────────────── */}
            <Row className="g-3 mb-3">
                {[
                    { label: 'Total', value: alertes.length, bg: 'light', text: 'dark' },
                    { label: 'Non lues', value: countActive, bg: 'soft-primary', text: 'primary' },
                    { label: 'Urgentes', value: countDanger, bg: 'soft-danger', text: 'danger' },
                    { label: 'Attention', value: countWarning, bg: 'soft-warning', text: 'warning' },
                ].map(kpi => (
                    <Col xs={6} md={3} key={kpi.label}>
                        <Card className={`border-0 shadow-none bg-${kpi.bg}`}>
                            <Card.Body className="py-3 text-center">
                                <h3 className={`mb-0 fw-bold text-${kpi.text}`}>{kpi.value}</h3>
                                <small className="text-muted">{kpi.label}</small>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>


            <Card>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <IconifyIcon icon="line-md:bell-twotone-alert-loop" className="fs-60 mb-2" />
                            <p className="mb-0">Aucune alerte trouvée.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-sm align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: 34 }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={allFilteredSelected}
                                                onChange={toggleSelectAll}
                                                title="Tout sélectionner"
                                            />
                                        </th>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Message</th>
                                        <th>Statut</th>
                                        <th>Priorité</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(alert => {
                                        const typeInfo = TYPE_BADGE[alert.typeAlerte] ?? { bg: 'secondary', label: alert.typeAlerte, icon: 'ri:alarm-warning-line' }
                                        const statusInfo = STATUS_BADGE[alert.statut] ?? { bg: 'secondary', label: alert.statut }
                                        return (
                                            <tr
                                                key={alert.idAlerte}
                                                style={{ backgroundColor: alert.statut === 'ACTIVE' ? '#fffbea' : undefined }}
                                            >
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={selected.has(alert.idAlerte)}
                                                        onChange={() => toggleSelect(alert.idAlerte)}
                                                    />
                                                </td>
                                                <td className="text-nowrap small">{formatDate(alert.dateCreation)}</td>
                                                <td>
                                                    <Badge bg={typeInfo.bg} className="d-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
                                                        <IconifyIcon icon={typeInfo.icon} className="me-1" />
                                                        {typeInfo.label}
                                                    </Badge>
                                                </td>
                                                <td className={alert.statut === 'ACTIVE' ? 'fw-semibold' : 'text-muted'}>
                                                    {alert.message}
                                                </td>
                                                <td>
                                                    <Badge bg={statusInfo.bg}>{statusInfo.label}</Badge>
                                                </td>
                                                <td>
                                                    <Badge bg={alert.priorite === 'CRITIQUE' ? 'danger' : alert.priorite === 'HAUTE' ? 'warning' : 'info'}>
                                                        {alert.priorite}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {alert.statut === 'ACTIVE' && (
                                                        <Button size="sm" variant="outline-primary" className="me-1" onClick={() => markAsRead(alert.idAlerte)}>
                                                            <IconifyIcon icon="ri:check-line" className="me-1" />
                                                            Lue
                                                        </Button>
                                                    )}
                                                    {alert.statut !== 'TRAITEE' && (
                                                        <Button size="sm" variant="outline-success" className="me-1" onClick={() => markAsTraitee(alert.idAlerte)}>
                                                            <IconifyIcon icon="ri:check-double-line" className="me-1" />
                                                            Traitée
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="outline-danger" title="Supprimer"
                                                        onClick={() => removeOne(alert.idAlerte)}>
                                                        <IconifyIcon icon="ri:delete-bin-line" />
                                                    </Button>
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
        </>
    )
}

export default AlertesPage
