"use client"

import { card } from "@/components/portal/ui"

/**
 * Panneaux d'information du suivi : état, chauffeur, véhicule, itinéraire,
 * timeline. Purement présentationnels — alimentés par l'instantané du moteur.
 */

const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—")
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("fr-FR",
    { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—")

export function StateBadge({ state, big }) {
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: state.color, color: "#fff", borderRadius: 20,
            padding: big ? "7px 16px" : "4px 12px", fontWeight: 700,
            fontSize: big ? 14.5 : 12.5, whiteSpace: "nowrap",
        }}>
            <span>{state.icon}</span>{state.label}
        </span>
    )
}

function Row({ label, value, strong }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0",
            borderBottom: "1px solid var(--pborder)", fontSize: 13.5 }}>
            <span style={{ color: "var(--pmuted)" }}>{label}</span>
            <span style={{ fontWeight: strong ? 700 : 600, textAlign: "right" }}>{value}</span>
        </div>
    )
}

export function DriverCard({ mission, snapshot }) {
    const name = mission.chauffeurNom || "En cours d'affectation"
    const initials = name.split(" ").filter(Boolean).slice(0, 2).map(s => s[0]).join("").toUpperCase() || "?"
    return (
        <div style={card}>
            <h4 style={h4}>🧑‍✈️ Chauffeur</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ width: 46, height: 46, borderRadius: "50%", background: "#0F1B24", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>
                    {initials}
                </span>
                <div>
                    <div style={{ fontWeight: 700 }}>{name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--pmuted)" }}>Chauffeur XPARK</div>
                </div>
            </div>
            <Row label="Véhicule" value={mission.vehiculeImmatriculation || "—"} />
            <Row label="Vitesse actuelle" value={`${Math.round(snapshot.speedKmh)} km/h`} />
            <Row label="Statut" value={snapshot.state.label} />
            <Row label="Téléphone" value="Via le support XPARK" />
        </div>
    )
}

export function VehicleCard({ mission, snapshot }) {
    return (
        <div style={card}>
            <h4 style={h4}>🚚 Véhicule</h4>
            <Row label="Immatriculation" value={mission.vehiculeImmatriculation || "—"} />
            <Row label="Type" value={mission.aiVehiculeTypeUsed || "Véhicule de transport"} />
            <Row label="Vitesse" value={`${Math.round(snapshot.speedKmh)} km/h`} />
            <Row label="Distance totale" value={`${snapshot.totalKm.toFixed(0)} km`} />
            <Row label="Distance restante" value={`${snapshot.remainingKm.toFixed(0)} km`} strong />
            <Row label="Temps restant estimé" value={remainingLabel(snapshot.remainingMin)} strong />
        </div>
    )
}

export function RouteCard({ mission, snapshot }) {
    return (
        <div style={card}>
            <h4 style={h4}>🗺️ Itinéraire</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18 }}>📦</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>{mission.villeDepart || "Départ"}</div>
                </div>
                <div style={{ flex: 1, height: 3, background: "linear-gradient(90deg,#C11425,var(--pborder))", borderRadius: 2 }} />
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18 }}>🏁</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>{mission.villeArrivee || mission.destination}</div>
                </div>
            </div>
            <Row label="Distance totale" value={`${snapshot.totalKm.toFixed(0)} km`} />
            <Row label="Déjà parcouru" value={`${snapshot.traveledKm.toFixed(0)} km`} />
            <Row label="Restant" value={`${snapshot.remainingKm.toFixed(0)} km`} strong />
            <Row label="Arrivée estimée (ETA)" value={fmtDateTime(snapshot.etaDate)} strong />
        </div>
    )
}

export function Timeline({ items }) {
    return (
        <div style={card}>
            <h4 style={h4}>🧭 Historique du colis</h4>
            <div style={{ position: "relative", marginTop: 6 }}>
                {items.map((it, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, paddingBottom: i < items.length - 1 ? 16 : 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                                background: it.done ? "#C11425" : "var(--pbg)",
                                border: `2px solid ${it.done ? "#C11425" : "var(--pborder)"}`,
                                filter: it.done ? "none" : "grayscale(1) opacity(.6)" }}>
                                {it.icon}
                            </span>
                            {i < items.length - 1 && (
                                <span style={{ width: 2, flex: 1, minHeight: 18,
                                    background: it.done ? "#C11425" : "var(--pborder)" }} />
                            )}
                        </div>
                        <div style={{ paddingTop: 2, opacity: it.done ? 1 : 0.6 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 700, fontSize: 14 }}>{it.title}</span>
                                <span style={{ fontSize: 12, color: "var(--pmuted)" }}>{fmtTime(it.time)}</span>
                                {!it.done && <span style={{ fontSize: 11, color: "var(--pmuted)" }}>· à venir</span>}
                            </div>
                            <div style={{ fontSize: 13, color: "var(--pmuted)" }}>{it.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function remainingLabel(min) {
    if (min <= 0) return "Arrivée imminente"
    const h = Math.floor(min / 60)
    const m = min % 60
    return h > 0 ? `${h} h ${m > 0 ? `${m} min` : ""}`.trim() : `${m} min`
}

const h4 = { fontSize: 15.5, fontWeight: 700, marginBottom: 14 }
