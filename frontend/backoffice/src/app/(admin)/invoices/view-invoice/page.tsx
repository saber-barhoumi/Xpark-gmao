import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardBody, Col, Row, Spinner } from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import logoDark from '@/assets/images/logo-dark.png'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import factureService, { Facture } from '@/services/factureService'

/**
 * Facture XPARK — /invoices/view-invoice?id=N (document officiel imprimable).
 *
 * 100 % dynamique (Finance.API) : identité XPARK (logo + coordonnées), client,
 * prestation (mission liée), totaux HT / TVA / TTC + timbre fiscal, tampon de
 * statut. « Imprimer / PDF » = impression navigateur ciblée sur le document
 * (convention du projet — voir analytics) : zéro dépendance.
 */

// Identité de l'entreprise (cohérente avec la base de connaissances Ayshaa)
const XPARK = {
    nom: 'XPARK Transport & Logistique',
    adresse: 'Zone industrielle, Tunis, Tunisie',
    tel: '+216 70 000 000',
    email: 'contact@xpark.tn',
    site: 'www.xpark.tn',
    mf: 'MF 1234567/A/M/000',        // matricule fiscal
    rib: 'TN59 1000 6035 0000 0000 1234',
}
const TIMBRE_FISCAL = 1.0            // DT (timbre fiscal tunisien par facture)

