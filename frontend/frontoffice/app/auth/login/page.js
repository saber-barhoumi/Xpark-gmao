"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import AuthShell from "@/components/auth/AuthShell"
import CodeInput from "@/components/auth/CodeInput"
import authService from "@/lib/authService"

/**
 * Connexion client — SYSTÈME D'AUTHENTIFICATION & SÉCURITÉ XPARK.
 * Étape 1 : email + mot de passe · Étape 2 : MFA (Authenticator / Email OTP).
 * Page plein écran sans header/footer (AuthShell).
 */
function LoginInner() {
    const router = useRouter()
    const params = useSearchParams()

    const [step, setStep] = useState("credentials")     // credentials | mfa
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [info, setInfo] = useState(
        params.get("confirmed") === "1" ? "Votre email a été confirmé ! Vous pouvez vous connecter." :
        params.get("loggedout") === "1" ? "Vous avez été déconnecté." : "")

    // MFA challenge
    const [mfaToken, setMfaToken] = useState("")
    const [mfaMethods, setMfaMethods] = useState([])
    const [mfaMethod, setMfaMethod] = useState("")
    const [mfaCode, setMfaCode] = useState("")
    const [resendCountdown, setResendCountdown] = useState(0)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setInfo("")
        try {
            const res = await authService.login(email.trim(), password)

            if (res.requiresEmailConfirmation) {
                router.push(`/auth/confirm-email?email=${encodeURIComponent(email.trim())}`)
                return
            }
            if (res.requiresAdminApproval) {
                setInfo("Votre compte attend l'approbation d'un administrateur.")
                return
            }
            // ── Étape 2 : vérification MFA ──
            if (res.requiresMfa && res.mfaToken) {
                setMfaToken(res.mfaToken)
                setMfaMethods(res.mfaMethods ?? [])
                setMfaMethod(res.mfaMethods?.[0] ?? "AUTHENTICATOR")
                setStep("mfa")
                return
            }
            router.push("/account")
        } catch (err) {
            setError(err.message || "Email ou mot de passe incorrect.")
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyMfa = async (code = mfaCode) => {
        if (code.length !== 6) return
        setLoading(true)
        setError("")
        try {
            await authService.verifyMfa(mfaToken, mfaMethod, code)
            router.push("/account")
        } catch (err) {
            setError(err.message || "Code de vérification invalide.")
            setMfaCode("")
        } finally {
            setLoading(false)
        }
    }

    const handleResendEmail = async () => {
        try {
            await authService.resendMfaEmail(mfaToken)
            setInfo("Un nouveau code a été envoyé par email.")
            setResendCountdown(60)
            const timer = setInterval(() => {
                setResendCountdown(prev => {
                    if (prev <= 1) { clearInterval(timer); return 0 }
                    return prev - 1
                })
            }, 1000)
        } catch {
            setError("Erreur lors du renvoi du code.")
        }
    }

    const selectMethod = (m) => {
        setMfaMethod(m)
        setMfaCode("")
        setError("")
        // Envoi automatique du code quand on choisit la méthode Email
        if (m === "EMAIL" && mfaMethods[0] !== "EMAIL" && resendCountdown === 0) handleResendEmail()
    }

    return (
        <AuthShell title={step === "mfa" ? "Vérification en deux étapes" : "Connexion à votre compte"}>
            {error && (
                <div className="text-center" style={{ padding: 12, marginBottom: 20, background: "#fde8e8", color: "#b02a37", borderRadius: 8 }}>
                    {error}
                </div>
            )}
            {info && (
                <div className="text-center" style={{ padding: 12, marginBottom: 20, background: "#e7f5ec", color: "#146c43", borderRadius: 8 }}>
                    {info}
                </div>
            )}

            {step === "mfa" ? (
                <div className="contact-two__form" style={{ textAlign: "center" }}>
                    <p style={{ marginBottom: 10 }}>
                        Compte : <strong>{email}</strong>
                    </p>

                    {mfaMethods.length > 1 && (
                        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
                            {mfaMethods.map(m => (
                                <button
                                    key={m} type="button"
                                    className="thm-btn"
                                    onClick={() => selectMethod(m)}
                                    style={{
                                        padding: "10px 22px",
                                        opacity: mfaMethod === m ? 1 : 0.55,
                                    }}
                                >
                                    {m === "AUTHENTICATOR" ? "📱 Authenticator" : "📧 Email"}<span />
                                </button>
                            ))}
                        </div>
                    )}

                    <p style={{ marginBottom: 15, color: "#6b7280" }}>
                        {mfaMethod === "AUTHENTICATOR"
                            ? "Entrez le code à 6 chiffres de votre application Authenticator."
                            : "Un code à 6 chiffres vous a été envoyé par email (valide 10 minutes)."}
                    </p>

                    <CodeInput
                        value={mfaCode}
                        onChange={setMfaCode}
                        onComplete={handleVerifyMfa}
                        disabled={loading}
                    />

                    <div className="contact-two__btn-box" style={{ marginTop: 20 }}>
                        <button
                            type="button"
                            className="thm-btn contact-two__btn"
                            onClick={() => handleVerifyMfa()}
                            disabled={mfaCode.length !== 6 || loading}
                        >
                            {loading ? "Vérification…" : "Vérifier"}<span />
                        </button>
                    </div>

                    {mfaMethod === "EMAIL" && (
                        <p style={{ marginTop: 15 }}>
                            {resendCountdown > 0
                                ? <span style={{ color: "#6b7280" }}>Renvoyer le code dans {resendCountdown}s</span>
                                : <a href="#" onClick={(e) => { e.preventDefault(); handleResendEmail() }}>
                                    Renvoyer le code par email
                                  </a>}
                        </p>
                    )}

                    <p style={{ marginTop: 10 }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setStep("credentials"); setMfaCode(""); setError("") }}
                            style={{ color: "#6b7280" }}>
                            ← Retour à la connexion
                        </a>
                    </p>
                </div>
            ) : (
                <form className="contact-two__form" onSubmit={handleLogin}>
                    <div className="row">
                        <div className="col-xl-12">
                            <div className="contact-two__input-box">
                                <input
                                    type="email"
                                    placeholder="Adresse email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>
                        <div className="col-xl-12">
                            <div className="contact-two__input-box">
                                <input
                                    type="password"
                                    placeholder="Mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>
                        <div className="col-xl-12">
                            <div className="contact-two__btn-box">
                                <button type="submit" className="thm-btn contact-two__btn" disabled={loading}>
                                    {loading ? "Connexion…" : "Se connecter"}<span />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                        <Link href="/auth/recover-password">Mot de passe oublié ?</Link>
                        <Link href="/auth/register">Créer un compte</Link>
                    </div>
                </form>
            )}
        </AuthShell>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>Chargement…</div>}>
            <LoginInner />
        </Suspense>
    )
}
