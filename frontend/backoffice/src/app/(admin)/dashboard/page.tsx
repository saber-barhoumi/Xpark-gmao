import { useEffect, useMemo, useState } from 'react'
import { Badge, Card, CardBody, Col, Row, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import { SectionErrorBoundary } from '@/components/ErrorBoundary'
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard'
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
 * Dashboard unifié — /dashboard (fusion Dashboard + Analytics).
 *
 * Centre de commandement des administrateurs : TOUT est calculé depuis la
 * vraie base (aucune valeur statique).
 *  - Rangée « command center » : compteurs temps réel (flotte, chauffeurs,
 *    missions, maintenance, finance) + actions rapides.
 *  - Flux : demandes clients à chiffrer, dernières alertes, activité récente,
 *    maintenance à venir & expirations, top chauffeurs / véhicules.
 *  - Graphiques : la section analytique complète (AnalyticsDashboard) est
 *    intégrée EN PARTAGEANT le même chargement de données (prop `shared`,
 *    zéro requête dupliquée). L'ancienne page /analytics redirige ici.
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

    // Données analytiques (missions, véhicules, interventions, carburant, KPIs)
    // — chargées UNE fois, partagées avec la section graphiques.
    const analytics = useAnalyticsData(perms)
    const { data, stats, loading } = analytics

    // Compléments command-center (petites listes)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [alertes, setAlertes] = useState<Alerte[]>([])
    const [demandes, setDemandes] = useState<TransportRequest[]>([])

    useEffect(() => {
        employeeService.getAll().then(setEmployees).catch(() => {})
        alerteService.getAll().then(setAlertes).catch(() => {})
        transportRequestService.getAll().then(setDemandes).catch(() => {})
    }, [])

    // ── Agrégats temps réel du command center ────────────────────────────────
    const cc = useMemo(() => {
        const chauffeurs = employees.filter(e => (e.post || '').toUpperCase() === 'CHAUFFEUR')
        const vehiculesActifs = data.vehicules.filter(v => v.actif !== false && v.statut !== 'HORS_SERVICE').length
        const enMaintenance = data.interventions.filter(i => ['PLANIFIEE', 'EN_COURS', 'EN_ATTENTE'].includes(i.statut)).length

        // Activité récente : dernières missions créées
        const recentes = [...data.missions]
            .sort((a, b) => +new Date(b.dateCreation || b.dateDepart) - +new Date(a.dateCreation || a.dateDepart))
            .slice(0, 6)

        // Demandes clients en attente de devis + dernières réservations
        const demandesEnAttente = demandes.filter(d => d.statut === StatutDemandeTransport.PENDING_QUOTATION)
        const reservationsRecentes = [...demandes]
            .sort((a, b) => +new Date(b.dateCreation) - +new Date(a.dateCreation))
            .slice(0, 5)

        // Maintenance à venir (planifiée / en attente, la plus proche d'abord)
        const now = Date.now()
        const maintenanceAVenir = data.interventions
            .filter(i => ['PLANIFIEE', 'EN_ATTENTE'].includes(i.statut))
            .sort((a, b) => +new Date(a.dateIntervention) - +new Date(b.dateIntervention))
            .slice(0, 5)

        // Expirations sous 30 jours : permis chauffeurs + prochaines révisions véhicules
        const in30d = now + 30 * 86_400_000
        const expirations: { icon: string; label: string; date: string; overdue: boolean }[] = []
        for (const e of employees) {
            if (!e.dateExpirationPermis) continue
            const t = +new Date(e.dateExpirationPermis)
            if (t <= in30d) expirations.push({
                icon: 'ri:id-card-line',
                label: `Permis — ${e.prenom} ${e.name}`,
                date: e.dateExpirationPermis, overdue: t < now,
            })
        }
        for (const v of data.vehicules) {
            const rev = (v as any).dateProchaineRevision as string | undefined
            if (!rev) continue
            const t = +new Date(rev)
            if (t <= in30d) expirations.push({
                icon: 'ri:car-line',
                label: `Révision / visite — ${v.immatriculation}`,
                date: rev, overdue: t < now,
            })
        }
        expirations.sort((a, b) => +new Date(a.date) - +new Date(b.date))

        // Top chauffeurs + véhicules les plus utilisés (missions non annulées)
        const parChauffeur: Record<string, number> = {}
        const parVehicule: Record<string, number> = {}
        for (const m of data.missions) {
            if (m.statut === StatutMission.ANNULEE) continue
            if (m.chauffeurNom) parChauffeur[m.chauffeurNom] = (parChauffeur[m.chauffeurNom] || 0) + 1
            if (m.vehiculeImmatriculation) parVehicule[m.vehiculeImmatriculation] = (parVehicule[m.vehiculeImmatriculation] || 0) + 1
        }
        const topChauffeurs = Object.entries(parChauffeur).sort((a, b) => b[1] - a[1]).slice(0, 5)
        const topVehicules = Object.entries(parVehicule).sort((a, b) => b[1] - a[1]).slice(0, 5)

        const alertesRecentes = [...alertes]
            .sort((a, b) => +new Date(b.dateCreation) - +new Date(a.dateCreation))
            .slice(0, 6)

        return {
            chauffeurs: chauffeurs.length, vehiculesActifs, enMaintenance,
            recentes, demandesEnAttente, reservationsRecentes,
            maintenanceAVenir, expirations: expirations.slice(0, 6),
            topChauffeurs, topVehicules, alertesRecentes,
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

    // Compteurs temps réel (style des cartes du dashboard d'origine conservé)
    const counters: { label: string; value: string | number; icon: string; color: string; to: string }[] = [
        { label: 'Véhicules', value: data.vehicules.length, icon: 'ri:car-line', color: 'primary', to: '/gestion/vehicules' },
        { label: 'Véhicules actifs', value: cc.vehiculesActifs, icon: 'ri:checkbox-circle-line', color: 'success', to: '/gestion/vehicules' },
        { label: 'Chauffeurs', value: cc.chauffeurs, icon: 'ri:steering-2-line', color: 'info', to: '/hr/employees' },
        { label: 'Missions en cours', value: stats.missionsParStatut.enCours, icon: 'ri:truck-line', color: 'primary', to: '/gestion/suivi' },
        { label: 'Missions en attente', value: stats.missionsParStatut.enAttente, icon: 'ri:time-line', color: 'warning', to: '/gestion/missions' },
        { label: 'Maintenance', value: cc.enMaintenance, icon: 'ri:tools-line', color: 'danger', to: '/maintenance/interventions' },
        ...(perms.finance ? [
            { label: 'Revenus (6 mois)', value: tnd(stats.revenusTotal), icon: 'ri:money-dollar-circle-line', color: 'success', to: '/invoices' },
            { label: 'Coûts (6 mois)', value: tnd(stats.coutsTotal), icon: 'ri:shopping-cart-line', color: 'danger', to: '/operations/carburant' },
            { label: 'Profit (6 mois)', value: tnd(stats.revenusTotal - stats.coutsTotal), icon: 'ri:line-chart-line', color: (stats.revenusTotal - stats.coutsTotal) >= 0 ? 'success' : 'danger', to: '/dashboard' },
        ] : []),
    ]

    const quickActions = [
        { label: 'Nouvelle mission', icon: 'ri:map-pin-add-line', to: '/gestion/missions', variant: 'primary' },
        { label: `Devis à chiffrer (${cc.demandesEnAttente.length})`, icon: 'ri:price-tag-3-line', to: '/gestion/demandes-transport', variant: cc.demandesEnAttente.length > 0 ? 'danger' : 'outline-secondary' },
        { label: 'Suivi en direct', icon: 'ri:base-station-line', to: '/gestion/suivi', variant: 'outline-primary' },
        { label: 'Optimiser le planning', icon: 'ri:brain-line', to: '/gestion/optimisateur', variant: 'dark' },
        { label: 'Alertes', icon: 'ri:alarm-warning-line', to: '/alertes', variant: 'outline-warning' },
        { label: 'Rapport IBOA', icon: 'ri:radar-line', to: '/monitoring/iboa', variant: 'outline-secondary' },
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

            {/* ── Flux : maintenance/expirations + réservations + tops ───── */}
            <SectionErrorBoundary sectionName="Maintenance et classements">
                <Row className="g-3 mb-4">
                    <Col xl={4}>
                        <FeedCard title="Maintenance à venir & expirations" icon="ri:tools-line" color="danger"
                            to="/maintenance/interventions" emptyText="Rien à signaler sous 30 jours ✅">
                            {cc.maintenanceAVenir.map(i => (
                                <FeedItem key={`i-${i.idIntervention}`}
                                    icon="ri:calendar-check-line"
                                    title={`${i.typeIntervention} — ${i.vehiculeImmatriculation || 'véhicule'}`}
                                    subtitle={i.statut.replace('_', ' ')}
                                    right={dateFr(i.dateIntervention)} />
                            ))}
                            {cc.expirations.map((x, k) => (
                                <FeedItem key={`x-${k}`}
                                    icon={x.icon}
                                    title={x.label}
                                    badge={x.overdue ? { text: 'EXPIRÉ', bg: 'danger' } : { text: '< 30 j', bg: 'warning' }}
                                    right={new Date(x.date).toLocaleDateString('fr-FR')} />
                            ))}
                        </FeedCard>
                    </Col>
                    <Col xl={4}>
                        <FeedCard title="Réservations récentes (devis)" icon="ri:file-list-3-line" color="info"
                            to="/gestion/demandes-transport" emptyText="Aucune réservation">
                            {cc.reservationsRecentes.map(d => (
                                <FeedItem key={d.idTransportRequest}
                                    icon="ri:route-line"
                                    title={`${d.villeDepart} → ${d.villeArrivee}`}
                                    subtitle={d.clientNom || 'Client'}
                                    badge={{
                                        text: d.statut === 'PENDING_QUOTATION' ? 'À chiffrer'
                                            : d.statut === 'QUOTATION_SENT' ? 'Devis envoyé'
                                            : d.statut === 'ACCEPTED' ? 'Accepté'
                                            : d.statut === 'REJECTED' ? 'Refusé' : 'Annulée',
                                        bg: d.statut === 'ACCEPTED' ? 'success' : d.statut === 'PENDING_QUOTATION' ? 'warning'
                                            : d.statut === 'QUOTATION_SENT' ? 'info' : 'secondary',
                                    }}
                                    right={dateFr(d.dateCreation)} />
                            ))}
                        </FeedCard>
                    </Col>
                    <Col xl={4}>
                        <Card className="border-0 shadow-sm h-100">
                            <CardBody>
                                <h5 className="d-flex align-items-center gap-2 mb-3">
                                    <span className="bg-success-subtle text-success avatar-xs rounded-circle d-flex align-items-center justify-content-center">
                                        <IconifyIcon icon="ri:award-line" />
                                    </span>
                                    Top chauffeurs & véhicules
                                </h5>
                                <p className="text-muted text-uppercase fw-bold fs-11 mb-1">Chauffeurs (missions)</p>
                                {cc.topChauffeurs.length === 0 && <p className="text-muted small mb-2">Aucune affectation</p>}
                                {cc.topChauffeurs.map(([nom, n], i) => (
                                    <RankRow key={nom} rank={i + 1} label={nom} value={`${n} mission${n > 1 ? 's' : ''}`} />
                                ))}
                                <p className="text-muted text-uppercase fw-bold fs-11 mb-1 mt-3">Véhicules les plus utilisés</p>
                                {cc.topVehicules.length === 0 && <p className="text-muted small mb-0">Aucune utilisation</p>}
                                {cc.topVehicules.map(([immat, n], i) => (
                                    <RankRow key={immat} rank={i + 1} label={immat} value={`${n} mission${n > 1 ? 's' : ''}`} />
                                ))}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </SectionErrorBoundary>

            {/* ── Section analytique complète (données partagées, zéro re-fetch) ── */}
            <SectionErrorBoundary sectionName="Analyses & KPIs">
                <AnalyticsDashboard shared={analytics} embedded />
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
                {subtitle && <div className="text-muted" style={{ fontSize: 11 }}>{subtitle}</div>}
            </div>
            {badge && <Badge bg={badge.bg} className="flex-shrink-0 fw-normal">{badge.text}</Badge>}
            {right && <span className="text-muted flex-shrink-0" style={{ fontSize: 11 }}>{right}</span>}
        </div>
    )
}

function RankRow({ rank, label, value }: { rank: number; label: string; value: string }) {
    const medals = ['🥇', '🥈', '🥉']
    return (
        <div className="d-flex align-items-center gap-2 py-1 border-bottom">
            <span style={{ width: 22 }}>{medals[rank - 1] ?? `${rank}.`}</span>
            <span className="fw-semibold small flex-grow-1 text-truncate">{label}</span>
            <span className="text-muted small">{value}</span>
        </div>
    )
}
