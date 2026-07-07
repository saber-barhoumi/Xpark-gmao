"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Layout from "@/components/layout/Layout"
import { isAuthenticated } from "@/lib/authService"
import missionService from "@/lib/missionService"

const STATUS = {
    EN_ATTENTE: { label: "⏳ En attente d'affectation", bg: "#fff3cd", color: "#b45309" },
    EN_COURS:   { label: "🚚 En cours", bg: "#cfe2ff", color: "#084298" },
    TERMINEE:   { label: "✅ Terminée", bg: "#e7f5ec", color: "#146c43" },
    ANNULEE:    { label: "❌ Annulée", bg: "#eee", color: "#6b7280" },
}
const FILTERS = ["TOUTES", "EN_ATTENTE", "EN_COURS", "TERMINEE", "ANNULEE"]

function MissionsInner() {
    const router = useRouter()
    const params = useSearchParams()
    const [missions, setMissions] = useState([])
    const [filter, setFilter] = useState("TOUTES")
    const [loading, setLoading] = useState(true)
    const [info, setInfo] = useState(params.get("created") === "1"
        ? "✅ Réservation créée ! Elle est en attente d'affectation d'un véhicule et d'un chauffeur." : "")
    const [cancelling, setCancelling] = useState(0)

    const load = useCallback(async () => {
        try { setMissions(await missionService.getMyMissions()) }
        catch { /* session expirée gérée par apiFetch */ }
        finally { setLoading(false) }
    }, [])

    const handleCancel = async (id) => {
        if (!window.confirm("Annuler cette réservation ? Cette action est définitive.")) return
        setCancelling(id)
        try {
            await missionService.cancelMyMission(id)
            setInfo("✅ Réservation annulée.")
            await load()
        } catch (err) {
            setInfo("")
            window.alert(err.message || "Annulation impossible (la mission a peut-être déjà été affectée).")
        } finally {
            setCancelling(0)
        }
    }

    useEffect(() => {
        if (!isAuthenticated()) { router.push("/auth/login"); return }
        load()
        const timer = setInterval(load, 20_000)   // suivi quasi temps réel
        return () => clearInterval(timer)
    }, [router, load])

    const filtered = filter === "TOUTES" ? missions : missions.filter(m => m.statut === filter)

    return (
        <section className="contact-two">
            <div className="container">
                <div className="section-title text-center">
                    <div className="section-title__tagline-box">
                        <span className="section-title__tagline">Espace Client XPARK</span>
                    </div>
                    <h2 className="section-title__title">🚚 Mes missions</h2>
                </div>

                {info && <div className="text-center" style={{ padding: 12, marginBottom: 20, background: "#e7f5ec", color: "#146c43", borderRadius: 8 }}>{info}</div>}

                {/* Filtres */}
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 25 }}>
                    {FILTERS.map(f => (
                        <button key={f} type="button" onClick={() => setFilter(f)}
                            style={{
                                padding: "8px 18px", borderRadius: 20, border: "1px solid #dee2e6",
                                background: filter === f ? "#0d6efd" : "#fff",
                                color: filter === f ? "#fff" : "#333", fontSize: 13, cursor: "pointer",
                            }}>
                            {f === "TOUTES" ? "Toutes" : STATUS[f]?.label.replace(/^\S+ /, "")}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="text-center" style={{ padding: 40 }}>Chargement…</p>
                ) : filtered.length === 0 ? (
                    <div className="text-center" style={{ padding: 40 }}>
                        <p style={{ color: "#6b7280", marginBottom: 20 }}>Aucune mission pour l&apos;instant.</p>
                        <Link href="/account/reserver" className="thm-btn">+ Réserver un véhicule<span /></Link>
                    </div>
                ) : (
                    <div className="row">
                        {filtered.map(m => {
                            const st = STATUS[m.statut] ?? STATUS.EN_ATTENTE
                            return (
                                <div className="col-xl-6" key={m.idMission} style={{ marginBottom: 20 }}>
                                    <div style={{ background: "#f8f9fa", borderRadius: 12, padding: 22, height: "100%" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                            <strong style={{ fontSize: 16 }}>
                                                {m.villeDepart || "—"} → {m.villeArrivee || m.destination}
                                            </strong>
                                            <span style={{ background: st.bg, color: st.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                                                {st.label}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
                                            #{m.idMission} · 📅 {new Date(m.dateDepart).toLocaleString("fr-FR")}
                                            {m.distanceKm > 0 && <> · 📏 {m.distanceKm.toFixed(0)} km</>}
                                        </p>

                                        {m.statut === "EN_ATTENTE" && (
                                            <>
                                                <p style={{ fontSize: 13, color: "#b45309", marginBottom: 12 }}>
                                                    🤖 L&apos;OptimisateurFlotteIA choisira le véhicule le plus adapté et un chauffeur disponible.
                                                    {m.coutEstimeAI > 0 && <> Prix estimé : <strong>{m.coutEstimeAI.toFixed(2)} TND</strong></>}
                                                </p>
                                                <button type="button" onClick={() => handleCancel(m.idMission)}
                                                    disabled={cancelling === m.idMission}
                                                    style={{ background: "#fff", border: "1px solid #dc3545", color: "#dc3545",
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
                                </div>
                            )
                        })}
                    </div>
                )}

                <p className="text-center" style={{ marginTop: 20 }}>
                    <Link href="/account">← Retour à mon compte</Link>
                </p>
            </div>
        </section>
    )
}

export default function MissionsPage() {
    return (
        <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="MES MISSIONS">
            <Suspense fallback={<div className="container" style={{ padding: 60 }}>Chargement…</div>}>
                <MissionsInner />
            </Suspense>
        </Layout>
    )
}
