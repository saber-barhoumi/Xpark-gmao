/** Hook de chargement des missions du chauffeur (avec rechargement manuel). */

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/auth/AuthContext"
import { getDriverMissions } from "@/api/missions"
import type { Mission } from "@/types"

export function useMissions() {
    const { user } = useAuth()
    const [missions, setMissions] = useState<Mission[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const reload = useCallback(async () => {
        if (!user) return
        setLoading(true); setError("")
        try {
            const data = await getDriverMissions(user.token)
            setMissions(Array.isArray(data) ? data : [])
        } catch (e) {
            setError((e as Error).message)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => { reload() }, [reload])
    return { missions, loading, error, reload }
}
