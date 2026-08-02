import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, Form, InputGroup, Spinner, Table } from 'react-bootstrap'
import Swal from 'sweetalert2'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import predictionService from '@/services/predictionService'
import { NiveauRisque, type Prediction } from '@/types/prediction'

/**
 * Historique des alertes de maintenance — prédictions réellement persistées.
 *
 * L'écran affichait uniquement les alertes du jour, sans moyen de les gérer.
 * On expose ici l'historique complet du parc avec sélection (unitaire,
 * multiple, tout), suppression (sélection ou totalité), filtre par niveau de
 * risque et recherche. Les prédictions étant recalculables à tout moment
 * (« Recalculer »), la suppression est une opération de ménage sans risque.
 */

const RISQUE_VARIANT: Record<string, string> = {
    CRITIQUE: 'danger', ELEVE: 'warning', MOYEN: 'info', FAIBLE: 'success',
}

const ORGANE_LABEL: Record<string, string> = {
    FREINS: 'Freins', PNEUMATIQUES: 'Pneumatiques', MOTEUR: 'Moteur',
    BATTERIE: 'Batterie', SUSPENSION: 'Suspension', TRANSMISSION: 'Transmission',
    EMBRAYAGE: 'Embrayage', CLIMATISATION: 'Climatisation', AUTRE: 'Autre',
}

const dateFr = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const PAGE_SIZE = 12

