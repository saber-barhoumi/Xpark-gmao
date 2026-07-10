"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import missionService from "@/lib/missionService"
import ClientPortalLayout from "@/components/portal/ClientPortalLayout"
import { card, Badge, EmptyState, dateTimeFr, tnd } from "@/components/portal/ui"

/**
 * 📍 Suivi en direct — progression temps réel des missions du client.
 * Rafraîchissement automatique toutes les 30 s (statut, chauffeur, véhicule).
 * L'ETA est estimée à partir de la distance IA (vitesse moyenne 60 km/h).
 */

const REFRESH_MS = 30_000
const AVG_SPEED_KMH = 60

/** Étapes du cycle de vie d'une mission, pour la timeline */
const STEPS = [
    { key: "demande",  label: "Demande validée" },
    { key: "affectee", label: "Chauffeur affecté" },
    { key: "route",    label: "En route" },
    { key: "livree",   label: "Livrée" },
]

function stepIndex(m) {
    if (m.statut === "TERMINEE") return 3
    if (m.statut === "EN_COURS") return 2
    if (m.chauffeurNom || m.vehiculeImmatriculation || m.employeeId) return 1
    return 0
}

/** % de progression du trajet pour une mission EN_COURS (temps écoulé / durée estimée) */
function routeProgress(m) {
    if (m.statut !== "EN_COURS") return null
    const start = new Date(m.dateDepart).getTime()
    const hours = (m.distanceKm || 0) > 0 ? m.distanceKm / AVG_SPEED_KMH : 2
    const end = start + hours * 3600_000
    const now = Date.now()
    if (now <= start) return 0
    if (now >= end) return 95   // jamais 100 tant que non TERMINEE
    return Math.round(((now - start) / (end - start)) * 95)
}

function eta(m) {
    if ((m.distanceKm || 0) <= 0) return null
    const start = new Date(m.dateDepart).getTime()
    return new Date(start + (m.distanceKm / AVG_SPEED_KMH) * 3600_000)
}

