"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { aiService } from "@/lib/missionService"
import transportRequestService from "@/lib/transportRequestService"
import ClientPortalLayout from "@/components/portal/ClientPortalLayout"
import { useConfirm, useToast } from "@/components/portal/Feedback"

/**
 * Mes Demandes — devis de transport (fiche redesign workflow devis) :
 * PENDING_QUOTATION (éditable/annulable) → QUOTATION_SENT (accepter/refuser)
 * → ACCEPTED (une Mission a été créée, visible sur « Mes missions ») ou
 * REJECTED / CANCELLED. Aucune Mission n'existe avant l'acceptation du devis.
 */

const STATUS = {
    PENDING_QUOTATION: { label: "📝 En attente de devis", bg: "#fff3cd", color: "#b45309" },
    QUOTATION_SENT:     { label: "📨 Devis reçu",          bg: "#cfe2ff", color: "#084298" },
    ACCEPTED:           { label: "✅ Accepté",             bg: "#e7f5ec", color: "#146c43" },
    REJECTED:           { label: "❌ Refusé",              bg: "#f1f1f1", color: "#6b7280" },
    CANCELLED:          { label: "🗑️ Annulée",            bg: "#f1f1f1", color: "#6b7280" },
}
const PRICING_LABEL = { AI_PRICE: "Prix IA", MODIFIED: "Prix IA ajusté", MANUAL: "Prix manuel" }
const FILTERS = ["TOUTES", "PENDING_QUOTATION", "QUOTATION_SENT", "ACCEPTED", "REJECTED", "CANCELLED"]