export default function HistoriqueAlertes({ onChange }: { onChange?: () => void }) {
    const [lignes, setLignes]     = useState<Prediction[]>([])
    const [chargement, setChargement] = useState(true)
    const [suppression, setSuppression] = useState(false)
    const [selection, setSelection] = useState<Set<number>>(new Set())
    const [recherche, setRecherche] = useState('')
    const [niveau, setNiveau]       = useState('')
    const [organe, setOrgane]       = useState('')
    const [page, setPage]           = useState(1)

    const charger = useCallback(async () => {
        setChargement(true)
        try {
            setLignes(await predictionService.getHistoriqueGlobal(500))
            setSelection(new Set())
        } catch {
            setLignes([])
        } finally {
            setChargement(false)
        }
    }, [])
    useEffect(() => { charger() }, [charger])

    const organes = useMemo(
        () => [...new Set(lignes.map(l => l.typePanne).filter(Boolean))].sort(), [lignes])

    const filtrees = useMemo(() => {
        let list = [...lignes]
        if (niveau) list = list.filter(l => l.niveauRisque === niveau)
        if (organe) list = list.filter(l => l.typePanne === organe)
        const q = recherche.trim().toLowerCase()
        if (q) {
            list = list.filter(l =>
                (l.immatriculation ?? '').toLowerCase().includes(q) ||
                (ORGANE_LABEL[l.typePanne] ?? l.typePanne ?? '').toLowerCase().includes(q) ||
                (l.recommandation ?? '').toLowerCase().includes(q) ||
                (l.explication ?? '').toLowerCase().includes(q))
        }
        return list
    }, [lignes, niveau, organe, recherche])

    const totalPages = Math.max(1, Math.ceil(filtrees.length / PAGE_SIZE))
    const pageCourante = Math.min(page, totalPages)
    const visibles = filtrees.slice((pageCourante - 1) * PAGE_SIZE, pageCourante * PAGE_SIZE)
    useEffect(() => { setPage(1) }, [niveau, organe, recherche])

    // « Tout sélectionner » porte sur les lignes VISIBLES après filtrage : on ne
    // supprime jamais une ligne que l'utilisateur n'a pas vue.
    const toutSelectionne = filtrees.length > 0 && filtrees.every(l => selection.has(l.idPrediction))
    const basculerLigne = (id: number) => setSelection(prev => {
        const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s
    })
    const basculerTout = () => setSelection(prev => {
        if (toutSelectionne) {
            const s = new Set(prev); filtrees.forEach(l => s.delete(l.idPrediction)); return s
        }
        return new Set([...prev, ...filtrees.map(l => l.idPrediction)])
    })

    const supprimerSelection = async () => {
        const ids = [...selection]
        const r = await Swal.fire({
            title: `Supprimer ${ids.length} alerte(s) ?`,
            text: 'Elles disparaîtront de l’historique. Un recalcul régénère les prédictions actuelles.',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#d33',
        })
        if (!r.isConfirmed) return
        setSuppression(true)
        try {
            const n = await predictionService.supprimerLot(ids)
            await charger(); onChange?.()
            Swal.fire({ icon: 'success', title: `${n} alerte(s) supprimée(s)`, timer: 1600, showConfirmButton: false })
        } catch {
            Swal.fire('Erreur', 'La suppression a échoué.', 'error')
        } finally { setSuppression(false) }
    }

    const supprimerTout = async () => {
        const r = await Swal.fire({
            title: 'Vider tout l’historique ?',
            text: `Les ${lignes.length} prédictions enregistrées seront supprimées. Un recalcul les régénère.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Tout supprimer', cancelButtonText: 'Annuler', confirmButtonColor: '#d33',
        })
        if (!r.isConfirmed) return
        setSuppression(true)
        try {
            const n = await predictionService.supprimerLot([])
            await charger(); onChange?.()
            Swal.fire({ icon: 'success', title: `${n} alerte(s) supprimée(s)`, timer: 1600, showConfirmButton: false })
        } catch {
            Swal.fire('Erreur', 'La suppression a échoué.', 'error')
        } finally { setSuppression(false) }
    }

    const filtreActif = !!niveau || !!organe || !!recherche.trim()

    return (
        <Card className="mb-3">
            <CardBody>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <h5 className="mb-0 d-flex align-items-center gap-2">
                        <IconifyIcon icon="tabler:history" className="text-primary" />
                        Historique des alertes de maintenance
                        <Badge bg="light" text="dark">
                            {filtrees.length}{filtreActif ? ` / ${lignes.length}` : ''}
                        </Badge>
                    </h5>
                    <div className="d-flex gap-2 flex-wrap align-items-center">
                        <Form.Select size="sm" style={{ width: 140 }} value={niveau}
                            onChange={e => setNiveau(e.target.value)}>
                            <option value="">Tous les risques</option>
                            {Object.values(NiveauRisque).map(n => <option key={n} value={n}>{n}</option>)}
                        </Form.Select>
                        <Form.Select size="sm" style={{ width: 150 }} value={organe}
                            disabled={organes.length === 0} onChange={e => setOrgane(e.target.value)}>
                            <option value="">Tous les organes</option>
                            {organes.map(o => <option key={o} value={o}>{ORGANE_LABEL[o] ?? o}</option>)}
                        </Form.Select>
                        <InputGroup size="sm" style={{ width: 220 }}>
                            <InputGroup.Text className="bg-light"><IconifyIcon icon="ri:search-line" /></InputGroup.Text>
                            <Form.Control placeholder="Immatriculation, organe…"
                                value={recherche} onChange={e => setRecherche(e.target.value)} />
                        </InputGroup>
                        {selection.size > 0 && (
                            <Button variant="danger" size="sm" disabled={suppression} onClick={supprimerSelection}>
                                <IconifyIcon icon="ri:delete-bin-line" className="me-1" />
                                Supprimer ({selection.size})
                            </Button>
                        )}
                        <Button variant="outline-danger" size="sm"
                            disabled={suppression || lignes.length === 0} onClick={supprimerTout}>
                            <IconifyIcon icon="ri:delete-bin-7-line" className="me-1" /> Tout vider
                        </Button>
                        <Button variant="light" size="sm" onClick={charger} title="Actualiser">
                            <IconifyIcon icon="tabler:refresh" />
                        </Button>
                    </div>
                </div>

                {chargement ? (
                    <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
                ) : filtrees.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        <IconifyIcon icon="tabler:history-off" className="fs-48 mb-2 opacity-25 d-block mx-auto" />
                        {lignes.length === 0
                            ? 'Aucune prédiction enregistrée. Lancez un recalcul pour analyser le parc.'
                            : 'Aucune alerte ne correspond aux critères.'}
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <Table hover size="sm" className="align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: 34 }} className="ps-3">
                                            <input type="checkbox" className="form-check-input" title="Tout sélectionner"
                                                checked={toutSelectionne}
                                                ref={el => { if (el) el.indeterminate = selection.size > 0 && !toutSelectionne }}
                                                onChange={basculerTout} />
                                        </th>
                                        <th>Véhicule</th><th>Organe</th><th>Risque</th>
                                        <th>Recommandation</th><th>Échéance</th><th>Calculée le</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibles.map(l => (
                                        <tr key={l.idPrediction} className={selection.has(l.idPrediction) ? 'table-active' : undefined}>
                                            <td className="ps-3">
                                                <input type="checkbox" className="form-check-input"
                                                    checked={selection.has(l.idPrediction)}
                                                    onChange={() => basculerLigne(l.idPrediction)} />
                                            </td>
                                            <td className="fw-semibold">{l.immatriculation ?? `#${l.vehiculeId}`}</td>
                                            <td><Badge bg="light" text="dark">{ORGANE_LABEL[l.typePanne] ?? l.typePanne}</Badge></td>
                                            <td>
                                                <Badge bg={RISQUE_VARIANT[l.niveauRisque] ?? 'secondary'}>
                                                    {l.niveauRisque}
                                                </Badge>
                                            </td>
                                            <td className="small text-muted text-truncate" style={{ maxWidth: 300 }}>
                                                {l.recommandation}
                                            </td>
                                            <td className="small">{dateFr(l.dateMaintenanceRecommandee)}</td>
                                            <td className="small text-muted">{dateFr(l.dateCalcul)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>

                        {totalPages > 1 && (
                            <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                                <span className="text-muted fs-13">
                                    Page {pageCourante} / {totalPages} — {filtrees.length} alerte(s)
                                </span>
                                <div className="btn-group btn-group-sm">
                                    <Button variant="outline-secondary" disabled={pageCourante === 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}>
                                        <IconifyIcon icon="ri:arrow-left-s-line" />
                                    </Button>
                                    <Button variant="outline-secondary" disabled={pageCourante === totalPages}
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                        <IconifyIcon icon="ri:arrow-right-s-line" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardBody>
        </Card>
    )
}
