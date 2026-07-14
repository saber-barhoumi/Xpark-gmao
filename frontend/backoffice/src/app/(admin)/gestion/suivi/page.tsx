import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, Col, ProgressBar, Row, Spinner, Table } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import missionService from '@/services/missionService'
import { getLiveFix } from '@/services/trackingService'
import { resolveCity } from '@/lib/tracking/cityCoordinates'
import { getRoute, type RouteResult } from '@/lib/tracking/routeService'
import { createEngine, type Engine, type Snapshot, type TimelineItem } from '@/lib/tracking/trackingEngine'
import type { LatLng } from '@/lib/tracking/geo'
import type { Mission } from '@/types/mission'
import ShipmentMap from './components/ShipmentMap'

/**
 * Suivi en Direct (Back Office) — /gestion/suivi
 *
 * Même expérience de suivi que le portail client, pour les gestionnaires/admins :
 * elle RÉUTILISE exactement le moteur (`trackingEngine`), la géométrie routière
 * (`routeService`) et l'endpoint GPS réel de Mission.API (`getLiveFix`). Le
 * gestionnaire choisit n'importe quelle mission active et suit le camion en
 * temps réel : itinéraire, position, ETA, statut, chauffeur, véhicule, timeline.
 */

const ACTIVE = ['EN_ATTENTE', 'EN_COURS']

