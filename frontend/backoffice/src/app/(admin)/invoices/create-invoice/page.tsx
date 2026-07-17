import { useEffect, useMemo, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row, Spinner } from 'react-bootstrap'
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
 * Flux réel : choisir un CLIENT (comptes IAM) → optionnellement une de ses
 * missions TERMINÉES (le montant HT se pré-remplit depuis le coût de la
 * mission) → TVA 19 % (Tunisie) → POST Finance.API → document imprimable.
 */

const TVA_DEFAUT = 19
const dt = (v: number) => `${v.toFixed(3)} DT`

export default function CreateInvoicePage() {
    const navigate = useNavigate()
    const [clients, setClients] = useState<AccountUser[]>([])
    const [missions, setMissions] = useState<Mission[]>([])
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

    useEffect(() => {
        Promise.all([userService.getAllUsers(), missionService.getAll()])
            .then(([users, ms]) => {
                setClients(users.filter(u => u.role === 'CLIENT'))
                setMissions(ms)
            })
            .catch(() => Swal.fire('Erreur', 'Impossible de charger clients/missions.', 'error'))
            .finally(() => setLoading(false))
    }, [])

    // Missions facturables du client choisi : TERMINÉES (prestations livrées)
    const missionsClient = useMemo(() =>
        missions.filter(m => m.clientIdUtilisateur === clientId && m.statut === StatutMission.TERMINEE),
        [missions, clientId])

    const clientOptions = clients.map(c => ({
        value: c.idUtilisateur, label: `${c.prenom} ${c.nom} — ${c.email}`,
    }))
    const missionOptions = missionsClient.map(m => ({
        value: m.idMission,
        label: `#${m.idMission} ${m.villeDepart || '—'} → ${m.villeArrivee || m.destination}`
            + (m.coutTotal > 0 ? ` (${m.coutTotal.toFixed(0)} DT)` : ''),
        cout: m.coutTotal,
        desc: `Transport ${m.villeDepart || ''} → ${m.villeArrivee || m.destination} — mission #${m.idMission}`,
    }))

    const ht = parseFloat(montant) || 0
    const tva = ht * tauxTVA / 100
    const ttc = ht + tva

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!clientId) { Swal.fire('Erreur', 'Choisissez un client.', 'warning'); return }
        if (ht <= 0) { Swal.fire('Erreur', 'Le montant HT doit être positif.', 'warning'); return }
        setSaving(true)
        try {
            const f = await factureService.create({
                clientId, missionId: missionId ?? undefined,
                montant: ht, tauxTVA,
                description: description.trim() || undefined,
                dateEcheance: dateEcheance || undefined,
            })
            await Swal.fire('Facture créée', `${f.numeroFacture} — ${dt(f.montantTTC)}`, 'success')
            navigate(`/invoices/view-invoice?id=${f.idFacture}`)
        } catch (err: any) {
            Swal.fire('Erreur', err.response?.data?.message || 'Création impossible.', 'error')
        } finally { setSaving(false) }
    }

    return (
        <>
            <PageBreadcrumb title="Nouvelle facture" />
            <Row className="justify-content-center">
                <Col xxl={8} lg={10}>
                    <Card className="border-0 shadow-sm">
                        <CardBody className="p-4">
                            <h4 className="mb-1">
                                <IconifyIcon icon="tabler:invoice" className="me-2 text-primary" />
                                Nouvelle facture XPARK
                            </h4>
                            <p className="text-muted mb-4">
                                Facturez une prestation livrée : le montant se pré-remplit depuis la mission terminée du client.
                            </p>

                            {loading ? (
                                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                            ) : (
                                <Form onSubmit={submit}>
                                    <Row className="g-3">
                                        <Col md={12}>
                                            <Form.Label className="fw-bold small">Client <span className="text-danger">*</span></Form.Label>
                                            <Select options={clientOptions} isClearable
                                                placeholder="Choisir un client…"
                                                noOptionsMessage={() => 'Aucun compte client'}
                                                value={clientOptions.find(o => o.value === clientId) ?? null}
                                                onChange={(o: any) => { setClientId(o?.value ?? null); setMissionId(null) }} />
                                        </Col>
                                        <Col md={12}>
                                            <Form.Label className="fw-bold small">
                                                Mission terminée <span className="text-muted fw-normal">(optionnel — pré-remplit le montant)</span>
                                            </Form.Label>
                                            <Select options={missionOptions} isClearable isDisabled={!clientId}
                                                placeholder={clientId ? (missionOptions.length ? 'Associer une mission…' : 'Aucune mission terminée pour ce client') : 'Choisissez d’abord un client'}
                                                value={missionOptions.find(o => o.value === missionId) ?? null}
                                                onChange={(o: any) => {
                                                    setMissionId(o?.value ?? null)
                                                    if (o?.cout > 0) setMontant(String(o.cout))
                                                    if (o?.desc && !description) setDescription(o.desc)
                                                }} />
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label className="fw-bold small">Montant HT (DT) <span className="text-danger">*</span></Form.Label>
                                            <Form.Control type="number" min={0} step="0.001" value={montant}
                                                onChange={e => setMontant(e.target.value)} placeholder="Ex : 850.000" required />
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
                                        <Button type="submit" variant="primary" disabled={saving} className="px-4">
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
