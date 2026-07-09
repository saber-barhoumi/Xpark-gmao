"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import AuthShell from "@/components/auth/AuthShell"
import AuthNotice, { friendlyAuthMessage } from "@/components/auth/AuthNotice"
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
            setError(friendlyAuthMessage(err.message))
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setError("")
        try {
            await authService.resendConfirmation(email.trim())
            setInfo("Un nouveau code vous a été envoyé par email. Pensez à vérifier vos spams.")
        } catch (err) {
            setError(friendlyAuthMessage(err.message))
        }
    }

    return (
        <AuthShell title="Confirmer votre email">
            {info && <AuthNotice variant="success">{info}</AuthNotice>}
            {error && (
                <AuthNotice variant="error" action={
                    <a href="#" onClick={(e) => { e.preventDefault(); handleResend() }} style={{ fontWeight: 700, color: "inherit" }}>
                        📩 Renvoyer un nouveau code
                    </a>
                }>{error}</AuthNotice>
            )}

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
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleResend() }}>
                        Renvoyer le code
                    </a>
                    <Link href="/auth/login">← Retour à la connexion</Link>
                </div>
            </form>
        </AuthShell>
    )
}

export default function ConfirmEmailPage() {
    return (
        <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>Chargement…</div>}>
            <ConfirmEmailInner />
        </Suspense>
    )
}
