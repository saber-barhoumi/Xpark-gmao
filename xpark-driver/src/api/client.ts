/**
 * Client HTTP bas niveau — un seul endroit pour les URLs de base, l'injection
 * du jeton et la gestion d'erreurs. Les modules api/* s'appuient dessus.
 *
 * Les URLs viennent de la config Expo (EXPO_PUBLIC_*). Sur un vrai téléphone,
 * "localhost" désigne le téléphone : utiliser l'IP LAN du PC (voir .env.example).
 */

export const IAM_API =
    process.env.EXPO_PUBLIC_IAM_API_URL || "http://localhost:5001/api"
export const MISSION_API =
    process.env.EXPO_PUBLIC_MISSION_API_URL || "http://localhost:5003/api"

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message)
    }
}

interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
    body?: unknown
    token?: string | null
    timeoutMs?: number
}

export async function request<T>(url: string, opts: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, token, timeoutMs = 15000 } = opts
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body != null ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        })
        const text = await res.text()
        const data = text ? JSON.parse(text) : null
        if (!res.ok) {
            const msg = (data && (data.message || data.title)) || `Erreur ${res.status}`
            throw new ApiError(res.status, msg)
        }
        return data as T
    } catch (e) {
        if (e instanceof ApiError) throw e
        throw new ApiError(0, "Réseau indisponible. Vérifiez votre connexion et l'adresse du serveur.")
    } finally {
        clearTimeout(timer)
    }
}
