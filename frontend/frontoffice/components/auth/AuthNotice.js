"use client"

/**
 * Notice conviviale pour les pages d'authentification.
 * Trois variantes douces (pas de rouge agressif) avec icône et message clair.
 *   <AuthNotice variant="error|info|success">…</AuthNotice>
 */

const STYLES = {
    error:   { bg: "#fff4e5", color: "#9a5b00", border: "#ffd8a8", icon: "⚠️" },
    info:    { bg: "#e7f1ff", color: "#0b4a9c", border: "#c7dbff", icon: "ℹ️" },
    success: { bg: "#e7f5ec", color: "#146c43", border: "#b7e4c7", icon: "✅" },
}

export default function AuthNotice({ variant = "info", children, action }) {
    const s = STYLES[variant] || STYLES.info
    return (
        <div style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            padding: "14px 16px", marginBottom: 20, borderRadius: 12,
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            fontSize: 14, lineHeight: 1.5,
        }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
                {children}
                {action && <div style={{ marginTop: 8 }}>{action}</div>}
            </div>
        </div>
    )
}

/**
 * Traduit les messages techniques du backend en formulations conviviales
 * et actionnables pour le client final.
 */
export function friendlyAuthMessage(raw) {
    const m = (raw || "").toLowerCase()

    if (m.includes("token") && (m.includes("invalide") || m.includes("expiré") || m.includes("expire")))
        return "Le code saisi ne correspond pas ou a expiré. Vérifiez votre boîte mail (pensez aux spams) ou demandez un nouveau code ci-dessous."
    if (m.includes("code") && m.includes("invalide"))
        return "Ce code n'est pas valide. Vérifiez-le et réessayez, ou demandez-en un nouveau."
    if (m.includes("email") && m.includes("mot de passe"))
        return "Email ou mot de passe incorrect. Réessayez, ou réinitialisez votre mot de passe."
    if (m.includes("email déjà") || m.includes("email deja") || m.includes("déjà utilisé"))
        return "Un compte existe déjà avec cette adresse email."
    if (m.includes("mots de passe ne correspondent"))
        return "Les deux mots de passe ne sont pas identiques."
    if (m.includes("bloqué") || m.includes("bloque"))
        return "Trop de tentatives. Patientez quelques minutes avant de réessayer."
    if (m.includes("session mfa") || m.includes("session expir"))
        return "Votre session a expiré. Reconnectez-vous pour continuer."
    if (m.includes("http") || m.includes("500") || m.includes("erreur interne") || m === "")
        return "Une erreur est survenue. Veuillez réessayer dans un instant."

    // Message déjà lisible → on le garde tel quel
    return raw
}
