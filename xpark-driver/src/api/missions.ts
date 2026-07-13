/** Missions du chauffeur — Mission.API. */

import { MISSION_API, request } from "./client"
import type { Mission } from "@/types"

/** Missions assignées au chauffeur connecté (optionnellement filtrées). */
export function getDriverMissions(token: string, statut?: string): Promise<Mission[]> {
    const qs = statut ? `?statut=${encodeURIComponent(statut)}` : ""
    return request<Mission[]>(`${MISSION_API}/missions/driver${qs}`, { token })
}
