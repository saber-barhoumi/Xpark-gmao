import { useState, useEffect, useCallback, useMemo } from 'react'
import { Badge, Button, Card, Col, Form, Row, Spinner, Alert } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Swal from 'sweetalert2'
import authService from '@/services/authService'
import transportRequestService from '@/services/transportRequestService'
import { StatutDemandeTransport, TransportRequest } from '@/types/transportRequest'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import QuotationModal from './components/QuotationModal'

/**
 * Demandes de Transport (devis) — /gestion/demandes-transport
 *
 * Étape AVANT la Mission : le staff voit les demandes clients, chiffre et envoie
 * un devis. Le client accepte (→ Mission créée, EN_ATTENTE, affectée par
 * l'OptimisateurFlotteIA) ou refuse. Une demande n'est PAS une mission.
 *
 * Actions : chiffrer, supprimer (unitaire / sélection / tout — même patron que
 * la page /alertes), rechercher, actualiser, exporter (PDF via impression
 * navigateur — convention du projet, zéro dépendance — et CSV).
 */

const STATUT_COLORS: Record<string, string> = {
    PENDING_QUOTATION: 'warning',
    QUOTATION_SENT: 'info',
    ACCEPTED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'secondary',
}
const STATUT_LABELS: Record<string, string> = {
    PENDING_QUOTATION: 'À chiffrer',
    QUOTATION_SENT: 'Devis envoyé',
    ACCEPTED: 'Accepté',
    REJECTED: 'Refusé',
    CANCELLED: 'Annulée',
}
const PRICING_LABELS: Record<string, string> = {
    AI_PRICE: 'Prix IA', MODIFIED: 'Prix IA ajusté', MANUAL: 'Prix manuel',
}

const fmtDT = (d: string) => new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

/** Document imprimable (l'utilisateur choisit « Enregistrer au format PDF »). */
function exportPdf(rows: TransportRequest[]) {
    const w = window.open('', '_blank', 'width=1000,height=700')
    if (!w) { Swal.fire('Bloqué', 'Autorisez les fenêtres pop-up pour exporter en PDF.', 'warning'); return }
    const tr = rows.map(r => `
        <tr>
            <td>#${r.idTransportRequest}</td>
            <td>${fmtDT(r.dateSouhaitee)}</td>
            <td><strong>${r.villeDepart} → ${r.villeArrivee}</strong><br/><small>${r.cargoDescription} · ${r.cargoWeightKg} kg</small></td>
            <td>${r.clientNom || `Client #${r.clientIdUtilisateur}`}</td>
            <td style="text-align:right">${r.distanceKm.toFixed(0)} km</td>
            <td style="text-align:right">${r.aiEstimatedPrice.toFixed(2)} TND<br/><small>(${r.aiPriceRangeMin.toFixed(0)}–${r.aiPriceRangeMax.toFixed(0)})</small></td>
            <td style="text-align:right">${r.finalPrice != null ? `${r.finalPrice.toFixed(2)} TND<br/><small>${PRICING_LABELS[r.pricingMethod || ''] || ''}</small>` : '—'}</td>
            <td>${STATUT_LABELS[r.statut] || r.statut}</td>
        </tr>`).join('')
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"/>
        <title>XPARK — Demandes de Transport</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2b38; margin: 28px; }
            h1 { font-size: 20px; margin: 0 0 2px; } h1 span { color: #C11425; }
            .sub { color: #6b7280; font-size: 12px; margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #0F1B24; color: #fff; text-align: left; padding: 7px 8px; }
            td { border-bottom: 1px solid #e6e9ee; padding: 7px 8px; vertical-align: top; }
            small { color: #6b7280; }
            @media print { @page { size: A4 landscape; margin: 12mm; } }
        </style></head><body>
        <h1><span>XPARK</span> — Demandes de Transport (devis)</h1>
        <div class="sub">Exporté le ${new Date().toLocaleString('fr-FR')} · ${rows.length} demande(s)</div>
        <table><thead><tr>
            <th>#</th><th>Date souhaitée</th><th>Trajet &amp; Fret</th><th>Client</th>
            <th>Distance</th><th>Estim. IA</th><th>Devis</th><th>Statut</th>
        </tr></thead><tbody>${tr}</tbody></table>
        <script>window.onload = () => { window.print(); }</script>
        </body></html>`)
    w.document.close()
}

