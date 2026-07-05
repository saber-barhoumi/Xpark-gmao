import { Fragment, useCallback, useEffect, useState } from 'react'
import { Alert as BsAlert, Badge, Button, Card, Col, Form, Row, Spinner, Table, Tab, Tabs } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Swal from 'sweetalert2'
import iboaService, {
    IboaAlert, IboaEvent, IboaHealth, IboaPreferences, IboaStats,
} from '@/services/iboaService'

const CLASS_COLORS: Record<string, string> = {
    CRITIQUE: 'danger', IMPORTANT: 'warning', NORMAL: 'info', INFO: 'secondary',
}
const STATUS_COLORS: Record<string, string> = {
    SENT: 'success', SENT_SIMULATED: 'success', FAILED: 'danger',
    SUPPRESSED: 'secondary', BATCHED: 'info', PENDING: 'warning',
}
const CHANNEL_ICONS: Record<string, string> = {
    WHATSAPP: 'ri:whatsapp-line', EMAIL: 'ri:mail-line',
    BATCH_EMAIL: 'ri:mail-send-line', NONE: 'ri:forbid-line',
}

/**
 * Page IBOA — /monitoring/iboa
 * Assistant intelligent du propriétaire : événements métier reçus via RabbitMQ,
 * criticité 1-100, alertes WhatsApp/Email, rapports PDF/Excel.
 */