const fmt = (d?: Date | string | null) => {
    if (!d) return '—'
    const date = d instanceof Date ? d : new Date(d)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function SuiviPage() {
    const [missions, setMissions] = useState<Mission[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [route, setRoute] = useState<RouteResult | null>(null)
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
    const [follow, setFollow] = useState(false)
    const [recenter, setRecenter] = useState(0)
    const [isLive, setIsLive] = useState(false)
    const liveFixRef = useRef<any>(null)
    const liveRef = useRef<{ position: LatLng; index: number; bearing: number } | null>(null)

    // ── Chargement des missions (resync serveur toutes les 60 s) ──────────────
    const load = useCallback(() => {
        missionService.getAll()
            .then((data) => {
                setMissions(data)
                setSelectedId((cur) => {
                    if (cur && data.some(m => m.idMission === cur)) return cur
                    const active = data.find(m => ACTIVE.includes(m.statut))
                    return active?.idMission ?? null
                })
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        load()
        const id = setInterval(load, 60_000)
        return () => clearInterval(id)
    }, [load])

    const actives = missions
        .filter(m => ACTIVE.includes(m.statut))
        .sort((a, b) => +new Date(a.dateDepart) - +new Date(b.dateDepart))
    const selected = missions.find(m => m.idMission === selectedId) || null
    const recentes = missions
        .filter(m => ['TERMINEE', 'ANNULEE'].includes(m.statut))
        .sort((a, b) => +new Date(b.dateDepart) - +new Date(a.dateDepart)).slice(0, 5)

    // ── Route de la mission sélectionnée ──────────────────────────────────────
    useEffect(() => {
        if (!selected) { setRoute(null); return }
        let alive = true
        setRoute(null)
        const from = resolveCity(selected.villeDepart)
        const to = resolveCity(selected.villeArrivee || selected.destination)
        getRoute(from, to).then(r => { if (alive) setRoute(r) })
        return () => { alive = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId])

    const engine: Engine | null = useMemo(
        () => (route && selected ? createEngine({ mission: selected, route }) : null),
        [route, selected])

    // ── Polling GPS réel (5 s) : un fix frais (< 60 s) prime sur la simulation ─
    useEffect(() => {
        if (!selectedId) return
        liveFixRef.current = null; setIsLive(false)
        let alive = true
        const poll = async () => {
            const fix = await getLiveFix(selectedId)
            if (!alive) return
            const fresh = !!(fix && fix.isFresh)
            liveFixRef.current = fresh ? fix : null
            setIsLive(fresh)
        }
        poll()
        const id = setInterval(poll, 5000)
        return () => { alive = false; clearInterval(id) }
    }, [selectedId])

    // ── Tick texte (1 s) : snapshot depuis le GPS réel si dispo, sinon simulation ─
    useEffect(() => {
        if (!engine) { setSnapshot(null); return }
        const upd = () => {
            const f = liveFixRef.current
            let s: Snapshot
            if (f) {
                s = engine.snapshotFromPosition({
                    latitude: f.latitude, longitude: f.longitude,
                    speedKmh: f.speedKmh, heading: f.heading,
                })
                liveRef.current = { position: s.position, index: s.index, bearing: s.bearing }
            } else {
                s = engine.snapshotAt(Date.now())
                liveRef.current = null
            }
            setSnapshot(s)
        }
        upd()
        const id = setInterval(upd, 1000)
        return () => clearInterval(id)
    }, [engine])

    const timeline: TimelineItem[] = useMemo(
        () => (engine ? engine.buildTimeline(Date.now()) : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [engine, snapshot?.progress])

    return (
        <>
            <Row className="mb-3 align-items-center">
                <Col>
                    <h4 className="mb-0">
                        <IconifyIcon icon="ri:truck-line" className="me-2 text-primary" />
                        Suivi en Direct
                    </h4>
                    <p className="text-muted mb-0">
                        Supervision temps réel des missions — position GPS du chauffeur, itinéraire, ETA et statut
                    </p>
                </Col>
                <Col xs="auto">
                    <Badge bg={isLive ? 'success' : 'secondary'} className="px-3 py-2">
                        <IconifyIcon icon={isLive ? 'ri:base-station-line' : 'ri:radar-line'} className="me-1" />
                        {isLive ? 'GPS en direct' : 'Position estimée'}
                    </Badge>
                </Col>
            </Row>

            {/* Sélecteur de mission active */}
            {actives.length > 0 && (
                <div className="d-flex gap-2 flex-wrap mb-3">
                    {actives.map(m => (
                        <Button key={m.idMission} size="sm"
                            variant={m.idMission === selectedId ? 'primary' : 'outline-secondary'}
                            onClick={() => setSelectedId(m.idMission)}>
                            #{m.idMission} · {m.villeDepart || '—'} → {m.villeArrivee || m.destination}
                        </Button>
                    ))}
                </div>
            )}

            {loading ? (
                <Card><Card.Body className="text-center text-muted py-5">
                    <Spinner animation="border" className="mb-2" /><div>Chargement du suivi…</div>
                </Card.Body></Card>
            ) : !selected ? (
                <Card><Card.Body className="text-center text-muted py-5">
                    <IconifyIcon icon="ri:inbox-line" style={{ fontSize: 40 }} className="d-block mb-2" />
                    Aucune mission active à suivre pour le moment.
                </Card.Body></Card>
            ) : (
                <>
                    {/* En-tête d'état + progression */}
                    {snapshot && (
                        <Card className="mb-3"><Card.Body>
                            <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                                <Badge style={{ background: snapshot.state.color }} className="px-3 py-2">
                                    {snapshot.state.icon} {snapshot.state.label}
                                </Badge>
                                <span className="text-muted small">
                                    Mission #{selected.idMission} · {selected.villeDepart || '—'} → {selected.villeArrivee || selected.destination}
                                </span>
                                <div className="flex-grow-1" />
                                <Button size="sm" variant={follow ? 'primary' : 'outline-secondary'} onClick={() => setFollow(f => !f)}>
                                    <IconifyIcon icon="ri:focus-3-line" className="me-1" />
                                    {follow ? 'Suivi activé' : 'Suivre le camion'}
                                </Button>
                                <Button size="sm" variant="outline-secondary" onClick={() => setRecenter(r => r + 1)}>
                                    <IconifyIcon icon="ri:fullscreen-line" className="me-1" /> Recadrer
                                </Button>
                            </div>
                            <ProgressBar now={snapshot.progress} variant="danger" style={{ height: 12 }} />
                            <div className="d-flex justify-content-between mt-2 small text-muted">
                                <span>{snapshot.traveledKm.toFixed(0)} km parcourus</span>
                                <span className="fw-bold text-dark">{Math.round(snapshot.progress)}%</span>
                                <span>ETA {fmt(snapshot.etaDate)}</span>
                            </div>
                        </Card.Body></Card>
                    )}

                    {/* Carte + panneau latéral */}
                    <Row className="g-3 mb-3">
                        <Col lg={8}>
                            <Card><Card.Body className="p-2">
                                {engine
                                    ? <ShipmentMap engine={engine} follow={follow} recenterSignal={recenter} liveRef={liveRef} />
                                    : <div className="d-flex align-items-center justify-content-center text-muted"
                                        style={{ height: 'clamp(360px,55vh,560px)' }}>
                                        <Spinner animation="border" size="sm" className="me-2" /> Calcul de l&apos;itinéraire…
                                    </div>}
                            </Card.Body></Card>
                        </Col>
                        <Col lg={4}>
                            <Card className="mb-3"><Card.Body>
                                <h6 className="d-flex align-items-center gap-2 mb-3">
                                    <IconifyIcon icon="ri:user-star-line" className="text-primary" /> Chauffeur
                                </h6>
                                <div className="d-flex justify-content-between py-1 small">
                                    <span className="text-muted">Nom</span>
                                    <span className="fw-semibold">{selected.chauffeurNom || 'Non affecté'}</span>
                                </div>
                                <div className="d-flex justify-content-between py-1 small">
                                    <span className="text-muted">Vitesse</span>
                                    <span className="fw-semibold">{snapshot ? `${Math.round(snapshot.speedKmh)} km/h` : '—'}</span>
                                </div>
                                <div className="d-flex justify-content-between py-1 small">
                                    <span className="text-muted">Temps restant</span>
                                    <span className="fw-semibold">{snapshot && snapshot.remainingMin > 0 ? `${snapshot.remainingMin} min` : '—'}</span>
                                </div>
                            </Card.Body></Card>
                            <Card><Card.Body>
                                <h6 className="d-flex align-items-center gap-2 mb-3">
                                    <IconifyIcon icon="ri:truck-line" className="text-primary" /> Véhicule
                                </h6>
                                <div className="d-flex justify-content-between py-1 small">
                                    <span className="text-muted">Immatriculation</span>
                                    <span className="fw-semibold">{selected.vehiculeImmatriculation || 'Non affecté'}</span>
                                </div>
                                <div className="d-flex justify-content-between py-1 small">
                                    <span className="text-muted">Type (estim. IA)</span>
                                    <span className="fw-semibold">{selected.aiVehiculeTypeUsed || '—'}</span>
                                </div>
                                <div className="d-flex justify-content-between py-1 small">
                                    <span className="text-muted">Client</span>
                                    <span className="fw-semibold">{selected.clientNom || '—'}</span>
                                </div>
                            </Card.Body></Card>
                        </Col>
                    </Row>

                    {/* Itinéraire + timeline */}
                    <Row className="g-3 mb-3">
                        <Col lg={5}>
                            <Card className="h-100"><Card.Body>
                                <h6 className="d-flex align-items-center gap-2 mb-3">
                                    <IconifyIcon icon="ri:route-line" className="text-primary" /> Itinéraire
                                </h6>
                                <div className="d-flex justify-content-between py-1 small">
                                    <span className="text-muted">Départ</span><span className="fw-semibold">{selected.villeDepart || '—'}</span>
                                </div>
                                <div className="d-flex justify-content-between py-1 small">
                                    <span className="text-muted">Arrivée</span><span className="fw-semibold">{selected.villeArrivee || selected.destination}</span>
                                </div>
                                <div className="d-flex justify-content-between py-1 small">
                                    <span className="text-muted">Distance totale</span>
                                    <span className="fw-semibold">{(snapshot?.totalKm ?? selected.distanceKm ?? 0).toFixed(0)} km</span>
                                </div>
                                <div className="d-flex justify-content-between py-1 small">
                                    <span className="text-muted">Distance restante</span>
                                    <span className="fw-semibold">{snapshot ? `${snapshot.remainingKm.toFixed(0)} km` : '—'}</span>
                                </div>
                                <div className="d-flex justify-content-between py-1 small">
                                    <span className="text-muted">Départ prévu</span><span className="fw-semibold">{fmt(selected.dateDepart)}</span>
                                </div>
                                {route?.source === 'fallback' && (
                                    <div className="text-muted mt-2" style={{ fontSize: 11 }}>
                                        ℹ️ Itinéraire estimé (service de calcul routier momentanément indisponible).
                                    </div>
                                )}
                            </Card.Body></Card>
                        </Col>
                        <Col lg={7}>
                            <Card className="h-100"><Card.Body>
                                <h6 className="d-flex align-items-center gap-2 mb-3">
                                    <IconifyIcon icon="ri:history-line" className="text-primary" /> Timeline
                                </h6>
                                <div className="d-flex flex-column gap-2">
                                    {timeline.map((it, i) => (
                                        <div key={i} className="d-flex align-items-start gap-2">
                                            <span style={{ opacity: it.done ? 1 : 0.35 }}>{it.icon}</span>
                                            <div className="flex-grow-1">
                                                <div className={`small ${it.done ? 'fw-semibold' : 'text-muted'}`}>{it.title}</div>
                                                <div className="text-muted" style={{ fontSize: 11 }}>{it.desc}</div>
                                            </div>
                                            <span className="text-muted flex-shrink-0" style={{ fontSize: 11 }}>{fmt(it.time)}</span>
                                            {it.done && <IconifyIcon icon="ri:checkbox-circle-fill" className="text-success flex-shrink-0" />}
                                        </div>
                                    ))}
                                </div>
                            </Card.Body></Card>
                        </Col>
                    </Row>

                    {/* Historique récent */}
                    {recentes.length > 0 && (
                        <Card><Card.Body>
                            <h6 className="d-flex align-items-center gap-2 mb-3">
                                <IconifyIcon icon="ri:time-line" className="text-primary" /> Historique récent
                            </h6>
                            <Table size="sm" hover responsive className="mb-0">
                                <tbody>
                                    {recentes.map(m => (
                                        <tr key={m.idMission}>
                                            <td className="fw-semibold">{m.villeDepart || '—'} → {m.villeArrivee || m.destination}</td>
                                            <td className="text-muted small">{fmt(m.dateDepart)}</td>
                                            <td className="text-end">
                                                <Badge bg={m.statut === 'TERMINEE' ? 'success' : 'danger'} className="fw-normal">
                                                    {m.statut === 'TERMINEE' ? 'Livrée' : 'Annulée'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body></Card>
                    )}
                </>
            )}
        </>
    )
}
