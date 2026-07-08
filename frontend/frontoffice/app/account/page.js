"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import authService, { getCurrentUser } from "@/lib/authService"
import missionService from "@/lib/missionService"
import ClientPortalLayout from "@/components/portal/ClientPortalLayout"

/** Dashboard client — stats, actions rapides, prochaine mission, dernières missions. */
export default function AccountPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [mfa, setMfa] = useState(null)
    const [missions, setMissions] = useState([])

    useEffect(() => {
        setUser(getCurrentUser())
        authService.getMfaSettings().then(setMfa).catch(() => {})
        missionService.getMyMissions().then(setMissions).catch(() => {})
    }, [])

    const stats = {
        total: missions.length,
        enAttente: missions.filter(m => m.statut === "EN_ATTENTE").length,
        enCours: missions.filter(m => m.statut === "EN_COURS").length,
        depenses: missions.reduce((s, m) => s + (m.statut === "TERMINEE" ? (m.coutTotal || m.coutEstimeAI || 0) : 0), 0),
    }
    const prochaine = missions
        .filter(m => ["EN_ATTENTE", "EN_COURS"].includes(m.statut) && new Date(m.dateDepart) > new Date())
        .sort((a, b) => new Date(a.dateDepart) - new Date(b.dateDepart))[0]

    return (
        <ClientPortalLayout title={user ? `Bonjour, ${user.prenom} 👋` : "Tableau de bord"}>
            {/* Alerte MFA */}
            {mfa && !mfa.mfaRequired && (
                <Link href="/account/security" style={{ display: "block", background: "#fff3cd", color: "#b45309",
                    padding: "12px 18px", borderRadius: 10, marginBottom: 22, fontWeight: 600, fontSize: 14 }}>
                    🔓 Sécurisez votre compte — activez la vérification en deux étapes (MFA)
                </Link>
            )}

            {/* Stats */}
            <div style={grid4}>
                <StatCard value={stats.total} label="📦 Missions au total" accent="#0d6efd" />
                <StatCard value={stats.enAttente} label="⏳ En attente" accent="#b45309" />
                <StatCard value={stats.enCours} label="🚚 En cours" accent="#084298" />
                <StatCard value={`${stats.depenses.toFixed(0)} TND`} label="💰 Dépenses (terminées)" accent="#146c43" />
            </div>

            {prochaine && (
                <div style={{ ...card, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>📅</span>
                    <div>
                        <div style={{ fontWeight: 700 }}>Prochaine mission</div>
                        <div style={{ color: "var(--pmuted)", fontSize: 14 }}>
                            {prochaine.villeDepart || "—"} → {prochaine.villeArrivee || prochaine.destination}
                            {" "}le {new Date(prochaine.dateDepart).toLocaleString("fr-FR")}
                        </div>
                    </div>
                </div>
            )}

            {/* Actions rapides */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
                <Link href="/account/reserver" className="thm-btn" style={{ padding: "12px 24px" }}>🚗 Réserver un véhicule<span /></Link>
                <Link href="/account/missions" className="thm-btn" style={{ padding: "12px 24px", background: "#084298" }}>📦 Mes missions<span /></Link>
                <Link href="/account/security" className="thm-btn" style={{ padding: "12px 24px", background: "#146c43" }}>🔐 Sécurité<span /></Link>
            </div>

            {/* Dernières missions */}
            {missions.length > 0 && (
                <div style={card}>
                    <h4 style={{ fontSize: 17, marginBottom: 16, fontWeight: 700 }}>🕐 Dernières missions</h4>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid var(--pborder)", textAlign: "left", color: "var(--pmuted)" }}>
                                    <th style={th}>Trajet</th><th style={th}>Départ</th><th style={th}>Statut</th><th style={th}>Coût</th>
                                </tr>
                            </thead>
                            <tbody>
                                {missions.slice(0, 6).map(m => (
                                    <tr key={m.idMission} style={{ borderBottom: "1px solid var(--pborder)" }}>
                                        <td style={td}>{m.villeDepart || "—"} → {m.villeArrivee || m.destination}</td>
                                        <td style={td}>{new Date(m.dateDepart).toLocaleDateString("fr-FR")}</td>
                                        <td style={td}>{m.statut.replace("_", " ")}</td>
                                        <td style={td}>{(m.coutTotal || m.coutEstimeAI) ? `${(m.coutTotal || m.coutEstimeAI).toFixed(2)} TND` : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p style={{ marginTop: 12, marginBottom: 0 }}><Link href="/account/missions" style={{ color: "#0d6efd" }}>Voir toutes mes missions →</Link></p>
                </div>
            )}
        </ClientPortalLayout>
    )
}

function StatCard({ value, label, accent }) {
    return (
        <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: accent }}>{value}</div>
            <div style={{ fontSize: 13, color: "var(--pmuted)", marginTop: 4 }}>{label}</div>
        </div>
    )
}

const card = { background: "var(--pcard)", border: "1px solid var(--pborder)", borderRadius: 14, padding: 22 }
const grid4 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }
const th = { padding: "10px 8px", fontWeight: 600 }
const td = { padding: "12px 8px" }