/** Export CSV (Excel FR : séparateur ; + BOM UTF-8). */
function exportCsv(rows: TransportRequest[]) {
    const head = ['Id', 'DateSouhaitee', 'VilleDepart', 'VilleArrivee', 'Fret', 'PoidsKg', 'Client',
        'DistanceKm', 'EstimationIA', 'FourchetteMin', 'FourchetteMax', 'PrixDevis', 'MethodePrix', 'Statut']
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = rows.map(r => [
        r.idTransportRequest, fmtDT(r.dateSouhaitee), r.villeDepart, r.villeArrivee, r.cargoDescription,
        r.cargoWeightKg, r.clientNom || `Client #${r.clientIdUtilisateur}`, r.distanceKm.toFixed(1),
        r.aiEstimatedPrice.toFixed(2), r.aiPriceRangeMin.toFixed(2), r.aiPriceRangeMax.toFixed(2),
        r.finalPrice?.toFixed(2) ?? '', PRICING_LABELS[r.pricingMethod || ''] || '', STATUT_LABELS[r.statut] || r.statut,
    ].map(esc).join(';'))
    const blob = new Blob(['﻿' + [head.join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `demandes-transport-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
}

export default function DemandesTransportPage() {
    const [requests, setRequests] = useState<TransportRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<StatutDemandeTransport | undefined>(undefined)
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState<Set<number>>(new Set())
    const [deleting, setDeleting] = useState(false)

    const currentUser = authService.getCurrentUser()
    const canWrite = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADMINISTRATEUR' || currentUser?.role === 'GESTIONNAIRE'

    const [showQuote, setShowQuote] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<TransportRequest | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            setRequests(await transportRequestService.getAll(filter))
        } catch {
            setError('Impossible de charger les demandes de transport.')
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => { load() }, [load])
    // Changer de filtre invalide la sélection courante
    useEffect(() => { setSelected(new Set()) }, [filter])

    // ── Recherche plein texte côté client (trajet, client, fret) ──────────────
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return requests
        return requests.filter(r =>
            `${r.villeDepart} ${r.villeArrivee} ${r.clientNom ?? ''} ${r.cargoDescription} #${r.idTransportRequest}`
                .toLowerCase().includes(q))
    }, [requests, search])

    // ── Sélection (même patron que /alertes) ──────────────────────────────────
    const allFilteredSelected = filtered.length > 0 && filtered.every(r => selected.has(r.idTransportRequest))
    const toggleSelect = (id: number) =>
        setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    const toggleSelectAll = () =>
        setSelected(allFilteredSelected ? new Set() : new Set(filtered.map(r => r.idTransportRequest)))

    // ── Suppressions ──────────────────────────────────────────────────────────
    const removeOne = async (r: TransportRequest) => {
        const confirm = await Swal.fire({
            title: `Supprimer la demande #${r.idTransportRequest} ?`,
            text: `${r.villeDepart} → ${r.villeArrivee} · ${STATUT_LABELS[r.statut]}. Cette action est irréversible.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#dc3545',
        })
        if (!confirm.isConfirmed) return
        setDeleting(true)
        try {
            await transportRequestService.remove(r.idTransportRequest)
            setRequests(prev => prev.filter(x => x.idTransportRequest !== r.idTransportRequest))
            setSelected(prev => { const n = new Set(prev); n.delete(r.idTransportRequest); return n })
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Suppression impossible.', 'error')
        } finally { setDeleting(false) }
    }

    const removeSelected = async () => {
        const ids = [...selected]
        const confirm = await Swal.fire({
            title: `Supprimer ${ids.length} demande(s) ?`, icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Supprimer la sélection',
            cancelButtonText: 'Annuler', confirmButtonColor: '#dc3545',
        })
        if (!confirm.isConfirmed) return
        setDeleting(true)
        try {
            await transportRequestService.removeMany(ids)
            setRequests(prev => prev.filter(r => !selected.has(r.idTransportRequest)))
            setSelected(new Set())
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Suppression impossible.', 'error')
        } finally { setDeleting(false) }
    }

    const removeAll = async () => {
        const confirm = await Swal.fire({
            title: 'Tout supprimer ?',
            text: `Les ${filtered.length} demande(s) affichée(s) seront définitivement supprimées.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Tout supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#dc3545',
        })
        if (!confirm.isConfirmed) return
        setDeleting(true)
        try {
            await transportRequestService.removeMany(filtered.map(r => r.idTransportRequest))
            const removed = new Set(filtered.map(r => r.idTransportRequest))
            setRequests(prev => prev.filter(r => !removed.has(r.idTransportRequest)))
            setSelected(new Set())
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Suppression impossible.', 'error')
        } finally { setDeleting(false) }
    }

    const openQuote = (r: TransportRequest) => { setSelectedRequest(r); setShowQuote(true) }

    // Export : la sélection si elle existe, sinon tout ce qui est affiché
    const exportRows = selected.size > 0 ? filtered.filter(r => selected.has(r.idTransportRequest)) : filtered

    const pendingCount = requests.filter(r => r.statut === StatutDemandeTransport.PENDING_QUOTATION).length

    return (
        <>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="ri:price-tag-3-line" className="me-2 text-primary" />
                        Demandes de Transport
                    </h4>
                    <p className="text-muted mb-0">
                        {requests.length} demande(s) · {pendingCount} à chiffrer
                    </p>
                </Col>
                <Col xs="auto" className="d-flex gap-2 flex-wrap">
                    {canWrite && selected.size > 0 && (
                        <Button variant="danger" size="sm" onClick={removeSelected} disabled={deleting}
                            className="d-flex align-items-center gap-1">
                            <IconifyIcon icon="ri:delete-bin-line" />
                            Supprimer la sélection ({selected.size})
                        </Button>
                    )}
                    {canWrite && filtered.length > 0 && (
                        <Button variant="outline-danger" size="sm" onClick={removeAll} disabled={deleting}
                            className="d-flex align-items-center gap-1">
                            <IconifyIcon icon="ri:delete-bin-6-line" />
                            Tout supprimer
                        </Button>
                    )}
                    <Button variant="outline-secondary" size="sm" onClick={() => exportCsv(exportRows)}
                        disabled={exportRows.length === 0} title="Exporter en CSV (Excel)"
                        className="d-flex align-items-center gap-1">
                        <IconifyIcon icon="ri:file-excel-2-line" /> CSV
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => exportPdf(exportRows)}
                        disabled={exportRows.length === 0}
                        title={selected.size > 0 ? `Exporter la sélection (${selected.size}) en PDF` : 'Exporter la liste en PDF'}
                        className="d-flex align-items-center gap-1">
                        <IconifyIcon icon="ri:file-pdf-2-line" /> PDF
                    </Button>
                    <Button variant="outline-primary" size="sm" onClick={load} disabled={loading}
                        className="d-flex align-items-center gap-1">
                        {loading ? <Spinner size="sm" animation="border" /> : <IconifyIcon icon="ri:refresh-line" />}
                        Actualiser
                    </Button>
                </Col>
            </Row>

            <Row className="mb-4 g-2 align-items-center">
                <Col xs="auto" className="d-flex gap-2 flex-wrap">
                    <Button variant={filter === undefined ? 'primary' : 'outline-primary'} size="sm" onClick={() => setFilter(undefined)}>
                        Toutes
                    </Button>
                    {Object.values(StatutDemandeTransport).map(s => (
                        <Button key={s} variant={filter === s ? 'primary' : 'outline-primary'} size="sm" onClick={() => setFilter(s)}>
                            {STATUT_LABELS[s] || s}
                        </Button>
                    ))}
                </Col>
                <Col style={{ minWidth: 200, maxWidth: 320 }} className="ms-auto">
                    <Form.Control size="sm" type="search" placeholder="🔍 Rechercher (trajet, client, fret…)"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : filtered.length === 0 ? (
                <Card className="text-center py-5 border-dashed">
                    <Card.Body>
                        <IconifyIcon icon="ri:inbox-line" className="fs-1 text-muted mb-2" />
                        <p className="text-muted fw-semibold">
                            {search ? 'Aucune demande ne correspond à la recherche' : 'Aucune demande de transport'}
                        </p>
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
                                                checked={allFilteredSelected} onChange={toggleSelectAll}
                                                title="Tout sélectionner" />
                                        </th>
                                    )}
                                    <th>Date souhaitée</th>
                                    <th>Trajet & Fret</th>
                                    <th>Client</th>
                                    <th>Distance / Estim. IA</th>
                                    <th>Devis</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => (
                                    <tr key={r.idTransportRequest}>
                                        {canWrite && (
                                            <td>
                                                <input type="checkbox" className="form-check-input"
                                                    checked={selected.has(r.idTransportRequest)}
                                                    onChange={() => toggleSelect(r.idTransportRequest)} />
                                            </td>
                                        )}
                                        <td>
                                            <div className="fw-semibold small">
                                                <IconifyIcon icon="ri-calendar-line" className="me-1 text-primary" />
                                                {new Date(r.dateSouhaitee).toLocaleDateString()}
                                            </div>
                                            <div className="text-muted tiny">
                                                {new Date(r.dateSouhaitee).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">
                                                {r.villeDepart} <IconifyIcon icon="ri-arrow-right-line" className="text-muted" /> {r.villeArrivee}
                                            </div>
                                            <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: '240px' }}>
                                                {r.cargoDescription} · {r.cargoWeightKg} kg
                                            </small>
                                        </td>
                                        <td>
                                            <Badge bg="info" className="fw-normal">
                                                <IconifyIcon icon="ri-user-line" className="me-1" />
                                                {r.clientNom || `Client #${r.clientIdUtilisateur}`}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="fw-semibold small">{r.distanceKm.toFixed(0)} km</div>
                                            <div className="text-muted small">
                                                ~{r.aiEstimatedPrice.toFixed(0)} TND
                                                <span className="text-muted"> ({r.aiPriceRangeMin.toFixed(0)}–{r.aiPriceRangeMax.toFixed(0)})</span>
                                            </div>
                                        </td>
                                        <td>
                                            {r.finalPrice != null ? (
                                                <>
                                                    <div className="fw-bold text-success">{r.finalPrice.toFixed(2)} TND</div>
                                                    <div className="text-muted tiny">{PRICING_LABELS[r.pricingMethod || ''] || ''}</div>
                                                </>
                                            ) : (
                                                <span className="text-muted small fst-italic">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <Badge bg={STATUT_COLORS[r.statut] || 'secondary'}>
                                                {STATUT_LABELS[r.statut] || r.statut}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1 align-items-center">
                                                {r.statut === StatutDemandeTransport.PENDING_QUOTATION && canWrite && (
                                                    <Button variant="primary" size="sm" onClick={() => openQuote(r)} title="Chiffrer et envoyer le devis">
                                                        <IconifyIcon icon="ri:price-tag-3-line" className="me-1" />Chiffrer
                                                    </Button>
                                                )}
                                                {r.statut === StatutDemandeTransport.ACCEPTED && r.missionId && (
                                                    <span className="small text-success me-1">
                                                        <IconifyIcon icon="ri:checkbox-circle-line" className="me-1" />Mission #{r.missionId}
                                                    </span>
                                                )}
                                                {canWrite && (
                                                    <Button variant="outline-danger" size="sm" title="Supprimer"
                                                        onClick={() => removeOne(r)} disabled={deleting}>
                                                        <IconifyIcon icon="ri:delete-bin-line" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <ErrorBoundary>
                <QuotationModal
                    show={showQuote}
                    onHide={() => setShowQuote(false)}
                    request={selectedRequest}
                    reloadList={load}
                />
            </ErrorBoundary>
        </>
    )
}
