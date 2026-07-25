import { useEffect, useMemo, useState } from 'react'
import { Badge, Card, CardBody, Col, Row, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { SectionErrorBoundary } from '@/components/ErrorBoundary'
import { permissionsFor } from '@/components/dashboard/analytics/rbac'
import { useAnalyticsData } from '@/components/dashboard/analytics/useAnalyticsData'
import authService from '@/services/authService'
import employeeService from '@/services/employeeService'
import alerteService, { Alerte } from '@/services/alerteService'
import transportRequestService from '@/services/transportRequestService'
import { StatutDemandeTransport, TransportRequest } from '@/types/transportRequest'
import { Employee } from '@/types/employee'
import { StatutMission } from '@/types/mission'

/**
 * Dashboard exécutif — /dashboard.
 *
 * Vue d'ensemble lisible en moins de 30 secondes, 100 % données réelles :
 *  - actions rapides (les gestes quotidiens de l'admin) ;
 *  - 6-7 compteurs essentiels : missions actives / en attente, véhicules
 *    disponibles / en maintenance, chauffeurs, revenus (mois + jour, RBAC) ;
 *  - 3 flux : demandes clients à chiffrer, dernières alertes, activité récente.
 *
 * Tout le reste (graphiques, tops, historique, expirations…) vit sur les pages
 * dédiées — en particulier /analytics (Analyses & KPIs) pour les graphiques.
 */

const tnd = (v: number) => `${Math.round(v).toLocaleString('fr-FR')} TND`
const dateFr = (d?: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '—'

const ALERTE_COLORS: Record<string, string> = { HAUTE: 'danger', MOYENNE: 'warning', BASSE: 'info' }
const MISSION_BADGES: Record<string, string> = {
    EN_ATTENTE: 'warning', EN_COURS: 'primary', TERMINEE: 'success', ANNULEE: 'danger',
}

export default function DashboardPage() {
    const user = authService.getCurrentUser()
    const perms = useMemo(() => permissionsFor(user?.role), [user?.role])

    // Données de base (missions, véhicules) — même hook que la page /analytics
    const { data, stats, loading } = useAnalyticsData(perms)

    // Compléments exécutifs (petites listes)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [alertes, setAlertes] = useState<Alerte[]>([])
    const [demandes, setDemandes] = useState<TransportRequest[]>([])

    useEffect(() => {
        employeeService.getAll().then(setEmployees).catch(() => {})
        alerteService.getAll().then(setAlertes).catch(() => {})
        transportRequestService.getAll().then(setDemandes).catch(() => {})
    }, [])

    // ── Agrégats exécutifs (l'essentiel, rien de plus) ────────────────────────
    const cc = useMemo(() => {
        const chauffeurs = employees.filter(e => (e.post || '').toUpperCase() === 'CHAUFFEUR'
            && (e.statut || 'ACTIF').toUpperCase() !== 'INACTIF').length
        const vehiculesDisponibles = data.vehicules.filter(v => v.statut === 'DISPONIBLE').length
        const vehiculesEnMaintenance = data.vehicules.filter(v => v.statut === 'EN_MAINTENANCE').length

        // Activité récente : dernières missions créées
        const recentes = [...data.missions]
            .sort((a, b) => +new Date(b.dateCreation || b.dateDepart) - +new Date(a.dateCreation || a.dateDepart))
            .slice(0, 6)

        // Demandes clients en attente de devis
        const demandesEnAttente = demandes.filter(d => d.statut === StatutDemandeTransport.PENDING_QUOTATION)

        // Revenus réels : missions terminées du mois en cours / d'aujourd'hui
        const now = new Date()
        let revenusMois = 0, revenusJour = 0
        for (const m of data.missions) {
            if (m.statut !== StatutMission.TERMINEE || !(m.coutTotal > 0)) continue
            const d = new Date(m.dateDepart)
            if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
                revenusMois += m.coutTotal
                if (d.getDate() === now.getDate()) revenusJour += m.coutTotal
            }
        }

        const alertesRecentes = [...alertes]
            .sort((a, b) => +new Date(b.dateCreation) - +new Date(a.dateCreation))
            .slice(0, 6)

        return {
            chauffeurs, vehiculesDisponibles, vehiculesEnMaintenance,
            recentes, demandesEnAttente, revenusMois, revenusJour, alertesRecentes,
        }
    }, [data, employees, demandes, alertes])

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Chargement du centre de commandement…</p>
            </div>
        )
    }

    // Compteurs essentiels (style des cartes conservé) — 6, +1 finance
    const counters: { label: string; value: string | number; sub?: string; icon: string; color: string; to: string }[] = [
        { label: 'Missions actives', value: stats.missionsParStatut.enCours, icon: 'ri:truck-line', color: 'primary', to: '/gestion/suivi' },
        { label: 'En attente de validation', value: stats.missionsParStatut.enAttente, icon: 'ri:time-line', color: 'warning', to: '/gestion/missions' },
        { label: 'Véhicules disponibles', value: cc.vehiculesDisponibles, sub: `sur ${data.vehicules.length}`, icon: 'ri:checkbox-circle-line', color: 'success', to: '/gestion/vehicules' },
        { label: 'En maintenance', value: cc.vehiculesEnMaintenance, icon: 'ri:tools-line', color: 'danger', to: '/maintenance/interventions' },
        { label: 'Chauffeurs', value: cc.chauffeurs, icon: 'ri:steering-2-line', color: 'info', to: '/hr/employees' },
        ...(perms.finance ? [
            { label: 'Revenus du mois', value: tnd(cc.revenusMois), sub: cc.revenusJour > 0 ? `dont ${tnd(cc.revenusJour)} aujourd'hui` : "0 TND aujourd'hui", icon: 'ri:money-dollar-circle-line', color: 'success', to: '/analytics' },
        ] : []),
    ]

    const quickActions = [
        { label: 'Nouvelle mission', icon: 'ri:map-pin-add-line', to: '/gestion/missions', variant: 'primary' },
        { label: `Devis à chiffrer (${cc.demandesEnAttente.length})`, icon: 'ri:price-tag-3-line', to: '/gestion/demandes-transport', variant: cc.demandesEnAttente.length > 0 ? 'danger' : 'outline-secondary' },
        { label: 'Suivi en direct', icon: 'ri:base-station-line', to: '/gestion/suivi', variant: 'outline-primary' },
        { label: 'Optimiser le planning', icon: 'ri:brain-line', to: '/gestion/optimisateur', variant: 'dark' },
        { label: 'Analyses & KPIs', icon: 'ri:pie-chart-line', to: '/analytics', variant: 'outline-secondary' },
        { label: 'Alertes', icon: 'ri:alarm-warning-line', to: '/alertes', variant: 'outline-warning' },
    ]

    return (
        <>
            <PageBreadcrumb title="Dashboard" />

            {/* ── Actions rapides ─────────────────────────────────────────── */}
            <SectionErrorBoundary sectionName="Actions rapides">
                <div className="d-flex gap-2 flex-wrap mb-3">
                    {quickActions.map(a => (
                        <Link key={a.label} to={a.to} className={`btn btn-sm btn-${a.variant} d-flex align-items-center gap-1`}>
                            <IconifyIcon icon={a.icon} /> {a.label}
                        </Link>
                    ))}
                </div>
            </SectionErrorBoundary>

            {/* ── Compteurs temps réel ────────────────────────────────────── */}
            <SectionErrorBoundary sectionName="Compteurs temps réel">
                <Row className="g-3 mb-4">
                    {counters.map(c => (
                        <Col key={c.label} xl={4} md={4} sm={6} className="col-xxl">
                            <Card className="border-0 shadow-sm h-100">
                                <CardBody className="py-3">
                                    <Link to={c.to} className="text-decoration-none">
                                        <div className="d-flex align-items-center gap-3">
                                            <span className={`avatar-md bg-${c.color}-subtle text-${c.color} rounded d-flex align-items-center justify-content-center flex-shrink-0`}>
                                                <IconifyIcon icon={c.icon} className="fs-22" />
                                            </span>
                                            <div className="min-w-0">
                                                <h4 className="mb-0 fw-bold text-dark text-truncate">{c.value}</h4>
                                                <span className="text-muted small">{c.label}</span>
                                                {c.sub && <div className="text-muted" style={{ fontSize: 11 }}>{c.sub}</div>}
                                            </div>
                                        </div>
                                    </Link>
                                </CardBody>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </SectionErrorBoundary>

            {/* ── Flux : demandes clients + alertes + activité récente ───── */}
            <SectionErrorBoundary sectionName="Flux temps réel">
                <Row className="g-3 mb-4">
                    <Col xl={4}>
                        <FeedCard title="Demandes clients à chiffrer" icon="ri:price-tag-3-line" color="danger"
                            to="/gestion/demandes-transport" emptyText="Aucune demande en attente de devis ✅">
                            {cc.demandesEnAttente.slice(0, 5).map(d => (
                                <FeedItem key={d.idTransportRequest}
                                    icon="ri:user-line"
                                    title={`${d.villeDepart} → ${d.villeArrivee}`}
                                    subtitle={`${d.clientNom || 'Client'} · ~${Math.round(d.aiEstimatedPrice)} TND (IA)`}
                                    right={dateFr(d.dateCreation)} />
                            ))}
                        </FeedCard>
                    </Col>
                    <Col xl={4}>
                        <FeedCard title="Dernières alertes" icon="ri:alarm-warning-line" color="warning"
                            to="/alertes" emptyText="Aucune alerte 🎉">
                            {cc.alertesRecentes.map(a => (
                                <FeedItem key={a.idAlerte}
                                    icon="ri:error-warning-line"
                                    title={a.message}
                                    subtitle={a.typeAlerte}
                                    badge={{ text: a.priorite, bg: ALERTE_COLORS[a.priorite] || 'secondary' }}
                                    right={dateFr(a.dateCreation)} />
                            ))}
                        </FeedCard>
                    </Col>
                    <Col xl={4}>
                        <FeedCard title="Activité récente (missions)" icon="ri:history-line" color="primary"
                            to="/gestion/missions" emptyText="Aucune mission récente">
                            {cc.recentes.map(m => (
                                <FeedItem key={m.idMission}
                                    icon="ri:truck-line"
                                    title={`#${m.idMission} · ${m.villeDepart || '—'} → ${m.villeArrivee || m.destination}`}
                                    subtitle={m.chauffeurNom || 'Non affectée'}
                                    badge={{ text: m.statut.replace('_', ' '), bg: MISSION_BADGES[m.statut] || 'secondary' }}
                                    right={dateFr(m.dateCreation || m.dateDepart)} />
                            ))}
                        </FeedCard>
                    </Col>
                </Row>
            </SectionErrorBoundary>

        </>
    )
}

/* ── Petits composants de flux (style des cartes du dashboard conservé) ────── */

function FeedCard({ title, icon, color, to, emptyText, children }: {
    title: string; icon: string; color: string; to: string; emptyText: string; children: React.ReactNode
}) {
    const items = Array.isArray(children) ? children.flat().filter(Boolean) : children ? [children] : []
    return (
        <Card className="border-0 shadow-sm h-100">
            <CardBody>
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="d-flex align-items-center gap-2 mb-0">
                        <span className={`bg-${color}-subtle text-${color} avatar-xs rounded-circle d-flex align-items-center justify-content-center`}>
                            <IconifyIcon icon={icon} />
                        </span>
                        {title}
                    </h5>
                    <Link to={to} className="small text-decoration-none">Tout voir →</Link>
                </div>
                {items.length === 0
                    ? <p className="text-muted small mb-0">{emptyText}</p>
                    : <div className="d-flex flex-column gap-2">{children}</div>}
            </CardBody>
        </Card>
    )
}

function FeedItem({ icon, title, subtitle, badge, right }: {
    icon: string; title: string; subtitle?: string
    badge?: { text: string; bg: string }; right?: string
}) {
    return (
        <div className="d-flex align-items-start gap-2 border-bottom pb-2">
            <IconifyIcon icon={icon} className="text-muted mt-1 flex-shrink-0" />
            <div className="flex-grow-1 min-w-0">
                <div className="small fw-semibold text-truncate">{title}</div>
                {/* text-truncate indispensable : les types d'alerte sont des
                    jetons sans espace (MISSION_SANS_AFFECTATION…) qui, sans
                    troncature, élargissent la ligne et poussent le badge hors
                    de la carte. */}
                {subtitle && <div className="text-muted text-truncate" style={{ fontSize: 11 }}>{subtitle}</div>}
            </div>
            {badge && <Badge bg={badge.bg} className="flex-shrink-0 fw-normal align-self-start">{badge.text}</Badge>}
            {right && <span className="text-muted flex-shrink-0 align-self-start" style={{ fontSize: 11 }}>{right}</span>}
        </div>
    )
}
