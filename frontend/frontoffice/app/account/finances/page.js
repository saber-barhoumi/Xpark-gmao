"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import missionService from "@/lib/missionService"
import financeService from "@/lib/financeService"
import ClientPortalLayout from "@/components/portal/ClientPortalLayout"
import { card, grid4, th, td, StatCard, Badge, EmptyState, tnd, dateFr } from "@/components/portal/ui"

/**
 * 💰 Finances — vue financière du client :
 *  - totaux (dépensé, engagé, factures impayées / payées)
 *  - factures émises par XPARK (Finance.API /factures/my)
 *  - récapitulatif des coûts par mission (Mission.API /missions/my)
 */

export default function FinancesPage() {
    const [missions, setMissions] = useState([])
    const [factures, setFactures] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.allSettled([
            missionService.getMyMissions().then(setMissions),
            financeService.getMyInvoices().then((data) => setFactures(Array.isArray(data) ? data : data?.items || [])),
        ]).finally(() => setLoading(false))
    }, [])

    // Totaux missions
    const depense = missions.filter(m => m.statut === "TERMINEE")
        .reduce((s, m) => s + (m.coutTotal || m.coutEstimeAI || 0), 0)
    const engage = missions.filter(m => ["EN_ATTENTE", "EN_COURS"].includes(m.statut))
        .reduce((s, m) => s + (m.coutEstimeAI || 0), 0)

    // Totaux factures
    const impayees = factures.filter(f => f.statut === "EN_ATTENTE")
    const payees = factures.filter(f => f.statut === "PAYEE")
    const montantImpaye = impayees.reduce((s, f) => s + (f.montantTTC || f.montant || 0), 0)

    const missionsAvecCout = missions
        .filter(m => (m.coutTotal || m.coutEstimeAI || 0) > 0 && m.statut !== "ANNULEE")
        .sort((a, b) => new Date(b.dateDepart) - new Date(a.dateDepart))

    return (
        <ClientPortalLayout title="💰 Finances">
            {/* Totaux */}
            <div style={grid4}>
                <StatCard value={tnd(depense)} label="✅ Dépenses (missions terminées)" accent="#146c43" />
                <StatCard value={tnd(engage)} label="⏳ Engagements en cours (estimés)" accent="#b45309" />
                <StatCard value={impayees.length ? tnd(montantImpaye) : "0"} label={`🧾 Factures à payer (${impayees.length})`} accent="#b02a37" />
                <StatCard value={payees.length} label="💳 Factures payées" accent="#084298" />
            </div>

            {/* Factures */}
            <div style={{ ...card, marginBottom: 24 }}>
                <h4 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>🧾 Mes factures</h4>
                {loading ? (
                    <div style={{ color: "var(--pmuted)" }}>Chargement…</div>
                ) : factures.length === 0 ? (
                    <div style={{ color: "var(--pmuted)", fontSize: 14, padding: "18px 0" }}>
                        Aucune facture émise pour le moment. Vos factures apparaîtront ici dès leur émission
                        par notre service facturation.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid var(--pborder)", textAlign: "left", color: "var(--pmuted)" }}>
                                    <th style={th}>N° facture</th><th style={th}>Date</th><th style={th}>Échéance</th>
                                    <th style={th}>Montant TTC</th><th style={th}>Statut</th><th style={th}>Paiement</th>
                                </tr>
                            </thead>
                            <tbody>
                                {factures.map(f => (
                                    <tr key={f.idFacture} style={{ borderBottom: "1px solid var(--pborder)" }}>
                                        <td style={{ ...td, fontWeight: 600 }}>{f.numeroFacture || `#${f.idFacture}`}</td>
                                        <td style={td}>{dateFr(f.dateFacture || f.dateEmission)}</td>
                                        <td style={td}>{dateFr(f.dateEcheance)}</td>
                                        <td style={{ ...td, fontWeight: 700 }}>{tnd(f.montantTTC || f.montant)}</td>
                                        <td style={td}><Badge statut={f.statut} /></td>
                                        <td style={td}>{f.datePaiement ? dateFr(f.datePaiement) : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Coûts par mission */}
            {missionsAvecCout.length === 0 && !loading ? (
                <EmptyState icon="💰" title="Aucune dépense enregistrée"
                    text="Réservez votre premier transport pour voir apparaître vos coûts ici."
                    action={<Link href="/account/reserver" className="thm-btn" style={{ padding: "11px 22px" }}>➕ Réserver un transport<span /></Link>} />
            ) : missionsAvecCout.length > 0 && (
                <div style={card}>
                    <h4 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>📦 Coûts par mission</h4>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid var(--pborder)", textAlign: "left", color: "var(--pmuted)" }}>
                                    <th style={th}>Mission</th><th style={th}>Trajet</th><th style={th}>Date</th>
                                    <th style={th}>Distance</th><th style={th}>Statut</th><th style={th}>Coût</th>
                                </tr>
                            </thead>
                            <tbody>
                                {missionsAvecCout.map(m => {
                                    const final = m.statut === "TERMINEE" && m.coutTotal > 0
                                    return (
                                        <tr key={m.idMission} style={{ borderBottom: "1px solid var(--pborder)" }}>
                                            <td style={td}>#{m.idMission}</td>
                                            <td style={{ ...td, fontWeight: 600 }}>{m.villeDepart || "—"} → {m.villeArrivee || m.destination}</td>
                                            <td style={td}>{dateFr(m.dateDepart)}</td>
                                            <td style={td}>{m.distanceKm ? `${m.distanceKm.toFixed(0)} km` : "—"}</td>
                                            <td style={td}><Badge statut={m.statut} /></td>
                                            <td style={{ ...td, fontWeight: 700 }}>
                                                {tnd(final ? m.coutTotal : m.coutEstimeAI)}
                                                <span style={{ fontSize: 11, color: "var(--pmuted)", fontWeight: 400 }}>
                                                    {" "}{final ? "(final)" : "(estimé)"}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p style={{ margin: "14px 0 0", fontSize: 12.5, color: "var(--pmuted)" }}>
                        💡 Les coûts estimés sont calculés par notre IA de tarification ; le coût final est
                        confirmé à la clôture de la mission.
                    </p>
                </div>
            )}
        </ClientPortalLayout>
    )
}
