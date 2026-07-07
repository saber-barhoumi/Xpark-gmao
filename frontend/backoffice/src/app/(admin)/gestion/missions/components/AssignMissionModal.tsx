'use client'

import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Form, Modal, Spinner } from 'react-bootstrap'
import Select from 'react-select'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Swal from 'sweetalert2'
import api from '@/lib/axiosConfig'
import missionService from '@/services/missionService'
import employeeService from '@/services/employeeService'
import { Mission } from '@/types/mission'

interface AssignMissionModalProps {
    show: boolean
    onHide: () => void
    mission: Mission | null
    reloadList: () => void
}

// Handles plain arrays AND paginated { data:[...] } responses
const toArray = (val: unknown): any[] => {
    if (Array.isArray(val)) return val
    if (val && typeof val === 'object') {
        const v = val as Record<string, unknown>
        for (const k of ['data', 'items', 'results', 'value']) {
            if (Array.isArray(v[k])) return v[k] as any[]
        }
    }
    return []
}

/**
 * Affectation manuelle d'UNE mission EN_ATTENTE : choisir un véhicule
 * disponible + un chauffeur disponible → PUT /missions/{id}/assign.
 * Complète l'optimisation en masse (« Optimiser le planning »).
 */
const AssignMissionModal = ({ show, onHide, mission, reloadList }: AssignMissionModalProps) => {
    const [vehicles, setVehicles] = useState<any[]>([])
    const [drivers, setDrivers] = useState<any[]>([])
    const [vehiculeId, setVehiculeId] = useState<number>(0)
    const [employeeId, setEmployeeId] = useState<number>(0)
    const [vehImmat, setVehImmat] = useState('')
    const [vehKm, setVehKm] = useState(0)
    const [chauffeurNom, setChauffeurNom] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!show) return
        setVehiculeId(0); setEmployeeId(0); setError('')
        setLoading(true)
        Promise.all([
            api.get('/vehicules/disponibles'),
            employeeService.getAll({ post: 'CHAUFFEUR', statut: 'DISPONIBLE' }),
        ])
            .then(([vRes, dRes]) => {
                setVehicles(toArray(vRes.data).map((v: any) => ({
                    value: v.idVehicule,
                    label: `${v.immatriculation} — ${v.marque} ${v.modele} [${v.typeVehicule ?? '?'}] (${v.kilometrage} km)`,
                    immatriculation: v.immatriculation ?? '',
                    kilometrage: v.kilometrage ?? 0,
                })))
                setDrivers(toArray(dRes).map((d: any) => ({
                    value: d.idEmployee,
                    label: `${d.prenom ?? ''} ${d.name ?? d.nom ?? ''} (${d.numeroMatricule ?? ''})`.trim(),
                    nom: `${d.prenom ?? ''} ${d.name ?? d.nom ?? ''}`.trim(),
                })))
            })
            .catch(() => setError('Impossible de charger les véhicules / chauffeurs disponibles.'))
            .finally(() => setLoading(false))
    }, [show])

    const handleAssign = async () => {
        if (!mission) return
        if (!vehiculeId || !employeeId) { setError('Sélectionnez un véhicule et un chauffeur.'); return }
        setSaving(true); setError('')
        try {
            await missionService.assign(mission.idMission, {
                vehiculeId, employeeId,
                vehiculeImmatriculation: vehImmat || undefined,
                chauffeurNom: chauffeurNom || undefined,
                kilometrageDepart: vehKm,
            })
            await Swal.fire('Affectée', 'La mission a été affectée et passe EN COURS.', 'success')
            reloadList()
            onHide()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Affectation impossible.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title className="fs-16">
                    <IconifyIcon icon="ri:user-add-line" className="me-2" />
                    Affecter la mission
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {mission && (
                    <div className="mb-3 p-2 bg-light rounded small">
                        <div className="fw-bold">
                            {mission.villeDepart || '—'} → {mission.villeArrivee || mission.destination}
                        </div>
                        <div className="text-muted">
                            #{mission.idMission} · {new Date(mission.dateDepart).toLocaleString('fr-FR')}
                            {(mission.distanceKm ?? 0) > 0 && <> · {mission.distanceKm?.toFixed(0)} km</>}
                            {(mission.coutEstimeAI ?? 0) > 0 && <> · ~{mission.coutEstimeAI?.toFixed(2)} TND</>}
                        </div>
                        {mission.clientNom && (
                            <Badge bg="info" className="mt-1">
                                <IconifyIcon icon="ri:user-line" className="me-1" />Client : {mission.clientNom}
                            </Badge>
                        )}
                    </div>
                )}

                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                {loading ? (
                    <div className="text-center py-4"><Spinner animation="border" /></div>
                ) : (
                    <>
                        <Form.Label className="small fw-bold">Véhicule disponible</Form.Label>
                        <Select
                            options={vehicles}
                            value={vehicles.find(v => v.value === vehiculeId) ?? null}
                            onChange={(o: any) => { setVehiculeId(o?.value ?? 0); setVehImmat(o?.immatriculation ?? ''); setVehKm(o?.kilometrage ?? 0) }}
                            placeholder="Choisir un véhicule…"
                            noOptionsMessage={() => 'Aucun véhicule disponible'}
                            className="mb-3"
                        />
                        <Form.Label className="small fw-bold">Chauffeur disponible</Form.Label>
                        <Select
                            options={drivers}
                            value={drivers.find(d => d.value === employeeId) ?? null}
                            onChange={(o: any) => { setEmployeeId(o?.value ?? 0); setChauffeurNom(o?.nom ?? '') }}
                            placeholder="Choisir un chauffeur…"
                            noOptionsMessage={() => 'Aucun chauffeur disponible'}
                        />
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" size="sm" onClick={onHide}>Annuler</Button>
                <Button variant="primary" size="sm" onClick={handleAssign} disabled={saving || loading}>
                    {saving
                        ? <><Spinner animation="border" size="sm" className="me-1" />Affectation…</>
                        : <><IconifyIcon icon="ri:check-line" className="me-1" />Affecter</>}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default AssignMissionModal
