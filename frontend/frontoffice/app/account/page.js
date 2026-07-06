"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Layout from "@/components/layout/Layout"
import authService, { getCurrentUser, isAuthenticated } from "@/lib/authService"

/** Espace client — profil + accès aux paramètres de sécurité. */
export default function AccountPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [mfa, setMfa] = useState(null)

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/auth/login")
            return
        }
        setUser(getCurrentUser())
        authService.getMfaSettings().then(setMfa).catch(() => {})
    }, [router])

    const handleLogout = async () => {
        await authService.logout()
        router.push("/auth/login")
    }

    if (!user) return null

    return (
        <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="MON COMPTE">
            <section className="contact-two">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-7 col-lg-9">
                            <div className="section-title text-center">
                                <div className="section-title__tagline-box">
                                    <span className="section-title__tagline">Espace Client XPARK</span>
                                </div>
                                <h2 className="section-title__title">Bienvenue, {user.prenom} {user.nom}</h2>
                            </div>

                            <div style={{ background: "#f8f9fa", borderRadius: 12, padding: 30, marginBottom: 30 }}>
                                <p style={{ marginBottom: 8 }}><strong>Email :</strong> {user.email}</p>
                                <p style={{ marginBottom: 8 }}><strong>Rôle :</strong> {user.role}</p>
                                <p style={{ marginBottom: 0 }}>
                                    <strong>Sécurité :</strong>{" "}
                                    {mfa === null ? "…" : mfa.mfaRequired
                                        ? <span style={{ color: "#146c43", fontWeight: 600 }}>🔒 Vérification en deux étapes activée</span>
                                        : <span style={{ color: "#b45309", fontWeight: 600 }}>🔓 MFA non activé — recommandé !</span>}
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: 15, justifyContent: "center", flexWrap: "wrap" }}>
                                <Link href="/account/security" className="thm-btn">
                                    🔐 Sécurité du compte (MFA)<span />
                                </Link>
                                <button type="button" className="thm-btn" onClick={handleLogout}
                                    style={{ background: "#6b7280" }}>
                                    Se déconnecter<span />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    )
}
