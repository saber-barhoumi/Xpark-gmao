"use client"

import { useState } from "react"
import Link from "next/link"
import Layout from "@/components/layout/Layout"
import authService from "@/lib/authService"

/** Demande de réinitialisation de mot de passe (token envoyé par email). */
export default function RecoverPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await authService.recoverPassword(email.trim())
        } finally {
            // Toujours afficher le même message (bonne pratique sécurité —
            // ne pas révéler si l'email existe)
            setSent(true)
            setLoading(false)
        }
    }

    return (
        <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="MOT DE PASSE OUBLIÉ">
            <section className="contact-two">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-6 col-lg-8">
                            <div className="section-title text-center">
                                <div className="section-title__tagline-box">
                                    <span className="section-title__tagline">Espace Client XPARK</span>
                                </div>
                                <h2 className="section-title__title">Mot de passe oublié</h2>
                            </div>

                            {sent ? (
                                <div className="text-center">
                                    <div style={{ padding: 15, marginBottom: 20, background: "#e7f5ec", color: "#146c43", borderRadius: 8 }}>
                                        Si un compte existe avec cet email, un lien de réinitialisation
                                        vient de lui être envoyé (valide 1 heure).
                                    </div>
                                    <Link href="/auth/reset-password" className="thm-btn">
                                        J&apos;ai reçu mon code<span />
                                    </Link>
                                </div>
                            ) : (
                                <form className="contact-two__form" onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-xl-12">
                                            <div className="contact-two__input-box">
                                                <input type="email" placeholder="Adresse email de votre compte"
                                                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                                            </div>
                                        </div>
                                        <div className="col-xl-12">
                                            <div className="contact-two__btn-box">
                                                <button type="submit" className="thm-btn contact-two__btn" disabled={loading}>
                                                    {loading ? "Envoi…" : "Envoyer le lien"}<span />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-center" style={{ marginTop: 20 }}>
                                        <Link href="/auth/login">← Retour à la connexion</Link>
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    )
}
