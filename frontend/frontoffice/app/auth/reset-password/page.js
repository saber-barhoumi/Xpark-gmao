"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Layout from "@/components/layout/Layout"
import authService from "@/lib/authService"

function ResetPasswordInner() {
    const router = useRouter()
    const params = useSearchParams()

    const [email, setEmail] = useState(params.get("email") ?? "")
    const [token, setToken] = useState(params.get("token") ?? "")
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        if (password !== confirm) {
            setError("Les mots de passe ne correspondent pas.")
            return
        }
        setLoading(true)
        try {
            await authService.resetPassword(email.trim(), token.trim(), password, confirm)
            router.push("/auth/login?confirmed=1")
        } catch (err) {
            setError(err.message || "Token invalide ou expiré.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="contact-two">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-xl-6 col-lg-8">
                        <div className="section-title text-center">
                            <div className="section-title__tagline-box">
                                <span className="section-title__tagline">Espace Client XPARK</span>
                            </div>
                            <h2 className="section-title__title">Nouveau mot de passe</h2>
                        </div>

                        {error && <div className="text-center" style={{ padding: 12, marginBottom: 20, background: "#fde8e8", color: "#b02a37", borderRadius: 8 }}>{error}</div>}

                        <form className="contact-two__form" onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-xl-12">
                                    <div className="contact-two__input-box">
                                        <input type="email" placeholder="Adresse email" value={email}
                                            onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="col-xl-12">
                                    <div className="contact-two__input-box">
                                        <input type="text" placeholder="Token (reçu par email)" value={token}
                                            onChange={(e) => setToken(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="col-xl-6 col-lg-6">
                                    <div className="contact-two__input-box">
                                        <input type="password" placeholder="Nouveau mot de passe" value={password}
                                            onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                                    </div>
                                </div>
                                <div className="col-xl-6 col-lg-6">
                                    <div className="contact-two__input-box">
                                        <input type="password" placeholder="Confirmer" value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
                                    </div>
                                </div>
                                <div className="col-xl-12">
                                    <div className="contact-two__btn-box">
                                        <button type="submit" className="thm-btn contact-two__btn" disabled={loading}>
                                            {loading ? "Réinitialisation…" : "Réinitialiser"}<span />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default function ResetPasswordPage() {
    return (
        <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="RÉINITIALISATION">
            <Suspense fallback={<div className="container" style={{ padding: 60 }}>Chargement…</div>}>
                <ResetPasswordInner />
            </Suspense>
        </Layout>
    )
}
