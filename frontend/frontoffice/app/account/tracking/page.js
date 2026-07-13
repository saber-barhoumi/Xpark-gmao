"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import missionService from "@/lib/missionService"
import ClientPortalLayout from "@/components/portal/ClientPortalLayout"
import { card, EmptyState, dateTimeFr } from "@/components/portal/ui"
import { useToast } from "@/components/portal/Feedback"
import { resolveCity } from "@/lib/tracking/cityCoordinates"
import { getRoute } from "@/lib/tracking/routeService"
import { createEngine } from "@/lib/tracking/trackingEngine"
import { getLiveFix } from "@/lib/tracking/liveTrackingService"
import { DriverCard, VehicleCard, RouteCard, Timeline, StateBadge } from "@/components/tracking/TrackingPanels"

/**
 * 📍 Suivi en direct — expérience type Uber/Bolt pour le transport de marchandises.
 *
 * Architecture modulaire (prête pour le GPS réel) :
 *   cityCoordinates → géolocalise départ/arrivée
 *   routeService    → géométrie routière (OSRM + repli)
 *   trackingEngine  → position/état/ETA fonction du temps (à remplacer par le GPS)
 *   ShipmentMap     → carte Leaflet, camion animé qui pivote selon le cap
 *   TrackingPanels  → chauffeur / véhicule / itinéraire / timeline
 * La page orchestre : rafraîchissement du texte (1 s), notifications live, sélection.
 */

// Leaflet dépend de `window` → chargé côté client uniquement
const ShipmentMap = dynamic(() => import("@/components/tracking/ShipmentMap"), {
    ssr: false,
    loading: () => (
        <div style={{ height: "clamp(360px, 55vh, 560px)", borderRadius: 14, background: "var(--pbg)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pmuted)" }}>
            Chargement de la carte…
        </div>
    ),
})

// Messages de notification par changement d'état
const NOTIF = {
    DEPARTED:  { text: "🚦 Le chauffeur a démarré le trajet.", variant: "info" },
    IN_TRANSIT:{ text: "🚚 Votre colis est en route.", variant: "info" },
    TRAFFIC:   { text: "🚧 Ralentissement dû au trafic — léger retard possible.", variant: "error" },
    STOP:      { text: "⏸️ Arrêt technique temporaire du chauffeur.", variant: "error" },
    NEAR:      { text: "📍 Votre colis approche de la destination !", variant: "success" },
    ARRIVED:   { text: "🏁 Le véhicule est arrivé à destination.", variant: "success" },
    DELIVERED: { text: "✅ Livraison effectuée avec succès.", variant: "success" },
}

