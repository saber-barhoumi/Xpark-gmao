"use client"

import { useEffect, useState } from "react"
import missionService from "@/lib/missionService"
import supportService from "@/lib/supportService"
import ClientPortalLayout from "@/components/portal/ClientPortalLayout"
import { card, Badge, EmptyState, dateTimeFr } from "@/components/portal/ui"

/**
 * 🎫 Support — tickets du client (Mission.API /api/support).
 * Le client ouvre un ticket (catégorie + mission liée optionnelle), suit son
 * statut (OUVERT → EN_COURS → RESOLU) et voit la réponse du support.
 */

const CATEGORIES = [
    { value: "MISSION", label: "🚚 Mission / livraison" },
    { value: "FACTURATION", label: "🧾 Facturation" },
    { value: "TECHNIQUE", label: "⚙️ Problème technique" },
    { value: "AUTRE", label: "💬 Autre demande" },
]

const FORM_INITIAL = { sujet: "", categorie: "MISSION", missionId: "", message: "" }

export default function SupportPage() {
    const [tickets, setTickets] = useState([])
    const [missions, setMissions] = useState([])
    const [form, setForm] = useState(FORM_INITIAL)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [notice, setNotice] = useState(null)   // { type: "ok"|"err", text }

    const load = () => supportService.getMyTickets().then(setTickets).catch(() => {})

    useEffect(() => {
        Promise.allSettled([load(), missionService.getMyMissions().then(setMissions)])
            .finally(() => setLoading(false))
    }, [])

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

    const submit = async (e) => {
        e.preventDefault()
        setSending(true); setNotice(null)
        try {
            await supportService.createTicket({
                sujet: form.sujet,
                categorie: form.categorie,
                message: form.message,
                missionId: form.missionId ? Number(form.missionId) : null,
            })
            setForm(FORM_INITIAL)
            setNotice({ type: "ok", text: "✅ Ticket envoyé ! Notre équipe vous répond au plus vite." })
            await load()
        } catch (err) {
            setNotice({ type: "err", text: err.message || "Impossible d'envoyer le ticket. Réessayez." })
        } finally { setSending(false) }
    }

    const close = async (id) => {
        try { await supportService.closeTicket(id); await load() } catch {}
    }

    const ouverts = tickets.filter(t => t.statut !== "FERME")
    const fermes = tickets.filter(t => t.statut === "FERME")

    return (
        <ClientPortalLayout title="🎫 Support">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18 }}>

                {/* ── Nouveau ticket ── */}
                <div style={card}>
                    <h4 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>📝 Ouvrir un ticket</h4>
                    <p style={{ color: "var(--pmuted)", fontSize: 13.5, marginBottom: 18 }}>
                        Décrivez votre demande : notre équipe vous répond directement ici.
                    </p>

                    {notice && (
                        <div style={{ background: notice.type === "ok" ? "#d1e7dd" : "#f8d7da",
                            color: notice.type === "ok" ? "#146c43" : "#b02a37",
                            padding: "11px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13.5, fontWeight: 600 }}>
                            {notice.text}
                        </div>
                    )}

                    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <input value={form.sujet} onChange={set("sujet")} required maxLength={200}
                            placeholder="Sujet (ex : retard de livraison mission #12)" style={input} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <select value={form.categorie} onChange={set("categorie")} style={input}>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                            <select value={form.missionId} onChange={set("missionId")} style={input}>
                                <option value="">Mission liée (optionnel)</option>
                                {missions.map(m => (
                                    <option key={m.idMission} value={m.idMission}>
                                        #{m.idMission} — {m.villeDepart || "?"} → {m.villeArrivee || m.destination}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <textarea value={form.message} onChange={set("message")} required rows={5}
                            placeholder="Décrivez votre demande en détail…" style={{ ...input, resize: "vertical" }} />
                        <button type="submit" disabled={sending} className="thm-btn"
                            style={{ padding: "12px 24px", opacity: sending ? 0.6 : 1 }}>
                            {sending ? "Envoi…" : "📨 Envoyer le ticket"}<span />
                        </button>
                    </form>

                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--pborder)",
                        fontSize: 13, color: "var(--pmuted)" }}>
                        📞 Urgence ? Appelez-nous au <strong style={{ color: "var(--ptext)" }}>+216 70 000 000</strong>
                        {" "}· ✉️ contact@xpark.tn
                    </div>
                </div>

                {/* ── Mes tickets ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {loading ? (
                        <div style={{ ...card, textAlign: "center", color: "var(--pmuted)" }}>Chargement…</div>
                    ) : tickets.length === 0 ? (
                        <EmptyState icon="🎫" title="Aucun ticket"
                            text="Vos demandes de support et les réponses de notre équipe s'afficheront ici." />
                    ) : (
                        <>
                            {ouverts.map(t => <Ticket key={t.idTicket} t={t} onClose={close} />)}
                            {fermes.length > 0 && (
                                <details>
                                    <summary style={{ cursor: "pointer", color: "var(--pmuted)", fontSize: 13.5,
                                        padding: "6px 2px" }}>
                                        Tickets fermés ({fermes.length})
                                    </summary>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                                        {fermes.map(t => <Ticket key={t.idTicket} t={t} />)}
                                    </div>
                                </details>
                            )}
                        </>
                    )}
                </div>
            </div>
        </ClientPortalLayout>
    )
}

/** Carte ticket : sujet, statut, message, réponse du support, fermeture */
function Ticket({ t, onClose }) {
    const cat = CATEGORIES.find(c => c.value === t.categorie)
    return (
        <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>#{t.idTicket} · {t.sujet}</span>
                <div style={{ flex: 1 }} />
                <Badge statut={t.statut} />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--pmuted)", marginBottom: 10 }}>
                {cat?.label || t.categorie}
                {t.missionId ? ` · Mission #${t.missionId}` : ""} · ouvert le {dateTimeFr(t.dateCreation)}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-line" }}>{t.message}</div>

            {t.reponse && (
                <div style={{ marginTop: 12, background: "var(--pbg)", border: "1px solid var(--pborder)",
                    borderLeft: "4px solid #C11425", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#C11425", marginBottom: 5 }}>
                        💬 Réponse du support XPARK
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-line" }}>{t.reponse}</div>
                </div>
            )}

            {onClose && t.statut !== "FERME" && (
                <div style={{ marginTop: 14 }}>
                    <button type="button" onClick={() => onClose(t.idTicket)}
                        style={{ border: "1px solid var(--pborder)", background: "var(--pbg)", color: "var(--pmuted)",
                            borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
                        ✓ Marquer comme résolu / fermer
                    </button>
                </div>
            )}
        </div>
    )
}

const input = {
    border: "1px solid var(--pborder)", background: "var(--pbg)", color: "var(--ptext)",
    borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", width: "100%",
}
