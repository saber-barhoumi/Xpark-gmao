"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/authService"
import missionService from "@/lib/missionService"
import financeService from "@/lib/financeService"
import { ordreMissionHtml, attestationHtml, factureHtml, openDocument } from "@/lib/documentTemplates"
import ClientPortalLayout from "@/components/portal/ClientPortalLayout"
import { card, EmptyState, dateFr } from "@/components/portal/ui"

/**
 * 📄 Documents — tous les documents du client, générés depuis ses données :
 *  - Ordre de mission (missions validées)
 *  - Attestation de transport (missions terminées)
 *  - Factures (Finance.API)
 * Chaque document s'ouvre en vue imprimable → impression ou enregistrement PDF.
 */

const FILTRES = [
    { key: "TOUS", label: "Tous" },
    { key: "ORDRE", label: "📋 Ordres de mission" },
    { key: "ATTESTATION", label: "✅ Attestations" },
    { key: "FACTURE", label: "🧾 Factures" },
]

export default function DocumentsPage() {
    const [user, setUser] = useState(null)
    const [missions, setMissions] = useState([])
    const [factures, setFactures] = useState([])
    const [filtre, setFiltre] = useState("TOUS")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setUser(getCurrentUser())
        Promise.allSettled([
            missionService.getMyMissions().then(setMissions),
            financeService.getMyInvoices().then((d) => setFactures(Array.isArray(d) ? d : d?.items || [])),
        ]).finally(() => setLoading(false))
    }, [])

    /** Catalogue des documents disponibles, construit depuis les données réelles */
    const documents = useMemo(() => {
        const docs = []
        for (const m of missions) {
            if (m.statut === "ANNULEE") continue
            docs.push({
                type: "ORDRE", icon: "📋", ref: `OM-${String(m.idMission).padStart(5, "0")}`,
                titre: `Ordre de mission n°${m.idMission}`,
                detail: `${m.villeDepart || "—"} → ${m.villeArrivee || m.destination}`,
                date: m.dateDepart,
                open: () => openDocument(ordreMissionHtml(m, user)),
            })
            if (m.statut === "TERMINEE") {
                docs.push({
                    type: "ATTESTATION", icon: "✅", ref: `AT-${String(m.idMission).padStart(5, "0")}`,
                    titre: `Attestation de transport n°${m.idMission}`,
                    detail: `${m.villeDepart || "—"} → ${m.villeArrivee || m.destination}`,
                    date: m.dateRetour || m.dateDepart,
                    open: () => openDocument(attestationHtml(m, user)),
                })
            }
        }
        for (const f of factures) {
            docs.push({
                type: "FACTURE", icon: "🧾", ref: f.numeroFacture || `FA-${String(f.idFacture).padStart(5, "0")}`,
                titre: f.numeroFacture ? `Facture ${f.numeroFacture}` : `Facture n°${f.idFacture}`,
                detail: f.description || "Prestation de transport",
                date: f.dateFacture || f.dateEmission,
                open: () => openDocument(factureHtml(f, user)),
            })
        }
        return docs.sort((a, b) => new Date(b.date) - new Date(a.date))
    }, [missions, factures, user])

    const visibles = filtre === "TOUS" ? documents : documents.filter(d => d.type === filtre)
    const compteur = (k) => (k === "TOUS" ? documents.length : documents.filter(d => d.type === k).length)

    return (
        <ClientPortalLayout title="📄 Documents">
            {/* Filtres */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
                {FILTRES.map(f => (
                    <button key={f.key} type="button" onClick={() => setFiltre(f.key)}
                        style={{ border: "1px solid var(--pborder)", borderRadius: 20, padding: "8px 16px",
                            fontSize: 13.5, cursor: "pointer", fontWeight: filtre === f.key ? 700 : 400,
                            background: filtre === f.key ? "#C11425" : "var(--pcard)",
                            color: filtre === f.key ? "#fff" : "var(--ptext)" }}>
                        {f.label} ({compteur(f.key)})
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ ...card, textAlign: "center", color: "var(--pmuted)" }}>Chargement des documents…</div>
            ) : visibles.length === 0 ? (
                <EmptyState icon="📄" title="Aucun document disponible"
                    text="Vos ordres de mission, attestations de transport et factures apparaîtront ici automatiquement."
                    action={<Link href="/account/reserver" className="thm-btn" style={{ padding: "11px 22px" }}>➕ Réserver un transport<span /></Link>} />
            ) : (
                <div style={card}>
                    {visibles.map((d) => (
                        <div key={d.ref + d.type} style={{ display: "flex", alignItems: "center", gap: 14,
                            padding: "14px 4px", borderBottom: "1px solid var(--pborder)", flexWrap: "wrap" }}>
                            <span style={{ fontSize: 26 }}>{d.icon}</span>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{d.titre}</div>
                                <div style={{ color: "var(--pmuted)", fontSize: 13 }}>
                                    {d.ref} · {d.detail} · {dateFr(d.date)}
                                </div>
                            </div>
                            <button type="button" onClick={d.open}
                                style={{ border: "1px solid var(--pborder)", background: "var(--pbg)", color: "var(--ptext)",
                                    borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                                ⬇️ Ouvrir / PDF
                            </button>
                        </div>
                    ))}
                    <p style={{ margin: "14px 0 0", fontSize: 12.5, color: "var(--pmuted)" }}>
                        💡 Chaque document s'ouvre dans une fenêtre d'impression : choisissez
                        « Enregistrer au format PDF » pour le télécharger.
                    </p>
                </div>
            )}
        </ClientPortalLayout>
    )
}
