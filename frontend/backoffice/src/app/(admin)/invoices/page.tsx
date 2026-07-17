import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, Col, Form, Row, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import authService from '@/services/authService'
import factureService, { Facture } from '@/services/factureService'

/**
 * Factures — /invoices (100 % dynamique, Finance.API).
 *
 * Liste réelle des factures XPARK : KPIs (CA, payées, impayées), filtres par
 * statut, recherche, encaissement (payer), annulation motivée (une facture ne
 * se supprime jamais — piste d'audit comptable), aperçu du document imprimable.
 */

const STATUTS = ['EN_ATTENTE', 'PAYEE', 'EN_RETARD', 'ANNULEE'] as const
const STATUT_BADGE: Record<string, { bg: string; label: string }> = {
    EN_ATTENTE: { bg: 'warning', label: 'En attente' },
    PAYEE: { bg: 'success', label: 'Payée' },
    EN_RETARD: { bg: 'danger', label: 'En retard' },
    ANNULEE: { bg: 'secondary', label: 'Annulée' },
}

const dt = (v: number) => `${v.toFixed(3)} DT`
const dateFr = (d?: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function InvoicesPage() {
    const [factures, setFactures] = useState<Facture[]>([])
    const [loading, setLoading] = useState(true)
    const [statut, setStatut] = useState('')
    const [search, setSearch] = useState('')
    const [busyId, setBusyId] = useState<number | null>(null)

    const role = authService.getCurrentUser()?.role
    const canWrite = role === 'ADMIN' || role === 'GESTIONNAIRE'

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const { items } = await factureService.getAll(1, 200, statut || undefined)
            setFactures(items)
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Impossible de charger les factures.', 'error')
        } finally {
            setLoading(false)
        }
    }, [statut])

    useEffect(() => { load() }, [load])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return factures
        return factures.filter(f =>
            `${f.numeroFacture} ${f.clientPrenom ?? ''} ${f.clientNom ?? ''} ${f.clientEmail ?? ''} ${f.missionReference ?? ''}`
                .toLowerCase().includes(q))
    }, [factures, search])

    const kpi = useMemo(() => ({
        total: factures.length,
        payees: factures.filter(f => f.statut === 'PAYEE').length,
        impayees: factures.filter(f => f.statut === 'EN_ATTENTE' || f.statut === 'EN_RETARD').length,
        ca: factures.filter(f => f.statut === 'PAYEE').reduce((s, f) => s + f.montantTTC, 0),
        enAttente: factures.filter(f => f.statut !== 'PAYEE' && f.statut !== 'ANNULEE')
            .reduce((s, f) => s + f.montantTTC, 0),
    }), [factures])

    const payer = async (f: Facture) => {
        const res = await Swal.fire({
            title: `Encaisser ${f.numeroFacture} ?`,
            html: `<strong>${dt(f.montantTTC)}</strong> — ${f.clientPrenom ?? ''} ${f.clientNom ?? ''}`,
            input: 'select',
            inputOptions: { VIREMENT: 'Virement', ESPECES: 'Espèces', CHEQUE: 'Chèque', CARTE: 'Carte' },
            inputPlaceholder: 'Méthode de paiement',
            showCancelButton: true, confirmButtonText: 'Marquer payée', cancelButtonText: 'Annuler',
            confirmButtonColor: '#198754',
        })
        if (!res.isConfirmed) return
        setBusyId(f.idFacture)
        try {
            await factureService.payer(f.idFacture, res.value || undefined)
            await load()
            Swal.fire('Encaissée', `${f.numeroFacture} est marquée payée.`, 'success')
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Opération impossible.', 'error')
        } finally { setBusyId(null) }
    }

    const annuler = async (f: Facture) => {
        const res = await Swal.fire({
            title: `Annuler ${f.numeroFacture} ?`,
            input: 'text', inputPlaceholder: "Motif d'annulation (obligatoire)",
            inputValidator: v => !v?.trim() ? 'Le motif est obligatoire' : undefined,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Annuler la facture', cancelButtonText: 'Retour',
            confirmButtonColor: '#dc3545',
        })
        if (!res.isConfirmed) return
        setBusyId(f.idFacture)
        try {
            await factureService.annuler(f.idFacture, res.value.trim())
            await load()
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Opération impossible.', 'error')
        } finally { setBusyId(null) }
    }

    return (
        <>
            <PageBreadcrumb title="Factures" />

            <Row className="mb-3 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="tabler:invoice" className="me-2 text-primary" />
                        Facturation
                    </h4>
                    <p className="text-muted mb-0">{kpi.total} facture(s) — encaissement, annulation motivée, document imprimable XPARK</p>
                </Col>
                <Col xs="auto" className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={load} disabled={loading}>
                        {loading ? <Spinner size="sm" animation="border" /> : <IconifyIcon icon="ri:refresh-line" />} Actualiser
                    </Button>
                    {canWrite && (
                        <Link to="/invoices/create-invoice" className="btn btn-primary btn-sm">
                            <IconifyIcon icon="ri:add-line" className="me-1" /> Nouvelle facture
                        </Link>
                    )}
                </Col>
            </Row>

            {/* ── KPIs ─────────────────────────────────────────────── */}
            <Row className="g-3 mb-3">
                {[
                    { label: 'Encaissé (payées)', value: dt(kpi.ca), color: 'success', icon: 'ri:money-dollar-circle-line' },
                    { label: 'En attente d’encaissement', value: dt(kpi.enAttente), color: 'warning', icon: 'ri:time-line' },
                    { label: 'Factures payées', value: kpi.payees, color: 'success', icon: 'ri:checkbox-circle-line' },
                    { label: 'Impayées / en retard', value: kpi.impayees, color: 'danger', icon: 'ri:alarm-warning-line' },
                ].map(k => (
                    <Col md={3} sm={6} key={k.label}>
                        <Card className="border-0 shadow-sm h-100"><CardBody className="py-3">
                            <div className="d-flex align-items-center gap-3">
                                <span className={`avatar-md bg-${k.color}-subtle text-${k.color} rounded d-flex align-items-center justify-content-center`}>
                                    <IconifyIcon icon={k.icon} className="fs-22" />
                                </span>
                                <div className="min-w-0">
                                    <h5 className="mb-0 fw-bold text-truncate">{k.value}</h5>
                                    <span className="text-muted small">{k.label}</span>
                                </div>
                            </div>
                        </CardBody></Card>
                    </Col>
                ))}
            </Row>

            {/* ── Filtres ──────────────────────────────────────────── */}
            <Row className="g-2 mb-3 align-items-center">
                <Col xs="auto" className="d-flex gap-2 flex-wrap">
                    <Button size="sm" variant={statut === '' ? 'primary' : 'outline-primary'} onClick={() => setStatut('')}>Toutes</Button>
                    {STATUTS.map(s => (
                        <Button key={s} size="sm" variant={statut === s ? 'primary' : 'outline-primary'} onClick={() => setStatut(s)}>
                            {STATUT_BADGE[s].label}
                        </Button>
                    ))}
                </Col>
                <Col style={{ minWidth: 200, maxWidth: 320 }} className="ms-auto">
                    <Form.Control size="sm" type="search" placeholder="🔍 N°, client, mission…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </Col>
            </Row>

            {/* ── Liste ────────────────────────────────────────────── */}
            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : filtered.length === 0 ? (
                <Card><CardBody className="text-center text-muted py-5">
                    <IconifyIcon icon="tabler:invoice" className="fs-1 d-block mx-auto mb-2 opacity-25" />
                    {search || statut ? 'Aucune facture ne correspond aux critères.' : 'Aucune facture — créez la première depuis « Nouvelle facture ».'}
                </CardBody></Card>
            ) : (
                <Card>
                    <div className="table-responsive">
                        <table className="table table-hover table-centered align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>N° Facture</th>
                                    <th>Client</th>
                                    <th>Mission</th>
                                    <th>Émission</th>
                                    <th>Échéance</th>
                                    <th className="text-end">Montant TTC</th>
                                    <th>Statut</th>
                                    <th style={{ width: 170 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(f => {
                                    const b = STATUT_BADGE[f.statut] ?? { bg: 'secondary', label: f.statut }
                                    const late = f.statut === 'EN_ATTENTE' && f.dateEcheance && new Date(f.dateEcheance) < new Date()
                                    return (
                                        <tr key={f.idFacture}>
                                            <td><Link to={`/invoices/view-invoice?id=${f.idFacture}`} className="fw-bold text-primary">{f.numeroFacture}</Link></td>
                                            <td>
                                                <div className="fw-semibold">{f.clientPrenom} {f.clientNom}</div>
                                                <small className="text-muted">{f.clientEmail}</small>
                                            </td>
                                            <td>{f.missionId ? <Badge bg="info" className="fw-normal">#{f.missionId}{f.missionReference ? ` · ${f.missionReference}` : ''}</Badge> : <span className="text-muted">—</span>}</td>
                                            <td className="small">{dateFr(f.dateFacture)}</td>
                                            <td className={`small ${late ? 'text-danger fw-bold' : ''}`}>{dateFr(f.dateEcheance)}</td>
                                            <td className="text-end fw-bold">{dt(f.montantTTC)}</td>
                                            <td><Badge bg={late ? 'danger' : b.bg}>{late ? 'En retard' : b.label}</Badge></td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <Link to={`/invoices/view-invoice?id=${f.idFacture}`}
                                                        className="btn btn-light btn-sm text-primary" title="Voir / imprimer">
                                                        <IconifyIcon icon="ri:eye-line" />
                                                    </Link>
                                                    {canWrite && (f.statut === 'EN_ATTENTE' || f.statut === 'EN_RETARD') && (
                                                        <>
                                                            <Button variant="light" size="sm" className="text-success" title="Marquer payée"
                                                                disabled={busyId === f.idFacture} onClick={() => payer(f)}>
                                                                <IconifyIcon icon="ri:money-dollar-circle-line" />
                                                            </Button>
                                                            <Button variant="light" size="sm" className="text-danger" title="Annuler (motif)"
                                                                disabled={busyId === f.idFacture} onClick={() => annuler(f)}>
                                                                <IconifyIcon icon="ri:close-circle-line" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </>
    )
}