function EditForm({ req, onCancel, onSaved }) {
    const [cities, setCities] = useState([])
    const [form, setForm] = useState({
        villeDepart: req.villeDepart, villeArrivee: req.villeArrivee,
        dateSouhaitee: req.dateSouhaitee?.slice(0, 16) || "",
        cargoDescription: req.cargoDescription, cargoWeightKg: req.cargoWeightKg,
        passengerCount: req.passengerCount, vehicleTypeRequested: req.vehicleTypeRequested || "BERLINE",
    })
    const [saving, setSaving] = useState(false)
    const [err, setErr] = useState("")

    useEffect(() => { aiService.getCities().then(setCities).catch(() => {}) }, [])

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

    const save = async () => {
        setSaving(true); setErr("")
        try {
            // Réutilise le même service IA (villes → distance → prix) que la demande initiale,
            // pour que l'estimation reste cohérente après modification du trajet/fret.
            const dist = await aiService.getDistance(form.villeDepart, form.villeArrivee)
            const pred = await aiService.predictPrice({
                departure: form.villeDepart, arrival: form.villeArrivee, date_depart: form.dateSouhaitee,
                vehicle_type_gmao: form.vehicleTypeRequested,
                cargo_weight: Number(form.cargoWeightKg) || 0, passenger_count: Number(form.passengerCount) || 1,
            })
            await transportRequestService.edit(req.idTransportRequest, {
                dateSouhaitee: form.dateSouhaitee, villeDepart: form.villeDepart, villeArrivee: form.villeArrivee,
                cargoDescription: form.cargoDescription, cargoWeightKg: Number(form.cargoWeightKg) || 0,
                passengerCount: Number(form.passengerCount) || 1, vehicleTypeRequested: form.vehicleTypeRequested,
                distanceKm: dist.distance_km, aiEstimatedPrice: pred.predicted_cost_tnd,
                aiVehicleTypeRecommended: pred.vehicle_type_used,
            })
            onSaved()
        } catch (e) {
            setErr(e.message || "Modification impossible.")
        } finally { setSaving(false) }
    }

    return (
        <div style={{ marginTop: 12, padding: 14, background: "var(--pbg)", borderRadius: 10, border: "1px solid var(--pborder)" }}>
            {err && <p style={{ color: "#b02a37", fontSize: 13, marginBottom: 8 }}>{err}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                    <label style={lbl}>Départ</label>
                    <input list="edit-cities" value={form.villeDepart} onChange={set("villeDepart")} style={inp} />
                </div>
                <div>
                    <label style={lbl}>Arrivée</label>
                    <input list="edit-cities" value={form.villeArrivee} onChange={set("villeArrivee")} style={inp} />
                </div>
                <datalist id="edit-cities">{cities.map(c => <option key={c} value={c} />)}</datalist>
                <div>
                    <label style={lbl}>Date souhaitée</label>
                    <input type="datetime-local" value={form.dateSouhaitee} onChange={set("dateSouhaitee")} style={inp} />
                </div>
                <div>
                    <label style={lbl}>Type de véhicule</label>
                    <select value={form.vehicleTypeRequested} onChange={set("vehicleTypeRequested")} style={inp}>
                        <option value="BERLINE">Berline</option>
                        <option value="UTILITAIRE">Utilitaire</option>
                        <option value="VAN">Van / Minibus</option>
                        <option value="CAMION">Camion</option>
                    </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                    <label style={lbl}>Description du fret</label>
                    <input value={form.cargoDescription} onChange={set("cargoDescription")} style={inp} />
                </div>
                <div>
                    <label style={lbl}>Poids (kg)</label>
                    <input type="number" min={0} value={form.cargoWeightKg} onChange={set("cargoWeightKg")} style={inp} />
                </div>
                <div>
                    <label style={lbl}>Passagers</label>
                    <input type="number" min={1} value={form.passengerCount} onChange={set("passengerCount")} style={inp} />
                </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={save} disabled={saving} className="thm-btn" style={{ padding: "6px 16px", fontSize: 13 }}>
                    {saving ? "Enregistrement…" : "💾 Enregistrer"}<span />
                </button>
                <button type="button" onClick={onCancel} disabled={saving}
                    style={{ background: "transparent", border: "1px solid var(--pborder)", borderRadius: 8, padding: "6px 16px", fontSize: 13, cursor: "pointer", color: "var(--ptext)" }}>
                    Annuler
                </button>
            </div>
        </div>
    )
}

function DemandesInner() {
    const params = useSearchParams()
    const [confirm, confirmDialog] = useConfirm()
    const [toast, toastNode] = useToast()
    const [requests, setRequests] = useState([])
    const [filter, setFilter] = useState("TOUTES")
    const [loading, setLoading] = useState(true)
    const [info, setInfo] = useState(params.get("created") === "1"
        ? "✅ Demande envoyée ! Notre équipe va vous préparer un devis." : "")
    const [busyId, setBusyId] = useState(0)
    const [editingId, setEditingId] = useState(0)

    const load = useCallback(async () => {
        try { setRequests(await transportRequestService.getMyRequests()) }
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
            title: "Retirer cette demande ?", message: "Cette action est définitive.",
            confirmLabel: "Oui, retirer", cancelLabel: "Non, garder", danger: true, icon: "🗑️",
        })
        if (!ok) return
        setBusyId(id)
        try { await transportRequestService.cancel(id); setInfo("✅ Demande retirée."); await load() }
        catch (err) { setInfo(""); toast(err.message || "Retrait impossible.", "error") }
        finally { setBusyId(0) }
    }

    const handleAccept = async (id) => {
        const ok = await confirm({
            title: "Accepter ce devis ?", message: "Une mission sera créée et affectée à un véhicule et un chauffeur.",
            confirmLabel: "Oui, accepter", cancelLabel: "Annuler", icon: "✅",
        })
        if (!ok) return
        setBusyId(id)
        try { await transportRequestService.accept(id); toast("Devis accepté — votre mission a été créée !", "success"); await load() }
        catch (err) { toast(err.message || "Acceptation impossible.", "error") }
        finally { setBusyId(0) }
    }

    const handleReject = async (id) => {
        const ok = await confirm({
            title: "Refuser ce devis ?", message: "Cette action est définitive.",
            confirmLabel: "Oui, refuser", cancelLabel: "Non, garder", danger: true, icon: "❌",
        })
        if (!ok) return
        setBusyId(id)
        try { await transportRequestService.reject(id); setInfo("Devis refusé."); await load() }
        catch (err) { setInfo(""); toast(err.message || "Refus impossible.", "error") }
        finally { setBusyId(0) }
    }

    const filtered = filter === "TOUTES" ? requests : requests.filter(r => r.statut === filter)

    return (
        <>
            {confirmDialog}
            {toastNode}
            {info && <div style={{ padding: 12, marginBottom: 20, background: "#e7f5ec", color: "#146c43", borderRadius: 10 }}>{info}</div>}

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
                <Link href="/account/reserver" className="thm-btn" style={{ padding: "10px 20px" }}>+ Nouvelle demande<span /></Link>
            </div>

            {loading ? (
                <p style={{ padding: 40, textAlign: "center", color: "var(--pmuted)" }}>Chargement…</p>
            ) : filtered.length === 0 ? (
                <div style={{ ...card, textAlign: "center", padding: 40 }}>
                    <p style={{ color: "var(--pmuted)", marginBottom: 18 }}>Aucune demande pour l&apos;instant.</p>
                    <Link href="/account/reserver" className="thm-btn">+ Faire une demande<span /></Link>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 18 }}>
                    {filtered.map(r => {
                        const st = STATUS[r.statut] ?? STATUS.PENDING_QUOTATION
                        const isEditing = editingId === r.idTransportRequest
                        return (
                            <div key={r.idTransportRequest} style={card}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                                    <strong style={{ fontSize: 16 }}>{r.villeDepart} → {r.villeArrivee}</strong>
                                    <span style={{ background: st.bg, color: st.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{st.label}</span>
                                </div>
                                <p style={{ fontSize: 13, color: "var(--pmuted)", marginBottom: 10 }}>
                                    #{r.idTransportRequest} · 📅 {new Date(r.dateSouhaitee).toLocaleString("fr-FR")}
                                    {r.distanceKm > 0 && <> · 📏 {r.distanceKm.toFixed(0)} km</>}
                                </p>

                                {r.statut === "PENDING_QUOTATION" && !isEditing && (
                                    <>
                                        <p style={{ fontSize: 13, color: "#b45309", marginBottom: 12 }}>
                                            💡 Estimation indicative : <strong>{r.aiPriceRangeMin.toFixed(0)}–{r.aiPriceRangeMax.toFixed(0)} TND</strong>
                                            <br />En attente du devis de notre équipe.
                                        </p>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button type="button" onClick={() => setEditingId(r.idTransportRequest)}
                                                style={{ background: "transparent", border: "1px solid var(--pborder)", color: "var(--ptext)",
                                                    padding: "6px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                                                ✏️ Modifier
                                            </button>
                                            <button type="button" onClick={() => handleCancel(r.idTransportRequest)} disabled={busyId === r.idTransportRequest}
                                                style={{ background: "transparent", border: "1px solid #dc3545", color: "#dc3545",
                                                    padding: "6px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                                                {busyId === r.idTransportRequest ? "…" : "✕ Retirer"}
                                            </button>
                                        </div>
                                    </>
                                )}
                                {isEditing && (
                                    <EditForm req={r} onCancel={() => setEditingId(0)}
                                        onSaved={() => { setEditingId(0); setInfo("✅ Demande modifiée."); load() }} />
                                )}

                                {r.statut === "QUOTATION_SENT" && (
                                    <>
                                        <div style={{ background: "var(--pbg)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                                            <p style={{ fontSize: 13, color: "var(--pmuted)", marginBottom: 4 }}>Devis proposé</p>
                                            <p style={{ fontSize: 26, fontWeight: 800, color: "#0d6efd", marginBottom: 4 }}>{r.finalPrice?.toFixed(2)} TND</p>
                                            <p style={{ fontSize: 12, color: "var(--pmuted)" }}>{PRICING_LABEL[r.pricingMethod] || r.pricingMethod}</p>
                                            {r.adminNote && <p style={{ fontSize: 13, marginTop: 6, fontStyle: "italic" }}>« {r.adminNote} »</p>}
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button type="button" onClick={() => handleAccept(r.idTransportRequest)} disabled={busyId === r.idTransportRequest}
                                                className="thm-btn" style={{ padding: "6px 18px", fontSize: 13 }}>
                                                {busyId === r.idTransportRequest ? "…" : "✅ Accepter"}<span />
                                            </button>
                                            <button type="button" onClick={() => handleReject(r.idTransportRequest)} disabled={busyId === r.idTransportRequest}
                                                style={{ background: "transparent", border: "1px solid #dc3545", color: "#dc3545",
                                                    padding: "6px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                                                ❌ Refuser
                                            </button>
                                        </div>
                                    </>
                                )}

                                {r.statut === "ACCEPTED" && (
                                    <p style={{ fontSize: 14, marginBottom: 0 }}>
                                        ✅ Mission créée · 💰 {r.finalPrice?.toFixed(2)} TND ·{" "}
                                        <Link href="/account/missions" style={{ color: "#0d6efd" }}>Voir sur Mes missions →</Link>
                                    </p>
                                )}
                                {r.statut === "REJECTED" && (
                                    <p style={{ fontSize: 14, marginBottom: 0, color: "var(--pmuted)" }}>Devis refusé.</p>
                                )}
                                {r.statut === "CANCELLED" && (
                                    <p style={{ fontSize: 14, marginBottom: 0, color: "var(--pmuted)" }}>Demande retirée.</p>
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
const lbl  = { display: "block", fontSize: 11, fontWeight: 600, color: "var(--pmuted)", marginBottom: 3 }
const inp  = { width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--pborder)", background: "var(--pcard)", color: "var(--ptext)", fontSize: 13 }

export default function DemandesPage() {
    return (
        <ClientPortalLayout title="📋 Mes demandes">
            <Suspense fallback={<p style={{ padding: 40 }}>Chargement…</p>}>
                <DemandesInner />
            </Suspense>
        </ClientPortalLayout>
    )
}