export default function TrackingPage() {
    const [missions, setMissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastUpdate, setLastUpdate] = useState(null)

    const load = useCallback(() => {
        missionService.getMyMissions()
            .then((data) => { setMissions(data); setLastUpdate(new Date()) })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        load()
        const timer = setInterval(load, REFRESH_MS)
        return () => clearInterval(timer)
    }, [load])

    const actives = missions
        .filter(m => ["EN_ATTENTE", "EN_COURS"].includes(m.statut))
        .sort((a, b) => new Date(a.dateDepart) - new Date(b.dateDepart))
    const recentes = missions
        .filter(m => ["TERMINEE", "ANNULEE"].includes(m.statut))
        .sort((a, b) => new Date(b.dateDepart) - new Date(a.dateDepart))
        .slice(0, 5)

    return (
        <ClientPortalLayout title="📍 Suivi en direct">
            {/* Barre d'état du suivi */}
            <div style={{ ...card, marginBottom: 22, display: "flex", alignItems: "center",
                gap: 12, flexWrap: "wrap", padding: "14px 22px" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#146c43",
                    boxShadow: "0 0 0 4px rgba(20,108,67,.15)" }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Suivi actif</span>
                <span style={{ color: "var(--pmuted)", fontSize: 13 }}>
                    Actualisation automatique toutes les 30 s
                    {lastUpdate && ` · dernière mise à jour ${lastUpdate.toLocaleTimeString("fr-FR")}`}
                </span>
                <div style={{ flex: 1 }} />
                <button type="button" onClick={load}
                    style={{ border: "1px solid var(--pborder)", background: "var(--pbg)", color: "var(--ptext)",
                        borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    ⟳ Actualiser
                </button>
            </div>

            {loading ? (
                <div style={{ ...card, textAlign: "center", color: "var(--pmuted)" }}>Chargement du suivi…</div>
            ) : actives.length === 0 ? (
                <EmptyState icon="📦" title="Aucune mission en cours"
                    text="Vos missions actives apparaîtront ici avec leur progression en temps réel."
                    action={<Link href="/account/reserver" className="thm-btn" style={{ padding: "11px 22px" }}>➕ Réserver un transport<span /></Link>} />
            ) : (
                actives.map((m) => <MissionTracker key={m.idMission} m={m} />)
            )}

            {recentes.length > 0 && (
                <div style={{ ...card, marginTop: 24 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🕐 Historique récent</h4>
                    {recentes.map(m => (
                        <div key={m.idMission} style={{ display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 0", borderBottom: "1px solid var(--pborder)", fontSize: 14, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600 }}>{m.villeDepart || "—"} → {m.villeArrivee || m.destination}</span>
                            <span style={{ color: "var(--pmuted)", fontSize: 13 }}>{dateTimeFr(m.dateDepart)}</span>
                            <div style={{ flex: 1 }} />
                            <Badge statut={m.statut} />
                        </div>
                    ))}
                </div>
            )}
        </ClientPortalLayout>
    )
}

/** Carte de suivi d'une mission active : timeline + infos chauffeur/véhicule + ETA */
function MissionTracker({ m }) {
    const idx = stepIndex(m)
    const progress = routeProgress(m)
    const arrivee = eta(m)

    return (
        <div style={{ ...card, marginBottom: 18 }}>
            {/* En-tête mission */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <span style={{ fontSize: 22 }}>🚚</span>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>
                        {m.villeDepart || "—"} → {m.villeArrivee || m.destination}
                    </div>
                    <div style={{ color: "var(--pmuted)", fontSize: 13 }}>
                        Mission #{m.idMission} · départ {dateTimeFr(m.dateDepart)}
                    </div>
                </div>
                <div style={{ flex: 1 }} />
                <Badge statut={m.statut} />
            </div>

            {/* Timeline d'étapes */}
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 18 }}>
                {STEPS.map((s, i) => {
                    const done = i <= idx
                    const current = i === idx
                    return (
                        <div key={s.key} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                            {i > 0 && (
                                <div style={{ position: "absolute", top: 13, right: "50%", width: "100%", height: 3,
                                    background: i <= idx ? "#C11425" : "var(--pborder)", zIndex: 0 }} />
                            )}
                            <div style={{ position: "relative", zIndex: 1, width: 28, height: 28, borderRadius: "50%",
                                margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center",
                                background: done ? "#C11425" : "var(--pbg)",
                                border: `3px solid ${done ? "#C11425" : "var(--pborder)"}`,
                                color: "#fff", fontSize: 13, fontWeight: 700,
                                boxShadow: current ? "0 0 0 5px rgba(193,20,37,.15)" : "none" }}>
                                {done ? "✓" : ""}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: current ? 700 : 400,
                                color: done ? "var(--ptext)" : "var(--pmuted)" }}>{s.label}</div>
                        </div>
                    )
                })}
            </div>

            {/* Barre de progression du trajet (missions en route) */}
            {progress !== null && (
                <div style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5,
                        color: "var(--pmuted)", marginBottom: 6 }}>
                        <span>🚛 Progression estimée du trajet</span>
                        <span style={{ fontWeight: 700, color: "var(--ptext)" }}>{progress}%</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 6, background: "var(--pbg)",
                        border: "1px solid var(--pborder)", overflow: "hidden" }}>
                        <div style={{ width: `${progress}%`, height: "100%", borderRadius: 6,
                            background: "linear-gradient(90deg,#C11425,#e04250)", transition: "width .6s ease" }} />
                    </div>
                </div>
            )}

            {/* Infos opérationnelles */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                <Info label="Chauffeur" value={m.chauffeurNom || "En cours d'affectation"} icon="👤" />
                <Info label="Véhicule" value={m.vehiculeImmatriculation || "En cours d'affectation"} icon="🚛" />
                <Info label="Distance" value={m.distanceKm ? `${m.distanceKm.toFixed(0)} km` : "—"} icon="📏" />
                <Info label={m.statut === "EN_COURS" ? "Arrivée estimée" : "Coût estimé"}
                    value={m.statut === "EN_COURS" && arrivee ? dateTimeFr(arrivee)
                        : (m.coutEstimeAI ? tnd(m.coutEstimeAI) : "—")} icon={m.statut === "EN_COURS" ? "🕓" : "💰"} />
            </div>

            {m.statut === "EN_ATTENTE" && (
                <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--pmuted)" }}>
                    ⏳ Votre demande est validée : un chauffeur et un véhicule seront affectés par notre équipe.
                </p>
            )}
        </div>
    )
}

function Info({ label, value, icon }) {
    return (
        <div style={{ background: "var(--pbg)", border: "1px solid var(--pborder)", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 11.5, color: "var(--pmuted)", marginBottom: 3 }}>{icon} {label}</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{value}</div>
        </div>
    )
}
