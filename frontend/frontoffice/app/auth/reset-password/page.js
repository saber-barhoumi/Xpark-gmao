"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import AuthShell from "@/components/auth/AuthShell"
import AuthNotice, { friendlyAuthMessage } from "@/components/auth/AuthNotice"
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
        if (password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.")
            return
        }
        setLoading(true)
        try {
            await authService.resetPassword(email.trim(), token.trim(), password, confirm)
            router.push("/auth/login?confirmed=1")
        } catch (err) {
            setError(friendlyAuthMessage(err.message))
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthShell title="Nouveau mot de passe">
            {error && (
                <AuthNotice variant="error" action={
                    <Link href="/auth/recover-password" style={{ fontWeight: 700, color: "inherit" }}>
                        Demander un nouveau lien
                    </Link>
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
                            <input type="text" placeholder="Token (reçu par email)" value={token}
                                onChange={(e) => setToken(e.target.value)} required />
                        </div>
                    </div>
                    <div className="col-xl-12">
                        <div className="contact-two__input-box">
                            <input type="password" placeholder="Nouveau mot de passe (8 caractères min)" value={password}
                                onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                        </div>
                    </div>
                    <div className="col-xl-12">
                        <div className="contact-two__input-box">
                            <input type="password" placeholder="Confirmer le nouveau mot de passe" value={confirm}
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
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                    <Link href="/auth/recover-password">← Demander un nouveau token</Link>
                    <Link href="/auth/login">Connexion</Link>
                </div>
            </form>
        </AuthShell>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>Chargement…</div>}>
            <ResetPasswordInner />
        </Suspense>
    )
}
