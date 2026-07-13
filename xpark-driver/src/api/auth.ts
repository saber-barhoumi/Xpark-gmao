/** Authentification — IAM.API. Le login renvoie un JWT ; on en extrait
 *  l'identité (le back n'a pas d'endpoint /me léger : on décode le token). */

import { IAM_API, request } from "./client"
import type { AuthUser } from "@/types"

interface LoginResponse {
    success?: boolean
    data?: { token: string; requiresMfa?: boolean }
    token?: string
    requiresMfa?: boolean
}

/** Décodage du payload JWT (base64url) sans dépendance externe. */
function decodeJwt(token: string): Record<string, any> {
    try {
        const payload = token.split(".")[1]
        const b64 = payload.replace(/-/g, "+").replace(/_/g, "/")
        const json = decodeURIComponent(
            atob(b64)
                .split("")
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
        )
        return JSON.parse(json)
    } catch {
        return {}
    }
}

export async function login(email: string, password: string): Promise<AuthUser> {
    const res = await request<LoginResponse>(`${IAM_API}/auth/login`, {
        method: "POST",
        body: { email: email.trim(), password },
    })
    const auth = res.data ?? res
    const token = auth?.token
    if (!token) throw new Error("Réponse d'authentification invalide.")
    if (auth?.requiresMfa) throw new Error("La MFA est activée sur ce compte. Désactivez-la pour l'app chauffeur.")

    const claims = decodeJwt(token)
    const role = claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || claims.role || ""
    if (role && role !== "CHAUFFEUR" && !["ADMIN", "ADMINISTRATEUR", "GESTIONNAIRE"].includes(role)) {
        throw new Error("Ce compte n'est pas un compte chauffeur.")
    }
    return {
        userId: Number(claims.userId ?? claims.sub),
        email: claims.email ?? email,
        nom: claims.nom ?? "",
        prenom: claims.prenom ?? "",
        role,
        token,
    }
}
