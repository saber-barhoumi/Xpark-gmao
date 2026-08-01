import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, CardBody, Col, Form, Row, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import Swal from 'sweetalert2'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import factureService from '@/services/factureService'
import missionService from '@/services/missionService'
import userService, { AccountUser } from '@/services/userService'
import { Mission, StatutMission } from '@/types/mission'

/**
 * Nouvelle facture — /invoices/create-invoice (100 % dynamique).
 *
 * Règle métier : on ne facture QUE des prestations livrées et pas encore
 * facturées. L'écran part donc des missions facturables (TERMINÉE + non
 * facturée) et n'expose que les clients qui en ont au moins une — inutile de
 * proposer un client sans rien à facturer.
 *
 * Flux : client → mission éligible → montant/description pré-remplis depuis la
 * mission → TVA 19 % (Tunisie) → POST Finance.API.
 * L'anti-doublon est doublé côté serveur (409 si la mission est déjà facturée).
 */

const TVA_DEFAUT = 19
const dt = (v: number) => `${v.toFixed(3)} DT`

export default function CreateInvoicePage() {
    const navigate = useNavigate()
    const [clients, setClients] = useState<AccountUser[]>([])
    const [missions, setMissions] = useState<Mission[]>([])
    const [dejaFacturees, setDejaFacturees] = useState<Set<number>>(new Set())
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [clientId, setClientId] = useState<number | null>(null)
    const [missionId, setMissionId] = useState<number | null>(null)
    const [montant, setMontant] = useState('')            // HT
    const [tauxTVA, setTauxTVA] = useState(TVA_DEFAUT)
    const [description, setDescription] = useState('')
    const [dateEcheance, setDateEcheance] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 30)   // échéance 30 jours (usage)
        return d.toISOString().slice(0, 10)
    })

    const charger = () => {
        setLoading(true)
        Promise.all([
            userService.getAllUsers(),
            missionService.getAll(),
            factureService.getMissionsFacturees(),
        ])
            .then(([users, ms, facturees]) => {
                setClients(users.filter(u => u.role === 'CLIENT'))
                setMissions(ms)
                setDejaFacturees(new Set(facturees))
            })
            .catch(() => Swal.fire('Erreur', 'Impossible de charger les données de facturation.', 'error'))
            .finally(() => setLoading(false))
    }
    useEffect(charger, [])

    // ── Missions facturables : livrées, rattachées à un client, non facturées ──
    const missionsFacturables = useMemo(() =>
        missions.filter(m =>
            m.statut === StatutMission.TERMINEE &&
            m.clientIdUtilisateur != null &&
            !dejaFacturees.has(m.idMission)),
        [missions, dejaFacturees])

    // ── Clients facturables : uniquement ceux qui ont au moins une mission ci-dessus ──
    const clientsFacturables = useMemo(() => {
        const ids = new Set(missionsFacturables.map(m => m.clientIdUtilisateur as number))
        return clients.filter(c => ids.has(c.idUtilisateur))
    }, [clients, missionsFacturables])

    const missionsClient = useMemo(() =>
        missionsFacturables.filter(m => m.clientIdUtilisateur === clientId),
        [missionsFacturables, clientId])

    const clientOptions = clientsFacturables.map(c => {
        const n = missionsFacturables.filter(m => m.clientIdUtilisateur === c.idUtilisateur).length
        return {
            value: c.idUtilisateur,
            label: `${c.prenom} ${c.nom} — ${n} mission${n > 1 ? 's' : ''} à facturer`,
        }
    })
    const missionOptions = missionsClient.map(m => ({
        value: m.idMission,
        label: `#${m.idMission} ${m.villeDepart || '—'} → ${m.villeArrivee || m.destination}`
            + (m.coutTotal > 0 ? ` · ${m.coutTotal.toFixed(0)} DT` : ''),
        mission: m,
    }))

    /** Pré-remplissage automatique depuis la mission choisie. */
    const choisirMission = (m: Mission | null) => {
        setMissionId(m?.idMission ?? null)
        if (!m) return
        setMontant(m.coutTotal > 0 ? String(m.coutTotal) : '')
        setDescription(
            `Transport ${m.villeDepart || '—'} → ${m.villeArrivee || m.destination} — mission #${m.idMission}`)
    }

    const missionChoisie = missionsClient.find(m => m.idMission === missionId) ?? null

    const ht = parseFloat(montant) || 0
    const tva = ht * tauxTVA / 100
    const ttc = ht + tva

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!clientId) { Swal.fire('Erreur', 'Choisissez un client.', 'warning'); return }
        if (!missionId) { Swal.fire('Erreur', 'Choisissez la mission à facturer.', 'warning'); return }
        if (ht <= 0) { Swal.fire('Erreur', 'Le montant HT doit être positif.', 'warning'); return }
        setSaving(true)
        try {
            const f = await factureService.create({
                clientId, missionId,
                montant: ht, tauxTVA,
                description: description.trim() || undefined,
                dateEcheance: dateEcheance || undefined,
            })
            await Swal.fire('Facture créée', `${f.numeroFacture} — ${dt(f.montantTTC)}`, 'success')
            navigate(`/invoices/view-invoice?id=${f.idFacture}`)
        } catch (err: any) {
            // 409 = la mission vient d'être facturée (autre onglet / autre agent).
            if (err.response?.status === 409) {
                await Swal.fire('Mission déjà facturée',
                    err.response?.data?.message || 'Cette mission a déjà une facture.', 'warning')
                charger()
                setMissionId(null)
            } else {
                Swal.fire('Erreur', err.response?.data?.message || 'Création impossible.', 'error')
            }
        } finally { setSaving(false) }
    }

    return (
        <>
            <PageBreadcrumb title="Nouvelle facture" />
            <Row className="justify-content-center">
                <Col xxl={8} lg={10}>
                    <Card className="border-0 shadow-sm">
                        <CardBody className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-1">
                                <h4 className="mb-0">
                                    <IconifyIcon icon="tabler:invoice" className="me-2 text-primary" />
                                    Nouvelle facture XPARK
                                </h4>
                                <Button variant="light" size="sm" onClick={charger} title="Actualiser">
                                    <IconifyIcon icon="ri:refresh-line" />
                                </Button>
                            </div>
                            <p className="text-muted mb-4">
                                Seules les missions <strong>terminées et non encore facturées</strong> sont proposées.
                            </p>

                            {loading ? (
                                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                            ) : clientsFacturables.length === 0 ? (
                                <div className="text-center text-muted py-5">
                                    <IconifyIcon icon="tabler:file-check" className="fs-48 mb-2 opacity-25 d-block mx-auto" />
                                    <h5 className="mb-1">Tout est facturé 🎉</h5>
                                    <p className="mb-3">Aucune mission terminée n’attend de facture pour le moment.</p>
                                    <Button variant="outline-primary" size="sm" onClick={() => navigate('/invoices')}>
                                        Voir les factures existantes
                                    </Button>
                                </div>
                            ) : (
                                <Form onSubmit={submit}>
                                    <Row className="g-3">
                                        <Col md={12}>
                                            <Form.Label className="fw-bold small">
                                                Client <span className="text-danger">*</span>
                                                <span className="text-muted fw-normal ms-1">
                                                    ({clientsFacturables.length} client(s) à facturer)
                                                </span>
                                            </Form.Label>
                                            <Select options={clientOptions} isClearable
                                                placeholder="Choisir un client…"
                                                noOptionsMessage={() => 'Aucun client à facturer'}
                                                value={clientOptions.find(o => o.value === clientId) ?? null}
                                                onChange={(o: any) => {
                                                    setClientId(o?.value ?? null)
                                                    choisirMission(null)
                                                    setMontant(''); setDescription('')
                                                }} />
                                        </Col>
                                        <Col md={12}>
                                            <Form.Label className="fw-bold small">
                                                Mission à facturer <span className="text-danger">*</span>
                                            </Form.Label>
                                            <Select options={missionOptions} isClearable isDisabled={!clientId}
                                                placeholder={clientId ? 'Choisir la mission…' : 'Choisissez d’abord un client'}
                                                noOptionsMessage={() => 'Aucune mission facturable'}
                                                value={missionOptions.find(o => o.value === missionId) ?? null}
                                                onChange={(o: any) => choisirMission(o?.mission ?? null)} />
                                        </Col>

                                        {/* Récapitulatif de la prestation facturée */}
                                        {missionChoisie && (
                                            <Col md={12}>
                                                <Alert variant="light" className="border mb-0 py-2">
                                                    <div className="d-flex flex-wrap gap-3 align-items-center small">
                                                        <Badge bg="soft-success" text="success" className="fw-normal">
                                                            Mission #{missionChoisie.idMission} · terminée
                                                        </Badge>
                                                        <span><IconifyIcon icon="tabler:map-pin" className="me-1 text-muted" />
                                                            {missionChoisie.villeDepart || '—'} → {missionChoisie.villeArrivee || missionChoisie.destination}</span>
                                                        {missionChoisie.distance > 0 && (
                                                            <span><IconifyIcon icon="tabler:route" className="me-1 text-muted" />
                                                                {Math.round(missionChoisie.distance)} km</span>)}
                                                        {missionChoisie.vehiculeImmatriculation && (
                                                            <span><IconifyIcon icon="tabler:truck" className="me-1 text-muted" />
                                                                {missionChoisie.vehiculeImmatriculation}</span>)}
                                                        {missionChoisie.chauffeurNom && (
                                                            <span><IconifyIcon icon="tabler:user" className="me-1 text-muted" />
                                                                {missionChoisie.chauffeurNom}</span>)}
                                                    </div>
                                                </Alert>
                                            </Col>
                                        )}

                                        <Col md={4}>
                                            <Form.Label className="fw-bold small">Montant HT (DT) <span className="text-danger">*</span></Form.Label>
                                            <Form.Control type="number" min={0} step="0.001" value={montant}
                                                onChange={e => setMontant(e.target.value)} placeholder="Ex : 850.000" required />
                                            <Form.Text className="text-muted">Repris du coût de la mission — ajustable.</Form.Text>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="fw-bold small">TVA (%)</Form.Label>
                                            <Form.Select value={tauxTVA} onChange={e => setTauxTVA(+e.target.value)}>
                                                <option value={19}>19 % (standard)</option>
                                                <option value={13}>13 %</option>
                                                <option value={7}>7 %</option>
                                                <option value={0}>0 % (exonéré)</option>
                                            </Form.Select>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="fw-bold small">Échéance</Form.Label>
                                            <Form.Control type="date" value={dateEcheance}
                                                onChange={e => setDateEcheance(e.target.value)} />
                                        </Col>
                                        <Col md={12}>
                                            <Form.Label className="fw-bold small">Description / objet</Form.Label>
                                            <Form.Control as="textarea" rows={2} value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                placeholder="Ex : Transport de marchandises Tunis → Sfax, mission #28" />
                                        </Col>
                                    </Row>

                                    {/* ── Totaux en direct ───────────────────── */}
                                    <div className="bg-light rounded-2 p-3 my-4">
                                        <div className="d-flex justify-content-between small"><span>Total HT</span><strong>{dt(ht)}</strong></div>
                                        <div className="d-flex justify-content-between small"><span>TVA {tauxTVA} %</span><strong>{dt(tva)}</strong></div>
                                        <hr className="my-2" />
                                        <div className="d-flex justify-content-between fs-5 fw-bold text-primary">
                                            <span>Total TTC</span><span>{dt(ttc)}</span>
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end gap-2">
                                        <Button variant="outline-secondary" onClick={() => navigate('/invoices')} disabled={saving}>
                                            Annuler
                                        </Button>
                                        <Button type="submit" variant="primary" disabled={saving || !missionId} className="px-4">
                                            {saving ? <><Spinner size="sm" animation="border" className="me-1" /> Création…</>
                                                : <><IconifyIcon icon="ri:check-line" className="me-1" /> Créer la facture</>}
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </>
    )
}
