"use client"

import { useState } from "react"
import Link from "next/link"
import AuthShell from "@/components/auth/AuthShell"
import authService from "@/lib/authService"

/** Mot de passe oublié — envoie un token de réinitialisation par email (valide 1 h). */
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
        <AuthShell title="Mot de passe oublié">
            {sent ? (
                <div className="text-center">
                    <div style={{ padding: 15, marginBottom: 20, background: "#e7f5ec", color: "#146c43", borderRadius: 8 }}>
                        Si un compte existe avec cet email, un lien de réinitialisation
                        vient de lui être envoyé (valide 1 heure).
                    </div>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                        <Link href={`/auth/reset-password?email=${encodeURIComponent(email.trim())}`}
                            className="thm-btn" style={{ padding: "10px 22px" }}>
                            J&apos;ai reçu mon code<span />
                        </Link>
                        <Link href="/auth/login" className="thm-btn"
                            style={{ padding: "10px 22px", background: "#6b7280" }}>
                            Retour connexion<span />
                        </Link>
                    </div>
                </div>
            ) : (
                <form className="contact-two__form" onSubmit={handleSubmit}>
                    <p className="text-center" style={{ color: "#6b7280", marginBottom: 20 }}>
                        Entrez l&apos;adresse email de votre compte — nous vous enverrons
                        un token de réinitialisation.
                    </p>
                    <div className="row">
                        <div className="col-xl-12">
                            <div className="contact-two__input-box">
                                <input type="email" placeholder="Adresse email de votre compte"
                                    value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
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
        </AuthShell>
    )
}
