"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import missionService from "@/lib/missionService"
import ClientPortalLayout from "@/components/portal/ClientPortalLayout"
import { useConfirm, useToast } from "@/components/portal/Feedback"

const STATUS = {
    EN_ATTENTE: { label: "⏳ En attente d'affectation", bg: "#fff3cd", color: "#b45309" },
    EN_COURS:   { label: "🚚 En cours", bg: "#cfe2ff", color: "#084298" },
    TERMINEE:   { label: "✅ Terminée", bg: "#e7f5ec", color: "#146c43" },
    ANNULEE:    { label: "❌ Annulée", bg: "#f1f1f1", color: "#6b7280" },
}
const FILTERS = ["TOUTES", "EN_ATTENTE", "EN_COURS", "TERMINEE", "ANNULEE"]

function MissionsInner() {
    const params = useSearchParams()
    const [confirm, confirmDialog] = useConfirm()
    const [toast, toastNode] = useToast()
    const [missions, setMissions] = useState([])
    const [filter, setFilter] = useState("TOUTES")
    const [loading, setLoading] = useState(true)
    const [info, setInfo] = useState(params.get("created") === "1"
        ? "✅ Réservation créée ! Elle est en attente d'affectation d'un véhicule et d'un chauffeur." : "")
    const [cancelling, setCancelling] = useState(0)
    const search = (params.get("q") || "").toLowerCase()

    const load = useCallback(async () => {
        try { setMissions(await missionService.getMyMissions()) }
        catch { /* session gérée par apiFetch */ }
        finally { setLoading(false) }
    }, [])

    useEffect(() => {
        load()
        const timer = setInterval(load, 20_000)
        return () => clearInterval(timer)
    }, [load])

    const handleCancel = async (id) => {
        const ok = await confirm({
            title: "Annuler cette réservation ?",
            message: "Cette action est définitive : la demande de transport sera annulée.",
            confirmLabel: "Oui, annuler",
            cancelLabel: "Non, garder",
            danger: true,
            icon: "🗑️",
        })
        if (!ok) return
        setCancelling(id)
        try {
            await missionService.cancelMyMission(id)
            setInfo("✅ Réservation annulée.")
            await load()
        } catch (err) {
            setInfo("")
            toast(err.message || "Annulation impossible (la mission a peut-être déjà été affectée).", "error")
        } finally { setCancelling(0) }
    }

    let filtered = filter === "TOUTES" ? missions : missions.filter(m => m.statut === filter)
    if (search) filtered = filtered.filter(m =>
        `${m.villeDepart} ${m.villeArrivee} ${m.destination} ${m.objetMission}`.toLowerCase().includes(search))

    return (
        <>
            {confirmDialog}
            {toastNode}
            {info && <div style={{ padding: 12, marginBottom: 20, background: "#e7f5ec", color: "#146c43", borderRadius: 10 }}>{info}</div>}

            {/* Filtres + action */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {FILTERS.map(f => (
                        <button key={f} type="button" onClick={() => setFilter(f)}
                            style={{ padding: "8px 16px", borderRadius: 20, border: "1px solid var(--pborder)",
                                background: filter === f ? "#C11425" : "var(--pcard)",
                                color: filter === f ? "#fff" : "var(--ptext)", fontSize: 13, cursor: "pointer" }}>
                            {f === "TOUTES" ? "Toutes" : STATUS[f]?.label.replace(/^\S+ /, "")}
                        </button>
                    ))}
                </div>
                <Link href="/account/reserver" className="thm-btn" style={{ padding: "10px 20px" }}>+ Réserver<span /></Link>
            </div>

            {loading ? (
                <p style={{ padding: 40, textAlign: "center", color: "var(--pmuted)" }}>Chargement…</p>
            ) : filtered.length === 0 ? (
                <div style={{ ...card, textAlign: "center", padding: 40 }}>
                    <p style={{ color: "var(--pmuted)", marginBottom: 18 }}>Aucune mission {search ? "ne correspond à la recherche" : "pour l'instant"}.</p>
                    <Link href="/account/reserver" className="thm-btn">+ Réserver un véhicule<span /></Link>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18 }}>
                    {filtered.map(m => {
                        const st = STATUS[m.statut] ?? STATUS.EN_ATTENTE
                        return (
                            <div key={m.idMission} style={card}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                                    <strong style={{ fontSize: 16 }}>{m.villeDepart || "—"} → {m.villeArrivee || m.destination}</strong>
                                    <span style={{ background: st.bg, color: st.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{st.label}</span>
                                </div>
                                <p style={{ fontSize: 13, color: "var(--pmuted)", marginBottom: 10 }}>
                                    #{m.idMission} · 📅 {new Date(m.dateDepart).toLocaleString("fr-FR")}
                                    {m.distanceKm > 0 && <> · 📏 {m.distanceKm.toFixed(0)} km</>}
                                </p>
                                {m.statut === "EN_ATTENTE" && (
                                    <>
                                        <p style={{ fontSize: 13, color: "#b45309", marginBottom: 12 }}>
                                            🤖 L&apos;OptimisateurFlotteIA choisira le véhicule le plus adapté et un chauffeur disponible.
                                            {m.coutEstimeAI > 0 && <> Prix estimé : <strong>{m.coutEstimeAI.toFixed(2)} TND</strong></>}
                                        </p>
                                        <button type="button" onClick={() => handleCancel(m.idMission)} disabled={cancelling === m.idMission}
                                            style={{ background: "transparent", border: "1px solid #dc3545", color: "#dc3545",
                                                padding: "6px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                                            {cancelling === m.idMission ? "Annulation…" : "✕ Annuler ma réservation"}
                                        </button>
                                    </>
                                )}
                                {m.statut === "EN_COURS" && (
                                    <p style={{ fontSize: 14, marginBottom: 0 }}>
                                        🚗 <strong>{m.vehiculeImmatriculation || "Véhicule affecté"}</strong>
                                        {m.chauffeurNom && <> · 👤 {m.chauffeurNom}</>}
                                        {m.coutEstimeAI > 0 && <> · 💰 {m.coutEstimeAI.toFixed(2)} TND estimé</>}
                                    </p>
                                )}
                                {m.statut === "TERMINEE" && (
                                    <p style={{ fontSize: 14, marginBottom: 0 }}>
                                        ✅ Effectuée{m.chauffeurNom && <> par {m.chauffeurNom}</>}
                                        {m.coutTotal > 0 && <> · 💰 <strong>{m.coutTotal.toFixed(2)} TND</strong></>}
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </>
    )
}

const card = { background: "var(--pcard)", border: "1px solid var(--pborder)", borderRadius: 14, padding: 20 }

export default function MissionsPage() {
    return (
        <ClientPortalLayout title="🚚 Mes missions">
            <Suspense fallback={<p style={{ padding: 40 }}>Chargement…</p>}>
                <MissionsInner />
            </Suspense>
        </ClientPortalLayout>
    )
}
