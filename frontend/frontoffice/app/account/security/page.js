"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import CodeInput from "@/components/auth/CodeInput"
import authService from "@/lib/authService"
import ClientPortalLayout from "@/components/portal/ClientPortalLayout"

/**
 * Sécurité du compte client — SYSTÈME D'AUTHENTIFICATION & SÉCURITÉ XPARK.
 * MFA (Authenticator TOTP + Email OTP) avec setup QR code, et historique
 * des connexions — mêmes endpoints IAM.API que le backoffice.
 */
export default function SecurityPage() {
    const router = useRouter()
    const [settings, setSettings] = useState(null)
    const [history, setHistory] = useState([])
    const [error, setError] = useState("")
    const [info, setInfo] = useState("")

    // Setup Authenticator (QR)
    const [setup, setSetup] = useState(null)
    const [confirmCode, setConfirmCode] = useState("")
    const [confirming, setConfirming] = useState(false)

    const refresh = useCallback(async () => {
        try {
            const [s, h] = await Promise.all([
                authService.getMfaSettings(),
                authService.getLoginHistory(15),
            ])
            setSettings(s)
            setHistory(h)
        } catch {
            setError("Impossible de charger les paramètres de sécurité.")
        }
    }, [])

    useEffect(() => { refresh() }, [refresh])

    // ── Authenticator ────────────────────────────────────────────────────────

    const startSetup = async () => {
        setError(""); setInfo("")
        try {
            setSetup(await authService.setupAuthenticator())
            setConfirmCode("")
        } catch (err) {
            setError(err.message || "Erreur lors du démarrage de la configuration.")
        }
    }

    const confirmSetup = async (code = confirmCode) => {
        if (code.length !== 6) return
        setConfirming(true)
        setError("")
        try {
            const updated = await authService.confirmAuthenticator(code)
            setSettings(updated)
            setSetup(null)
            setInfo("✅ Authenticator activé — un code sera demandé à chaque connexion.")
            refresh()
        } catch (err) {
            setError(err.message || "Code invalide. Vérifiez votre application.")
            setConfirmCode("")
        } finally {
            setConfirming(false)
        }
    }

    const disableAuthenticator = async () => {
        if (!window.confirm("Désactiver l'Authenticator ? Votre compte sera moins protégé.")) return
        setSettings(await authService.disableAuthenticator())
        setInfo("Authenticator désactivé.")
        refresh()
    }

    const toggleEmail = async () => {
        setError(""); setInfo("")
        const updated = await authService.toggleEmailOtp()
        setSettings(updated)
        setInfo(updated.emailOtpEnabled
            ? "✅ Vérification par email activée."
            : "Vérification par email désactivée.")
        refresh()
    }

    if (!settings) {
        return (
            <ClientPortalLayout title="🔐 Sécurité du compte">
                <p style={{ padding: 60, textAlign: "center", color: "var(--pmuted)" }}>Chargement…</p>
            </ClientPortalLayout>
        )
    }

    const cardStyle = { background: "var(--pcard)", border: "1px solid var(--pborder)", borderRadius: 12, padding: 25, height: "100%" }
    const badgeOn = { background: "#e7f5ec", color: "#146c43", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }
    const badgeOff = { background: "#eee", color: "#6b7280", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }

    return (
        <ClientPortalLayout title="🔐 Sécurité du compte">
            <div>
                <div>
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ marginTop: 0 }}>
                            {settings.mfaRequired
                                ? <span style={badgeOn}>Vérification en deux étapes ACTIVÉE</span>
                                : <span style={{ ...badgeOff, background: "#fff3cd", color: "#b45309" }}>MFA non activé — nous le recommandons</span>}
                        </p>
                    </div>

                    {error && <div className="text-center" style={{ padding: 12, marginBottom: 20, background: "#fde8e8", color: "#b02a37", borderRadius: 8 }}>{error}</div>}
                    {info && <div className="text-center" style={{ padding: 12, marginBottom: 20, background: "#e7f5ec", color: "#146c43", borderRadius: 8 }}>{info}</div>}

                    {/* ── Méthodes MFA ─────────────────────────────── */}
                    <div className="row" style={{ marginBottom: 40 }}>
                        <div className="col-xl-6 col-lg-6" style={{ marginBottom: 20 }}>
                            <div style={cardStyle}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                    <h4 style={{ fontSize: 18, margin: 0 }}>📱 Application Authenticator</h4>
                                    <span style={settings.authenticatorEnabled ? badgeOn : badgeOff}>
                                        {settings.authenticatorEnabled ? "Activé" : "Désactivé"}
                                    </span>
                                </div>
                                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 15 }}>
                                    Code à 6 chiffres généré par Google/Microsoft Authenticator —
                                    change toutes les 30 secondes. La méthode la plus sûre.
                                </p>
                                {settings.authenticatorEnabled ? (
                                    <button type="button" className="thm-btn" onClick={disableAuthenticator}
                                        style={{ background: "#b02a37", padding: "10px 22px" }}>
                                        Désactiver<span />
                                    </button>
                                ) : (
                                    <button type="button" className="thm-btn" onClick={startSetup}
                                        style={{ padding: "10px 22px" }}>
                                        Configurer avec QR code<span />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="col-xl-6 col-lg-6" style={{ marginBottom: 20 }}>
                            <div style={cardStyle}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                    <h4 style={{ fontSize: 18, margin: 0 }}>📧 Vérification par Email</h4>
                                    <span style={settings.emailOtpEnabled ? badgeOn : badgeOff}>
                                        {settings.emailOtpEnabled ? "Activé" : "Désactivé"}
                                    </span>
                                </div>
                                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 15 }}>
                                    Code à 6 chiffres envoyé par email à chaque connexion —
                                    valide 10 minutes, 5 tentatives maximum.
                                </p>
                                <button type="button" className="thm-btn" onClick={toggleEmail}
                                    style={{ padding: "10px 22px", ...(settings.emailOtpEnabled ? { background: "#b02a37" } : {}) }}>
                                    {settings.emailOtpEnabled ? "Désactiver" : "Activer"}<span />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Setup QR (inline) ───────────────────────── */}
                    {setup && (
                        <div className="row justify-content-center" style={{ marginBottom: 40 }}>
                            <div className="col-xl-6 col-lg-8">
                                <div style={{ ...cardStyle, textAlign: "center", border: "2px solid #ddd" }}>
                                    <h4 style={{ fontSize: 18 }}>Configurer l&apos;Authenticator</h4>
                                    <p style={{ fontSize: 14, color: "#6b7280" }}>
                                        <strong>Étape 1</strong> — Scannez ce QR code avec Google/Microsoft Authenticator :
                                    </p>
                                    <img src={setup.qrCodeDataUri} alt="QR Code" width={190} height={190} />
                                    <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
                                        Ou saisissez la clé : <code>{setup.secret}</code>
                                    </p>
                                    <p style={{ fontSize: 14, color: "#6b7280" }}>
                                        <strong>Étape 2</strong> — Entrez le code à 6 chiffres affiché :
                                    </p>
                                    <div style={{ maxWidth: 260, margin: "0 auto" }}>
                                        <CodeInput value={confirmCode} onChange={setConfirmCode}
                                            onComplete={confirmSetup} disabled={confirming} />
                                    </div>
                                    <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 15 }}>
                                        <button type="button" className="thm-btn" onClick={() => setSetup(null)}
                                            style={{ background: "#6b7280", padding: "10px 22px" }}>
                                            Annuler<span />
                                        </button>
                                        <button type="button" className="thm-btn" onClick={() => confirmSetup()}
                                            disabled={confirmCode.length !== 6 || confirming}
                                            style={{ padding: "10px 22px" }}>
                                            {confirming ? "Vérification…" : "Valider & Activer"}<span />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Historique des connexions ───────────────── */}
                    <div className="row justify-content-center">
                        <div className="col-xl-10">
                            <h4 style={{ fontSize: 18, marginBottom: 15 }}>🕐 Historique des connexions</h4>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ background: "#f1f3f5", textAlign: "left" }}>
                                            <th style={{ padding: 10 }}>Date</th>
                                            <th style={{ padding: 10 }}>Méthode</th>
                                            <th style={{ padding: 10 }}>MFA</th>
                                            <th style={{ padding: 10 }}>Adresse IP</th>
                                            <th style={{ padding: 10 }}>Résultat</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.length === 0 && (
                                            <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
                                                Aucune connexion enregistrée
                                            </td></tr>
                                        )}
                                        {history.map((h, i) => (
                                            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                                                <td style={{ padding: 10 }}>{new Date(h.loggedInAt).toLocaleString("fr-FR")}</td>
                                                <td style={{ padding: 10 }}>{h.loginMethod}</td>
                                                <td style={{ padding: 10 }}>{h.mfaMethod ?? "—"}</td>
                                                <td style={{ padding: 10, color: "#6b7280" }}>{h.ipAddress ?? "—"}</td>
                                                <td style={{ padding: 10 }}>
                                                    {h.isSuccessful
                                                        ? <span style={badgeOn}>Réussie</span>
                                                        : <span style={{ ...badgeOff, background: "#fde8e8", color: "#b02a37" }}
                                                            title={h.failureReason ?? ""}>Échec</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p style={{ marginTop: 25, textAlign: "center" }}>
                                <Link href="/account" style={{ color: "#0d6efd" }}>← Retour au tableau de bord</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ClientPortalLayout>
    )
}
