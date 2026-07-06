"use client"

/**
 * authService — client API vers IAM.API (même service que le backoffice).
 * SYSTÈME D'AUTHENTIFICATION & SÉCURITÉ XPARK côté client (frontoffice) :
 * login + MFA (Authenticator TOTP / Email OTP), inscription, confirmation
 * email, reset password, paramètres MFA, historique de connexions,
 * renouvellement silencieux du JWT (rotation refresh token).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

const TOKEN_KEY = "xpark_client_token"
const REFRESH_KEY = "xpark_client_refresh"
const USER_KEY = "xpark_client_user"

// ─── Stockage session ─────────────────────────────────────────────────────────

export function saveSession(auth) {
    if (auth?.token) localStorage.setItem(TOKEN_KEY, auth.token)
    if (auth?.refreshToken) localStorage.setItem(REFRESH_KEY, auth.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify({
        id: auth.idUtilisateur,
        email: auth.email,
        nom: auth.nom,
        prenom: auth.prenom,
        role: auth.role,
    }))
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
}

export function getToken() {
    return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
}

export function getCurrentUser() {
    if (typeof window === "undefined") return null
    const raw = localStorage.getItem(USER_KEY)
    if (!raw || !getToken()) return null
    try { return JSON.parse(raw) } catch { return null }
}

export function isAuthenticated() {
    const token = getToken()
    if (!token) return false
    try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        return payload.exp * 1000 > Date.now()
    } catch { return false }
}

// ─── Appel API avec unwrap ApiResponse + refresh silencieux sur 401 ──────────

async function request(method, path, body = null, { auth = false, retry = true } = {}) {
    const headers = { "Content-Type": "application/json" }
    if (auth) {
        const token = getToken()
        if (token) headers.Authorization = `Bearer ${token}`
    }

    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body !== null ? JSON.stringify(body) : undefined,
    })

    // Renouvellement silencieux (rotation du refresh token) puis rejeu — 1 seule fois
    if (res.status === 401 && auth && retry) {
        const refreshed = await tryRefresh()
        if (refreshed) return request(method, path, body, { auth, retry: false })
        clearSession()
    }

    const payload = await res.json().catch(() => null)
    const data = payload && typeof payload === "object" && "data" in payload ? payload.data : payload

    if (!res.ok) {
        const message = data?.message || payload?.message || `Erreur HTTP ${res.status}`
        const error = new Error(message)
        error.status = res.status
        throw error
    }
    return data
}

async function tryRefresh() {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null
    if (!refreshToken) return false
    try {
        const res = await fetch(`${API_URL}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        })
        if (!res.ok) return false
        const payload = await res.json()
        const auth = payload?.data ?? payload
        if (!auth?.token) return false
        saveSession(auth)
        return true
    } catch { return false }
}

// ─── API publique ─────────────────────────────────────────────────────────────

export const authService = {
    /** Étape 1 : email + mot de passe. Peut renvoyer { requiresMfa, mfaMethods, mfaToken } */
    login: async (email, password) => {
        const auth = await request("POST", "/auth/login", { email, password })
        if (auth?.token && !auth.requiresMfa) saveSession(auth)
        return auth
    },

    /** Étape 2 : vérification du code MFA (TOTP ou email) → vrais jetons */
    verifyMfa: async (mfaToken, method, code) => {
        const auth = await request("POST", "/auth/mfa/verify", { mfaToken, method, code })
        saveSession(auth)
        return auth
    },

    /** Renvoi du code OTP email pendant le challenge MFA */
    resendMfaEmail: (mfaToken) =>
        request("POST", "/auth/mfa/email/resend", { mfaToken }),

    /** Inscription client (rôle CLIENT — auto-activé après confirmation email) */
    register: (data) =>
        request("POST", "/auth/register", { ...data, role: 1 }),

    confirmEmail: (email, token) =>
        request("POST", `/auth/confirm-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`),

    resendConfirmation: (email) =>
        request("POST", "/auth/resend-confirmation", { email }),

    recoverPassword: (email) =>
        request("POST", "/auth/recover-password", { email }),

    resetPassword: (email, token, newPassword, confirmPassword) =>
        request("POST", "/auth/reset-password", { email, token, newPassword, confirmPassword }),

    logout: async () => {
        try { await request("POST", "/auth/logout", null, { auth: true }) } catch { /* ignore */ }
        clearSession()
    },

    getProfile: () => request("GET", "/auth/profile", null, { auth: true }),

    // ── MFA settings (page Sécurité) ──
    getMfaSettings: () => request("GET", "/auth/mfa/settings", null, { auth: true }),
    setupAuthenticator: () => request("POST", "/auth/mfa/authenticator/setup", null, { auth: true }),
    confirmAuthenticator: (code) => request("POST", "/auth/mfa/authenticator/confirm", { code }, { auth: true }),
    disableAuthenticator: () => request("POST", "/auth/mfa/authenticator/disable", null, { auth: true }),
    toggleEmailOtp: () => request("POST", "/auth/mfa/email/toggle", null, { auth: true }),
    getLoginHistory: (limit = 20) => request("GET", `/auth/security/login-history?limit=${limit}`, null, { auth: true }),
}

export default authService
