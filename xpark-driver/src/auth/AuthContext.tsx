/**
 * AuthContext — session du chauffeur.
 *
 * Le jeton et l'identité sont conservés via `sessionStore` (SecureStore chiffré
 * sur mobile, localStorage sur web) → « se souvenir de la session » par défaut :
 * le chauffeur reste connecté entre les ouvertures. `logout` efface tout et
 * arrête le suivi GPS s'il est actif.
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { sessionStore } from "@/auth/sessionStore"
import { login as apiLogin } from "@/api/auth"
import { stopTracking } from "@/tracking/locationTask"
import type { AuthUser } from "@/types"

const STORE_KEY = "xpark_driver_session"

interface AuthState {
    user: AuthUser | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
}

const Ctx = createContext<AuthState>({} as AuthState)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    // Restaure la session au démarrage
    useEffect(() => {
        (async () => {
            try {
                const raw = await sessionStore.get(STORE_KEY)
                if (raw) setUser(JSON.parse(raw) as AuthUser)
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const signIn = useCallback(async (email: string, password: string) => {
        const u = await apiLogin(email, password)
        await sessionStore.set(STORE_KEY, JSON.stringify(u))
        setUser(u)
    }, [])

    const signOut = useCallback(async () => {
        try { await stopTracking() } catch { /* ignore */ }
        await sessionStore.del(STORE_KEY)
        setUser(null)
    }, [])

    return <Ctx.Provider value={{ user, loading, signIn, signOut }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