export default function IboaPage() {
    const [health, setHealth] = useState<IboaHealth | null>(null)
    const [events, setEvents] = useState<IboaEvent[]>([])
    const [alerts, setAlerts] = useState<IboaAlert[]>([])
    const [stats, setStats] = useState<IboaStats | null>(null)
    const [prefs, setPrefs] = useState<IboaPreferences | null>(null)
    const [loading, setLoading] = useState(true)
    const [offline, setOffline] = useState(false)
    const [savingPrefs, setSavingPrefs] = useState(false)
    const [testing, setTesting] = useState(false)
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        try {
            const [h, e, a, s] = await Promise.all([
                iboaService.health(), iboaService.events(50),
                iboaService.alerts(50), iboaService.stats(),
            ])
            setHealth(h); setEvents(e.events); setAlerts(a.alerts); setStats(s)
            setOffline(false)
        } catch {
            setOffline(true)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refresh()
        iboaService.preferences().then(setPrefs).catch(() => {})
        const timer = setInterval(refresh, 15_000)   // rafraîchissement temps réel
        return () => clearInterval(timer)
    }, [refresh])

    const sendTest = async () => {
        setTesting(true)
        try {
            await iboaService.sendTestEvent()
            await new Promise(r => setTimeout(r, 1500))   // laisser le pipeline traiter
            await refresh()
            Swal.fire('Événement de test envoyé',
                'Une panne véhicule simulée (client PREMIUM) a traversé tout le pipeline RabbitMQ → scoring → alerte.',
                'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.message, 'error')
        } finally {
            setTesting(false)
        }
    }

    const savePrefs = async () => {
        if (!prefs) return
        setSavingPrefs(true)
        try {
            await iboaService.savePreferences(prefs)
            Swal.fire('Enregistré', 'Préférences d\'alerte mises à jour.', 'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.message, 'error')
        } finally {
            setSavingPrefs(false)
        }
    }

    const byClass = stats?.eventsByClassification ?? {}

    return (
        <>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="ri:radar-line" className="me-2 text-primary" />
                        Assistant Intelligent (IBOA)
                    </h4>
                    <p className="text-muted mb-0">
                        Monitoring temps réel de l&apos;entreprise — alertes WhatsApp/Email, rapports PDF/Excel, sans consulter l&apos;application
                    </p>
                </Col>
                <Col xs="auto" className="d-flex gap-2 align-items-center flex-wrap">
                    {health && (
                        <>
                            <Badge bg={health.rabbitmqConnected ? 'success' : 'danger'}>
                                <IconifyIcon icon="ri:exchange-line" className="me-1" />
                                RabbitMQ {health.rabbitmqConnected ? 'connecté' : 'déconnecté'}
                            </Badge>
                            <Badge bg={health.whatsappMode === 'TWILIO' ? 'success' : 'secondary'}>
                                <IconifyIcon icon="ri:whatsapp-line" className="me-1" />
                                WhatsApp {health.whatsappMode}
                            </Badge>
                            <Badge bg={health.emailMode === 'SMTP' ? 'success' : 'secondary'}>
                                <IconifyIcon icon="ri:mail-line" className="me-1" />
                                Email {health.emailMode}
                            </Badge>
                        </>
                    )}
                    {offline && <Badge bg="danger">Service IBOA hors ligne</Badge>}
                </Col>
            </Row>

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : offline ? (
                <BsAlert variant="danger">
                    Le service IBOA (port 5008) est injoignable. Vérifiez <code>docker compose up -d iboa</code>.
                </BsAlert>
            ) : (
                <>
                    {/* ── Compteurs du jour ─────────────────────────── */}
                    <Row className="g-3 mb-4 text-center">
                        {(['CRITIQUE', 'IMPORTANT', 'NORMAL', 'INFO'] as const).map(c => (
                            <Col md={3} key={c}>
                                <Card className="border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <div className={`fs-3 fw-bold text-${CLASS_COLORS[c]}`}>{byClass[c] ?? 0}</div>
                                        <div className="small text-muted">Événements {c} aujourd&apos;hui</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* ── Actions ───────────────────────────────────── */}
                    <div className="d-flex gap-2 mb-4 flex-wrap">
                        <Button variant="dark" onClick={sendTest} disabled={testing}>
                            {testing
                                ? <><Spinner animation="border" size="sm" className="me-1" /> Test en cours…</>
                                : <><IconifyIcon icon="ri:flask-line" className="me-1" /> Simuler une panne critique</>}
                        </Button>
                        <Button variant="outline-danger" href={iboaService.dailyPdfUrl} target="_blank">
                            <IconifyIcon icon="ri:file-pdf-2-line" className="me-1" /> Rapport quotidien PDF
                        </Button>
                        <Button variant="outline-success" href={iboaService.dailyExcelUrl} target="_blank">
                            <IconifyIcon icon="ri:file-excel-2-line" className="me-1" /> Export Excel
                        </Button>
                        <Button variant="outline-secondary" onClick={refresh}>
                            <IconifyIcon icon="ri:refresh-line" className="me-1" /> Rafraîchir
                        </Button>
                    </div>

                    <Tabs defaultActiveKey="events" className="mb-3">
                        {/* ── Flux événements ───────────────────────── */}
                        <Tab eventKey="events" title={<span><IconifyIcon icon="ri:pulse-line" className="me-1" />Événements ({events.length})</span>}>
                            <Card>
                                <div className="table-responsive">
                                    <Table hover size="sm" className="align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Heure</th><th>Type</th><th>Source</th>
                                                <th>Sévérité</th><th>Score</th><th>Classification</th><th />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {events.length === 0 && (
                                                <tr><td colSpan={7} className="text-center text-muted py-4">
                                                    Aucun événement reçu — terminez une mission, changez le statut d&apos;un véhicule
                                                    ou cliquez «&nbsp;Simuler une panne critique&nbsp;»
                                                </td></tr>
                                            )}
                                            {events.map(e => (
                                                <Fragment key={e.eventId}>
                                                    <tr style={{ cursor: 'pointer' }}
                                                        onClick={() => setExpandedEvent(expandedEvent === e.eventId ? null : e.eventId)}>
                                                        <td className="small">{new Date(e.timestamp).toLocaleString('fr-FR', {
                                                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                                                        <td className="small fw-semibold">{e.eventType.replace('xpark.', '')}</td>
                                                        <td className="small text-muted">{e.sourceService}</td>
                                                        <td><Badge bg="light" text="dark">{e.severity}</Badge></td>
                                                        <td className="fw-bold">{e.criticityScore}</td>
                                                        <td><Badge bg={CLASS_COLORS[e.classification]}>{e.classification}</Badge></td>
                                                        <td><IconifyIcon icon="ri:arrow-down-s-line" className="text-muted" /></td>
                                                    </tr>
                                                    {expandedEvent === e.eventId && (
                                                        <tr>
                                                            <td colSpan={7} className="bg-light small">
                                                                <strong>Calcul criticité :</strong> {e.scoreBreakdown?.join(' · ')}<br />
                                                                <strong>Données :</strong> <code>{JSON.stringify(e.eventData)}</code>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card>
                        </Tab>

                        {/* ── Alertes envoyées ──────────────────────── */}
                        <Tab eventKey="alerts" title={<span><IconifyIcon icon="ri:notification-3-line" className="me-1" />Alertes ({alerts.length})</span>}>
                            <Card>
                                <div className="table-responsive">
                                    <Table hover size="sm" className="align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Heure</th><th>Événement</th><th>Canal</th>
                                                <th>Destinataire</th><th>Statut</th><th>Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {alerts.length === 0 && (
                                                <tr><td colSpan={6} className="text-center text-muted py-4">Aucune alerte émise</td></tr>
                                            )}
                                            {alerts.map(a => (
                                                <tr key={a.alertId} title={a.failureReason ?? a.messageContent.slice(0, 300)}>
                                                    <td className="small">{new Date(a.sentAt ?? a.createdAt).toLocaleString('fr-FR', {
                                                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                                                    <td className="small fw-semibold">{(a.eventType ?? '').replace('xpark.', '')}</td>
                                                    <td>
                                                        <IconifyIcon icon={CHANNEL_ICONS[a.deliveryChannel] ?? 'ri:question-line'} className="me-1" />
                                                        <span className="small">{a.deliveryChannel}</span>
                                                    </td>
                                                    <td className="small text-muted">{a.recipient || '—'}</td>
                                                    <td><Badge bg={STATUS_COLORS[a.alertStatus] ?? 'secondary'}>{a.alertStatus}</Badge></td>
                                                    <td className="fw-bold">{a.criticityScore}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card>
                        </Tab>

                        {/* ── Préférences propriétaire ──────────────── */}
                        <Tab eventKey="prefs" title={<span><IconifyIcon icon="ri:settings-4-line" className="me-1" />Préférences</span>}>
                            {prefs && (
                                <Card>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col md={4}>
                                                <Form.Label className="small fw-bold">Nom du propriétaire</Form.Label>
                                                <Form.Control size="sm" value={prefs.ownerName}
                                                    onChange={e => setPrefs({ ...prefs, ownerName: e.target.value })} />
                                            </Col>
                                            <Col md={4}>
                                                <Form.Label className="small fw-bold">
                                                    <IconifyIcon icon="ri:whatsapp-line" className="me-1 text-success" />
                                                    Numéro WhatsApp
                                                </Form.Label>
                                                <Form.Control size="sm" placeholder="+216 XX XXX XXX" value={prefs.whatsappNumber}
                                                    onChange={e => setPrefs({ ...prefs, whatsappNumber: e.target.value })} />
                                            </Col>
                                            <Col md={4}>
                                                <Form.Label className="small fw-bold">
                                                    <IconifyIcon icon="ri:mail-line" className="me-1 text-primary" />
                                                    Email
                                                </Form.Label>
                                                <Form.Control size="sm" type="email" placeholder="proprietaire@xpark.tn" value={prefs.email}
                                                    onChange={e => setPrefs({ ...prefs, email: e.target.value })} />
                                            </Col>
                                            <Col md={3}>
                                                <Form.Label className="small fw-bold">Seuil WhatsApp (CRITIQUE)</Form.Label>
                                                <Form.Control size="sm" type="number" min={50} max={100} value={prefs.whatsappThreshold}
                                                    onChange={e => setPrefs({ ...prefs, whatsappThreshold: +e.target.value })} />
                                            </Col>
                                            <Col md={3}>
                                                <Form.Label className="small fw-bold">Seuil Email (IMPORTANT)</Form.Label>
                                                <Form.Control size="sm" type="number" min={30} max={100} value={prefs.emailThreshold}
                                                    onChange={e => setPrefs({ ...prefs, emailThreshold: +e.target.value })} />
                                            </Col>
                                            <Col md={3}>
                                                <Form.Label className="small fw-bold">Heures calmes (début → fin)</Form.Label>
                                                <div className="d-flex gap-1 align-items-center">
                                                    <Form.Control size="sm" type="number" min={0} max={23} value={prefs.quietHoursStart}
                                                        onChange={e => setPrefs({ ...prefs, quietHoursStart: +e.target.value })} />
                                                    <span>→</span>
                                                    <Form.Control size="sm" type="number" min={0} max={23} value={prefs.quietHoursEnd}
                                                        onChange={e => setPrefs({ ...prefs, quietHoursEnd: +e.target.value })} />
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <Form.Label className="small fw-bold">Max alertes/jour (anti-fatigue)</Form.Label>
                                                <Form.Control size="sm" type="number" min={5} max={100} value={prefs.maxAlertsPerDay}
                                                    onChange={e => setPrefs({ ...prefs, maxAlertsPerDay: +e.target.value })} />
                                            </Col>
                                            <Col md={12} className="d-flex justify-content-between align-items-center">
                                                <Form.Check type="switch" id="iboa-enabled" label="Alertes activées"
                                                    checked={prefs.enabled}
                                                    onChange={e => setPrefs({ ...prefs, enabled: e.target.checked })} />
                                                <Button variant="primary" size="sm" onClick={savePrefs} disabled={savingPrefs}>
                                                    {savingPrefs
                                                        ? <><Spinner animation="border" size="sm" className="me-1" /> Enregistrement…</>
                                                        : <><IconifyIcon icon="ri:save-3-line" className="me-1" /> Enregistrer</>}
                                                </Button>
                                            </Col>
                                        </Row>
                                        <BsAlert variant="info" className="mt-3 py-2 small mb-0">
                                            <IconifyIcon icon="ri:information-line" className="me-1" />
                                            Sans identifiants Twilio/SMTP configurés (variables d&apos;environnement du conteneur),
                                            les envois sont <strong>simulés</strong> : le message complet est journalisé et visible
                                            dans l&apos;onglet Alertes — le pipeline reste identique.
                                        </BsAlert>
                                    </Card.Body>
                                </Card>
                            )}
                        </Tab>
                    </Tabs>
                </>
            )}
        </>
    )
}