export default function TrackingPage() {
    const [toast, toastNode] = useToast()
    const [missions, setMissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)
    const [route, setRoute] = useState(null)
    const [snapshot, setSnapshot] = useState(null)
    const [dark, setDark] = useState(false)
    const [follow, setFollow] = useState(false)
    const [recenter, setRecenter] = useState(0)
    const [isLive, setIsLive] = useState(false)   // GPS réel frais disponible
    const prevStateRef = useRef(null)
    const liveFixRef = useRef(null)               // dernier fix GPS frais (ou null)
    const liveRef = useRef(null)                  // {position,index,bearing} pour la carte

    // ── Chargement des missions ──────────────────────────────────────────────
    const load = useCallback(() => {
        missionService.getMyMissions()
            .then((data) => {
                setMissions(data)
                setSelectedId((cur) => {
                    if (cur && data.some(m => m.idMission === cur)) return cur
                    const active = data.find(m => ["EN_ATTENTE", "EN_COURS"].includes(m.statut))
                    return active?.idMission ?? null
                })
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        setDark(typeof window !== "undefined" && localStorage.getItem("xpark_portal_dark") === "1")
        load()
        const id = setInterval(load, 60_000) // resync périodique du statut serveur
        return () => clearInterval(id)
    }, [load])

    const actives = missions
        .filter(m => ["EN_ATTENTE", "EN_COURS"].includes(m.statut))
        .sort((a, b) => new Date(a.dateDepart) - new Date(b.dateDepart))
    const selected = missions.find(m => m.idMission === selectedId) || null
    const recentes = missions
        .filter(m => ["TERMINEE", "ANNULEE"].includes(m.statut))
        .sort((a, b) => new Date(b.dateDepart) - new Date(a.dateDepart)).slice(0, 5)

    // ── Récupération de la route pour la mission sélectionnée ────────────────
    useEffect(() => {
        if (!selected) { setRoute(null); return }
        let alive = true
        setRoute(null)
        prevStateRef.current = null
        const from = resolveCity(selected.villeDepart)
        const to = resolveCity(selected.villeArrivee || selected.destination)
        getRoute(from, to).then(r => { if (alive) setRoute(r) })
        return () => { alive = false }
    }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

    const engine = useMemo(
        () => (route && selected ? createEngine({ mission: selected, route }) : null),
        [route, selected])

    // ── Polling GPS réel (5 s) : si un fix frais existe, il prime ───────────
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

    // ── Tick texte (1 s) : snapshot depuis le GPS réel si dispo, sinon simulation ──
    useEffect(() => {
        if (!engine) { setSnapshot(null); return }
        const upd = () => {
            const f = liveFixRef.current
            let s
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

    // ── Notifications live sur changement d'état ─────────────────────────────
    useEffect(() => {
        if (!snapshot) return
        const k = snapshot.state.key
        const prev = prevStateRef.current
        prevStateRef.current = k
        if (prev && prev !== k && NOTIF[k]) toast(NOTIF[k].text, NOTIF[k].variant)
    }, [snapshot?.state.key]) // eslint-disable-line react-hooks/exhaustive-deps

    const timeline = useMemo(
        () => (engine ? engine.buildTimeline(Date.now()) : []),
        [engine, snapshot?.progress])

    return (
        <ClientPortalLayout title="📍 Suivi en direct">
            {toastNode}

            {/* Sélecteur de mission active */}
            {actives.length > 1 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {actives.map(m => (
                        <button key={m.idMission} type="button" onClick={() => setSelectedId(m.idMission)}
                            style={{ border: "1px solid var(--pborder)", borderRadius: 20, padding: "7px 14px",
                                fontSize: 13, cursor: "pointer", fontWeight: m.idMission === selectedId ? 700 : 400,
                                background: m.idMission === selectedId ? "#C11425" : "var(--pcard)",
                                color: m.idMission === selectedId ? "#fff" : "var(--ptext)" }}>
                            #{m.idMission} · {m.villeDepart || "—"} → {m.villeArrivee || m.destination}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div style={{ ...card, textAlign: "center", color: "var(--pmuted)" }}>Chargement du suivi…</div>
            ) : !selected ? (
                <EmptyState icon="📦" title="Aucune mission à suivre"
                    text="Vos missions en cours s'afficheront ici sur une carte, en temps réel."
                    action={<Link href="/account/reserver" className="thm-btn" style={{ padding: "11px 22px" }}>➕ Réserver un transport<span /></Link>} />
            ) : (
                <>
                    {/* En-tête d'état + progression */}
                    {snapshot && (
                        <div style={{ ...card, marginBottom: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                                <StateBadge state={snapshot.state} big />
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12,
                                    fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                                    background: isLive ? "#d1e7dd" : "var(--pbg)",
                                    color: isLive ? "#146c43" : "var(--pmuted)",
                                    border: `1px solid ${isLive ? "#146c43" : "var(--pborder)"}` }}>
                                    {isLive ? "🛰️ GPS en direct" : "📡 Position estimée"}
                                </span>
                                <div style={{ fontSize: 13.5, color: "var(--pmuted)" }}>
                                    Mission #{selected.idMission} · {selected.villeDepart || "—"} → {selected.villeArrivee || selected.destination}
                                </div>
                                <div style={{ flex: 1 }} />
                                <button type="button" onClick={() => setFollow(f => !f)}
                                    style={btn(follow)}>{follow ? "🎯 Suivi activé" : "🎯 Suivre le camion"}</button>
                                <button type="button" onClick={() => setRecenter(r => r + 1)}
                                    style={btn(false)}>⤢ Recadrer</button>
                            </div>
                            <div style={{ height: 12, borderRadius: 7, background: "var(--pbg)",
                                border: "1px solid var(--pborder)", overflow: "hidden" }}>
                                <div style={{ width: `${snapshot.progress}%`, height: "100%", borderRadius: 7,
                                    background: "linear-gradient(90deg,#C11425,#e04250)", transition: "width 1s linear" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6,
                                fontSize: 12.5, color: "var(--pmuted)" }}>
                                <span>{snapshot.traveledKm.toFixed(0)} km parcourus</span>
                                <span style={{ fontWeight: 700, color: "var(--ptext)" }}>{Math.round(snapshot.progress)}%</span>
                                <span>ETA {dateTimeFr(snapshot.etaDate)}</span>
                            </div>
                        </div>
                    )}

                    {/* Carte + panneau latéral */}
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.7fr) minmax(0,1fr)",
                        gap: 16, marginBottom: 16 }} className="track-grid">
                        <div style={{ ...card, padding: 8 }}>
                            {engine
                                ? <ShipmentMap engine={engine} dark={dark} follow={follow} recenterSignal={recenter} liveRef={liveRef} />
                                : <div style={{ height: "clamp(360px,55vh,560px)", display: "flex",
                                    alignItems: "center", justifyContent: "center", color: "var(--pmuted)" }}>
                                    Calcul de l'itinéraire…
                                </div>}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {snapshot && <DriverCard mission={selected} snapshot={snapshot} />}
                            {snapshot && <VehicleCard mission={selected} snapshot={snapshot} />}
                        </div>
                    </div>

                    {/* Itinéraire + timeline */}
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)",
                        gap: 16, marginBottom: 16 }} className="track-grid">
                        {snapshot && <RouteCard mission={selected} snapshot={snapshot} />}
                        <Timeline items={timeline} />
                    </div>

                    {route?.source === "fallback" && (
                        <p style={{ fontSize: 12, color: "var(--pmuted)", margin: "0 0 16px" }}>
                            ℹ️ Itinéraire estimé (le service de calcul routier était momentanément indisponible).
                        </p>
                    )}
                </>
            )}

            {/* Historique récent */}
            {recentes.length > 0 && (
                <div style={card}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🕐 Historique récent</h4>
                    {recentes.map(m => (
                        <div key={m.idMission} style={{ display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 0", borderBottom: "1px solid var(--pborder)", fontSize: 14, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600 }}>{m.villeDepart || "—"} → {m.villeArrivee || m.destination}</span>
                            <span style={{ color: "var(--pmuted)", fontSize: 13 }}>{dateTimeFr(m.dateDepart)}</span>
                            <div style={{ flex: 1 }} />
                            <span style={{ fontSize: 12.5, fontWeight: 700,
                                color: m.statut === "TERMINEE" ? "#146c43" : "#b02a37" }}>
                                {m.statut === "TERMINEE" ? "Livrée" : "Annulée"}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <style jsx global>{`
                @media (max-width: 860px) {
                    .track-grid { grid-template-columns: 1fr !important; }
                }
                .leaflet-container { font-family: inherit; }
            `}</style>
        </ClientPortalLayout>
    )
}

const btn = (active) => ({
    border: "1px solid var(--pborder)", borderRadius: 8, padding: "7px 13px", cursor: "pointer",
    fontSize: 12.5, fontWeight: 600,
    background: active ? "#C11425" : "var(--pbg)", color: active ? "#fff" : "var(--ptext)",
})
