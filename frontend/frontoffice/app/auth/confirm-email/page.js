"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Layout from "@/components/layout/Layout"
import authService from "@/lib/authService"

function ConfirmEmailInner() {
    const router = useRouter()
    const params = useSearchParams()

    const [email, setEmail] = useState(params.get("email") ?? "")
    const [token, setToken] = useState(params.get("token") ?? "")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [info, setInfo] = useState(
        params.get("sent") === "1"
            ? "Compte créé ! Un code de confirmation vous a été envoyé par email."
            : "")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            await authService.confirmEmail(email.trim(), token.trim())
            router.push("/auth/login?confirmed=1")
        } catch (err) {
            setError(err.message || "Code de confirmation invalide ou expiré.")
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setError("")
        try {
            await authService.resendConfirmation(email.trim())
            setInfo("Un nouveau code de confirmation a été envoyé.")
        } catch (err) {
            setError(err.message || "Erreur lors du renvoi.")
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
                            <h2 className="section-title__title">Confirmer votre email</h2>
                        </div>

                        {info && <div className="text-center" style={{ padding: 12, marginBottom: 20, background: "#e7f5ec", color: "#146c43", borderRadius: 8 }}>{info}</div>}
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
                                        <input type="text" placeholder="Code de confirmation (reçu par email)" value={token}
                                            onChange={(e) => setToken(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="col-xl-12">
                                    <div className="contact-two__btn-box">
                                        <button type="submit" className="thm-btn contact-two__btn" disabled={loading}>
                                            {loading ? "Vérification…" : "Confirmer"}<span />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <p className="text-center" style={{ marginTop: 20 }}>
                                <a href="#" onClick={(e) => { e.preventDefault(); handleResend() }}>
                                    Renvoyer le code de confirmation
                                </a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default function ConfirmEmailPage() {
    return (
        <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="CONFIRMATION EMAIL">
            <Suspense fallback={<div className="container" style={{ padding: 60 }}>Chargement…</div>}>
                <ConfirmEmailInner />
            </Suspense>
        </Layout>
    )
}