const dt = (v: number) => `${v.toFixed(3)} DT`
const dateFr = (d?: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

const STATUT_STAMP: Record<string, { label: string; color: string }> = {
    PAYEE: { label: 'PAYÉE', color: '#198754' },
    EN_ATTENTE: { label: 'EN ATTENTE', color: '#b45309' },
    EN_RETARD: { label: 'EN RETARD', color: '#dc3545' },
    ANNULEE: { label: 'ANNULÉE', color: '#6c757d' },
}

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #xpark-invoice, #xpark-invoice * { visibility: visible !important; }
  #xpark-invoice { position: absolute; left: 0; top: 0; width: 100%;
                   box-shadow: none !important; border: none !important; }
  @page { size: A4 portrait; margin: 12mm; }
}`

export default function ViewInvoicePage() {
    const [params] = useSearchParams()
    const id = Number(params.get('id'))
    const [facture, setFacture] = useState<Facture | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!id) { setError('Aucune facture sélectionnée — ouvrez une facture depuis la liste.'); setLoading(false); return }
        factureService.getById(id)
            .then(setFacture)
            .catch(() => setError(`Facture #${id} introuvable.`))
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
    if (error || !facture) return (
        <Card><CardBody className="text-center py-5">
            <IconifyIcon icon="tabler:invoice" className="fs-1 text-muted d-block mx-auto mb-2 opacity-25" />
            <p className="text-muted">{error}</p>
            <Link to="/invoices" className="btn btn-primary btn-sm">← Liste des factures</Link>
        </CardBody></Card>
    )

    const f = facture
    const tva = f.montantTTC - f.montant
    const totalAPayer = f.montantTTC + TIMBRE_FISCAL
    const stamp = STATUT_STAMP[f.statut] ?? { label: f.statut, color: '#6c757d' }

    return (
        <>
            <style>{PRINT_CSS}</style>
            <div className="d-print-none"><PageBreadcrumb title={f.numeroFacture} /></div>

            {/* ── Barre d'actions (jamais imprimée) ─────────────────── */}
            <div className="d-flex gap-2 mb-3 d-print-none">
                <Link to="/invoices" className="btn btn-outline-secondary btn-sm">
                    <IconifyIcon icon="ri:arrow-left-line" className="me-1" /> Factures
                </Link>
                <div className="flex-grow-1" />
                <Button variant="primary" size="sm" onClick={() => window.print()}>
                    <IconifyIcon icon="tabler:printer" className="me-1" /> Imprimer / PDF
                </Button>
            </div>

            {/* ══ DOCUMENT OFFICIEL ══════════════════════════════════ */}
            <Row className="justify-content-center">
                <Col xxl={9} lg={11}>
                    <Card id="xpark-invoice" className="border shadow-sm position-relative overflow-hidden">
                        {/* Liseré identité */}
                        <div style={{ height: 6, background: 'linear-gradient(90deg,#C11425,#0F1B24)' }} />
                        {/* Tampon de statut */}
                        <div style={{
                            position: 'absolute', top: 60, right: -34, transform: 'rotate(38deg)',
                            border: `3px solid ${stamp.color}`, color: stamp.color, fontWeight: 800,
                            fontSize: 15, letterSpacing: 2, padding: '4px 44px', opacity: .85, background: '#fff',
                        }}>{stamp.label}</div>

                        <CardBody className="p-4 p-lg-5">
                            {/* ── En-tête : logo + société / n° facture ── */}
                            <Row className="mb-4">
                                <Col sm={7}>
                                    <img src={logoDark} alt="XPARK" height={42} className="mb-3" />
                                    <div className="fw-bold">{XPARK.nom}</div>
                                    <div className="text-muted small">
                                        {XPARK.adresse}<br />
                                        Tél : {XPARK.tel} · {XPARK.email}<br />
                                        {XPARK.site} · {XPARK.mf}
                                    </div>
                                </Col>
                                <Col sm={5} className="text-sm-end mt-3 mt-sm-0">
                                    <h3 className="fw-bold mb-1" style={{ color: '#0F1B24' }}>FACTURE</h3>
                                    <div className="fs-5 fw-bold text-primary mb-2">{f.numeroFacture}</div>
                                    <div className="small">
                                        <div><span className="text-muted">Émise le :</span> <strong>{dateFr(f.dateFacture)}</strong></div>
                                        <div><span className="text-muted">Échéance :</span> <strong>{dateFr(f.dateEcheance)}</strong></div>
                                        {f.datePaiement && (
                                            <div className="text-success"><span className="text-muted">Payée le :</span> <strong>{dateFr(f.datePaiement)}</strong></div>
                                        )}
                                    </div>
                                </Col>
                            </Row>

                            {/* ── Client ── */}
                            <div className="bg-light rounded-2 p-3 mb-4">
                                <div className="text-muted text-uppercase fw-bold" style={{ fontSize: 11 }}>Facturé à</div>
                                <div className="fw-bold fs-5">{f.clientPrenom} {f.clientNom}</div>
                                <div className="text-muted small">{f.clientEmail} · Client n° {f.clientId}</div>
                            </div>

                            {/* ── Prestation ── */}
                            <div className="table-responsive mb-4">
                                <table className="table table-bordered align-middle mb-0">
                                    <thead style={{ background: '#0F1B24', color: '#fff' }}>
                                        <tr>
                                            <th style={{ color: '#fff' }}>Désignation</th>
                                            <th style={{ color: '#fff', width: 130 }} className="text-center">Référence</th>
                                            <th style={{ color: '#fff', width: 140 }} className="text-end">Montant HT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <div className="fw-semibold">
                                                    {f.description || 'Prestation de transport de marchandises'}
                                                </div>
                                                {f.missionId && (
                                                    <small className="text-muted">
                                                        Mission liée : #{f.missionId}{f.missionReference ? ` — ${f.missionReference}` : ''}
                                                    </small>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                {f.missionId ? <Badge bg="dark" className="fw-normal">M-{f.missionId}</Badge> : '—'}
                                            </td>
                                            <td className="text-end fw-semibold">{dt(f.montant)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Totaux ── */}
                            <Row>
                                <Col sm={6} className="small text-muted">
                                    <div className="fw-bold text-dark mb-1">Règlement</div>
                                    Virement bancaire : {XPARK.rib}<br />
                                    Chèque à l'ordre de {XPARK.nom}<br />
                                    <span className="fst-italic">Pénalités de retard selon la législation en vigueur.</span>
                                </Col>
                                <Col sm={6}>
                                    <div className="ms-auto" style={{ maxWidth: 300 }}>
                                        <div className="d-flex justify-content-between py-1"><span className="text-muted">Total HT</span><strong>{dt(f.montant)}</strong></div>
                                        <div className="d-flex justify-content-between py-1"><span className="text-muted">TVA {f.tauxTVA} %</span><strong>{dt(tva)}</strong></div>
                                        <div className="d-flex justify-content-between py-1"><span className="text-muted">Timbre fiscal</span><strong>{dt(TIMBRE_FISCAL)}</strong></div>
                                        <div className="d-flex justify-content-between py-2 px-2 mt-1 rounded fw-bold fs-5"
                                            style={{ background: '#0F1B24', color: '#fff' }}>
                                            <span>Net à payer</span><span>{dt(totalAPayer)}</span>
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            <hr className="mt-4" />
                            <div className="text-center text-muted" style={{ fontSize: 11 }}>
                                {XPARK.nom} — {XPARK.adresse} — {XPARK.mf}<br />
                                Merci de votre confiance 🚚 Pour toute question : {XPARK.email} · {XPARK.tel}
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </>
    )
}
