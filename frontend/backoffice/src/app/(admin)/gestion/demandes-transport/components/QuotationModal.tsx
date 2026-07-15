'use client'

import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Swal from 'sweetalert2'
import transportRequestService from '@/services/transportRequestService'
import { MethodePrix, TransportRequest } from '@/types/transportRequest'

interface QuotationModalProps {
    show: boolean
    onHide: () => void
    request: TransportRequest | null
    reloadList: () => void
}

/**
 * Envoi d'un devis pour une demande PENDING_QUOTATION. L'estimation IA a été
 * calculée et stockée à la soumission de la demande (aiEstimatedPrice) — on la
 * RÉUTILISE ici, pas de nouvel appel au service de prix. Trois options, comme
 * demandé : prix IA / prix IA modifié / prix manuel.
 */
const QuotationModal = ({ show, onHide, request, reloadList }: QuotationModalProps) => {
    const [method, setMethod] = useState<MethodePrix>(MethodePrix.AI_PRICE)
    const [priceInput, setPriceInput] = useState('')
    const [adminNote, setAdminNote] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!show || !request) return
        setMethod(MethodePrix.AI_PRICE)
        setPriceInput(request.aiEstimatedPrice ? request.aiEstimatedPrice.toFixed(2) : '')
        setAdminNote('')
        setError('')
    }, [show, request])

    if (!request) return null

    const finalPrice = method === MethodePrix.AI_PRICE
        ? request.aiEstimatedPrice
        : parseFloat(priceInput) || 0

    const onMethodChange = (m: MethodePrix) => {
        setMethod(m)
        if (m === MethodePrix.AI_PRICE) setPriceInput(request.aiEstimatedPrice.toFixed(2))
        else if (m === MethodePrix.MODIFIED) setPriceInput(request.aiEstimatedPrice.toFixed(2))
        else setPriceInput('')
    }

    const handleSend = async () => {
        if (finalPrice <= 0) { setError('Le prix doit être positif.'); return }
        setSaving(true); setError('')
        try {
            await transportRequestService.sendQuotation(request.idTransportRequest, {
                finalPrice, pricingMethod: method, adminNote: adminNote || undefined,
            })
            await Swal.fire('Devis envoyé', 'Le client peut désormais accepter ou refuser le devis.', 'success')
            reloadList()
            onHide()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Envoi du devis impossible.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title className="fs-16">
                    <IconifyIcon icon="ri:price-tag-3-line" className="me-2" />
                    Devis — Demande #{request.idTransportRequest}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* ── Récap de la demande ─────────────────────── */}
                <div className="border rounded-2 p-3 mb-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">
                            {request.villeDepart} <IconifyIcon icon="ri:arrow-right-line" className="text-muted" /> {request.villeArrivee}
                        </h6>
                        {request.clientNom && (
                            <Badge bg="info" className="fw-normal">
                                <IconifyIcon icon="ri:user-line" className="me-1" />{request.clientNom}
                            </Badge>
                        )}
                    </div>
                    <Table size="sm" borderless className="mb-0 small">
                        <tbody>
                            <tr>
                                <td className="text-muted ps-0">Date souhaitée</td>
                                <td className="text-end">{new Date(request.dateSouhaitee).toLocaleString('fr-FR')}</td>
                            </tr>
                            <tr>
                                <td className="text-muted ps-0">Fret</td>
                                <td className="text-end">{request.cargoDescription} · {request.cargoWeightKg} kg · {request.passengerCount} pax</td>
                            </tr>
                            <tr>
                                <td className="text-muted ps-0">Distance</td>
                                <td className="text-end fw-semibold">{request.distanceKm.toFixed(0)} km</td>
                            </tr>
                            <tr>
                                <td className="text-muted ps-0">Véhicule recommandé (IA)</td>
                                <td className="text-end">{request.aiVehicleTypeRecommended || request.vehicleTypeRequested || '—'}</td>
                            </tr>
                            <tr>
                                <td className="text-muted ps-0">Estimation IA</td>
                                <td className="text-end">
                                    <span className="fw-bold text-primary">{request.aiEstimatedPrice.toFixed(2)} TND</span>
                                    <span className="text-muted"> ({request.aiPriceRangeMin.toFixed(0)}–{request.aiPriceRangeMax.toFixed(0)})</span>
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </div>

                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                {/* ── Choix du prix ────────────────────────────── */}
                <div className="border rounded-2 p-3">
                    <h6 className="mb-3">Prix du devis</h6>
                    <div className="d-flex flex-column gap-2 mb-3">
                        <Form.Check type="radio" id="q-ai" label={`Utiliser le prix IA (${request.aiEstimatedPrice.toFixed(2)} TND)`}
                            checked={method === MethodePrix.AI_PRICE} onChange={() => onMethodChange(MethodePrix.AI_PRICE)} />
                        <Form.Check type="radio" id="q-mod" label="Modifier le prix IA"
                            checked={method === MethodePrix.MODIFIED} onChange={() => onMethodChange(MethodePrix.MODIFIED)} />
                        <Form.Check type="radio" id="q-man" label="Saisir un prix manuel"
                            checked={method === MethodePrix.MANUAL} onChange={() => onMethodChange(MethodePrix.MANUAL)} />
                    </div>

                    {method !== MethodePrix.AI_PRICE ? (
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <Form.Control size="sm" type="number" min={0} step={0.5} style={{ maxWidth: 180 }}
                                placeholder="Prix en TND" value={priceInput}
                                onChange={e => setPriceInput(e.target.value)} />
                            <span className="text-muted small">TND</span>
                        </div>
                    ) : (
                        <div className="fs-5 fw-bold text-primary mb-3">{request.aiEstimatedPrice.toFixed(2)} TND</div>
                    )}

                    <Form.Group>
                        <Form.Label className="small fw-bold">Note pour le client (optionnel)</Form.Label>
                        <Form.Control as="textarea" rows={2} size="sm" value={adminNote}
                            onChange={e => setAdminNote(e.target.value)}
                            placeholder="Ex : majoration manutention lourde, disponibilité…" />
                    </Form.Group>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="text-muted small">Prix final envoyé au client</span>
                    <span className="fs-4 fw-bold text-success">{finalPrice.toFixed(2)} TND</span>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" size="sm" onClick={onHide} disabled={saving}>Annuler</Button>
                <Button variant="primary" size="sm" onClick={handleSend} disabled={saving}>
                    {saving
                        ? <><Spinner animation="border" size="sm" className="me-1" />Envoi…</>
                        : <><IconifyIcon icon="ri:send-plane-line" className="me-1" />Envoyer le devis</>}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default QuotationModal
