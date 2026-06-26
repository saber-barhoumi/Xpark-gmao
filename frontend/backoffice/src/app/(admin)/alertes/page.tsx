
import { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Row, Spinner } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
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

    const filtered = tab === 'ALL' ? alertes : alertes.filter(a => a.statut === tab)

    const countActive = alertes.filter(a => a.statut === 'ACTIVE').length
    const countDanger = alertes.filter(a => a.priorite === 'CRITIQUE').length
    const countWarning = alertes.filter(a => a.priorite === 'HAUTE').length

    const formatDate = (d: string) => new Date(d).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })

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
                <Col xs="auto">
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
                                                <td className="text-nowrap small">{formatDate(alert.dateAlerte)}</td>
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
                                                        <Button size="sm" variant="outline-success" onClick={() => markAsTraitee(alert.idAlerte)}>
                                                            <IconifyIcon icon="ri:check-double-line" className="me-1" />
                                                            Traitée
                                                        </Button>
                                                    )}
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
