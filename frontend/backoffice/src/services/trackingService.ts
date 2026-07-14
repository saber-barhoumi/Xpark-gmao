/**
 * trackingService — dernière position GPS réelle d'une mission (envoyée par
 * l'app XPARK Driver), pour la carte de suivi du Back Office.
 *
 * Réutilise EXACTEMENT l'endpoint du portail client
 * (frontoffice/lib/tracking/liveTrackingService.js) : GET /tracking/mission/{id}/live
 * sur Mission.API. Comme le portail client, on appelle Mission.API en direct
 * (la passerelle :5000 ne proxifie pas /tracking) avec le JWT de l'admin.
 * `CanRead` autorise le personnel (ADMIN / ADMINISTRATEUR / GESTIONNAIRE).
 */

const MISSION_API = import.meta.env.VITE_MISSION_API_URL || 'http://localhost:5003/api'

export interface LiveFix {
    hasFix: boolean
    latitude: number
    longitude: number
    speedKmh?: number | null
    heading?: number | null
    accuracy?: number | null
    recordedAt: string
    ageSeconds: number
    isFresh: boolean
}

/** Dernière position d'une mission. Retourne null si aucune / erreur (repli simulation). */
export async function getLiveFix(missionId: number): Promise<LiveFix | null> {
    try {
        const token = localStorage.getItem('xpark_token')
        const res = await fetch(`${MISSION_API}/tracking/mission/${missionId}/live`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) return null
        const data = await res.json()
        return data?.hasFix ? (data as LiveFix) : null
    } catch {
        return null
    }
}

export default { getLiveFix }
