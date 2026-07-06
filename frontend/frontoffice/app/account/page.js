"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Layout from "@/components/layout/Layout"
import authService, { getCurrentUser, isAuthenticated } from "@/lib/authService"
import missionService from "@/lib/missionService"

const statCard = (bg) => ({
    background: bg, borderRadius: 12, padding: "22px 18px", textAlign: "center", height: "100%",
})

/**
 * Dashboard client (fiche FRONTOFFICE §4.3) : stats, actions rapides,
 * dernières missions, état sécurité MFA.
 */
export default function AccountPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [mfa, setMfa] = useState(null)
    const [missions, setMissions] = useState([])

    useEffect(() => {
        if (!isAuthenticated()) { router.push("/auth/login"); return }
        setUser(getCurrentUser())
        authService.getMfaSettings().then(setMfa).catch(() => {})
        missionService.getMyMissions().then(setMissions).catch(() => {})
    }, [router])

    if (!user) return null

    const stats = {
        total: missions.length,
        enAttente: missions.filter(m => m.statut === "EN_ATTENTE").length,
        enCours: missions.filter(m => m.statut === "EN_COURS").length,
        depenses: missions.reduce((sum, m) =>
            sum + (m.statut === "TERMINEE" ? (m.coutTotal || m.coutEstimeAI || 0) : 0), 0),
    }
    const prochaine = missions
        .filter(m => ["EN_ATTENTE", "EN_COURS"].includes(m.statut) && new Date(m.dateDepart) > new Date())
        .sort((a, b) => new Date(a.dateDepart) - new Date(b.dateDepart))[0]

    return (
        <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="MON COMPTE">
            <section className="contact-two">
                <div className="container">
                    <div className="section-title text-center">
                        <div className="section-title__tagline-box">
                            <span className="section-title__tagline">Espace Client XPARK</span>
                        </div>
                        <h2 className="section-title__title">Bonjour, {user.prenom} {user.nom} 👋</h2>
                        {mfa && !mfa.mfaRequired && (
                            <p style={{ marginTop: 10 }}>
                                <Link href="/account/security" style={{ background: "#fff3cd", color: "#b45309", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                                    🔓 Sécurisez votre compte — activez la vérification en deux étapes
                                </Link>
                            </p>
                        )}
                    </div>

                    {/* ── Quick stats ─────────────────────────────── */}
                    <div className="row" style={{ marginBottom: 30 }}>
                        <div className="col-xl-3 col-6" style={{ marginBottom: 15 }}>
                            <div style={statCard("#e7f1ff")}>
                                <div style={{ fontSize: 34, fontWeight: 800, color: "#0d6efd" }}>{stats.total}</div>
                                <div style={{ fontSize: 13, color: "#6b7280" }}>📦 Missions au total</div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-6" style={{ marginBottom: 15 }}>
                            <div style={statCard("#fff3cd")}>
                                <div style={{ fontSize: 34, fontWeight: 800, color: "#b45309" }}>{stats.enAttente}</div>
                                <div style={{ fontSize: 13, color: "#6b7280" }}>⏳ En attente</div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-6" style={{ marginBottom: 15 }}>
                            <div style={statCard("#cfe2ff")}>
                                <div style={{ fontSize: 34, fontWeight: 800, color: "#084298" }}>{stats.enCours}</div>
                                <div style={{ fontSize: 13, color: "#6b7280" }}>🚚 En cours</div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-6" style={{ marginBottom: 15 }}>
                            <div style={statCard("#e7f5ec")}>
                                <div style={{ fontSize: 30, fontWeight: 800, color: "#146c43" }}>{stats.depenses.toFixed(0)} <span style={{ fontSize: 15 }}>TND</span></div>
                                <div style={{ fontSize: 13, color: "#6b7280" }}>💰 Dépenses (terminées)</div>
                            </div>
                        </div>
                    </div>

                    {prochaine && (
                        <div style={{ background: "#f8f9fa", borderRadius: 12, padding: 18, marginBottom: 30, textAlign: "center" }}>
                            📅 <strong>Prochaine mission :</strong> {prochaine.villeDepart || "—"} → {prochaine.villeArrivee || prochaine.destination}
                            {" "}le {new Date(prochaine.dateDepart).toLocaleString("fr-FR")}
                        </div>
                    )}

                    {/* ── Quick actions ───────────────────────────── */}
                    <div style={{ display: "flex", gap: 15, justifyContent: "center", flexWrap: "wrap", marginBottom: 35 }}>
                        <Link href="/account/reserver" className="thm-btn">🚗 Réserver un véhicule<span /></Link>
                        <Link href="/account/missions" className="thm-btn" style={{ background: "#084298" }}>📦 Mes missions<span /></Link>
                        <Link href="/account/security" className="thm-btn" style={{ background: "#146c43" }}>🔐 Sécurité (MFA)<span /></Link>
                        <button type="button" className="thm-btn" onClick={() => router.push("/auth/logout")}
                            style={{ background: "#6b7280" }}>Se déconnecter<span /></button>
                    </div>

                    {/* ── Dernières missions ──────────────────────── */}
                    {missions.length > 0 && (
                        <div>
                            <h4 style={{ fontSize: 18, marginBottom: 15 }}>🕐 Dernières missions</h4>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ background: "#f1f3f5", textAlign: "left" }}>
                                            <th style={{ padding: 10 }}>Trajet</th>
                                            <th style={{ padding: 10 }}>Départ</th>
                                            <th style={{ padding: 10 }}>Statut</th>
                                            <th style={{ padding: 10 }}>Coût</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {missions.slice(0, 5).map(m => (
                                            <tr key={m.idMission} style={{ borderBottom: "1px solid #eee" }}>
                                                <td style={{ padding: 10 }}>{m.villeDepart || "—"} → {m.villeArrivee || m.destination}</td>
                                                <td style={{ padding: 10 }}>{new Date(m.dateDepart).toLocaleDateString("fr-FR")}</td>
                                                <td style={{ padding: 10 }}>{m.statut.replace("_", " ")}</td>
                                                <td style={{ padding: 10 }}>
                                                    {(m.coutTotal || m.coutEstimeAI) ? `${(m.coutTotal || m.coutEstimeAI).toFixed(2)} TND` : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p style={{ marginTop: 10 }}><Link href="/account/missions">Voir toutes mes missions →</Link></p>
                        </div>
                    )}
                </div>
            </section>
        </Layout>
    )
}
