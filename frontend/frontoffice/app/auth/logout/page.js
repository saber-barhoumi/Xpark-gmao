"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import AuthShell from "@/components/auth/AuthShell"
import authService from "@/lib/authService"

/**
 * Déconnexion — révoque le refresh token côté IAM.API, efface la session
 * locale, puis redirige vers la connexion.
 */
export default function LogoutPage() {
    const router = useRouter()
    const [done, setDone] = useState(false)

    useEffect(() => {
        let cancelled = false
        authService.logout().finally(() => {
            if (cancelled) return
            setDone(true)
            const timer = setTimeout(() => router.push("/auth/login?loggedout=1"), 2000)
            return () => clearTimeout(timer)
        })
        return () => { cancelled = true }
    }, [router])

    return (
        <AuthShell title="Déconnexion">
            <div className="text-center">
                {done ? (
                    <>
                        <div style={{ fontSize: 50, marginBottom: 15 }}>👋</div>
                        <p style={{ marginBottom: 20 }}>
                            Vous avez été déconnecté avec succès.<br />
                            Redirection vers la page de connexion…
                        </p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                            <Link href="/auth/login" className="thm-btn" style={{ padding: "10px 22px" }}>
                                Se reconnecter<span />
                            </Link>
                            <Link href="/" className="thm-btn" style={{ padding: "10px 22px", background: "#6b7280" }}>
                                Retour au site<span />
                            </Link>
                        </div>
                    </>
                ) : (
                    <p>Déconnexion en cours…</p>
                )}
            </div>
        </AuthShell>
    )
}
