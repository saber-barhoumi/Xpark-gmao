/** Envoi des positions GPS — Mission.API (POST /tracking/ping). */

import { MISSION_API, request } from "./client"
import type { PingPayload } from "@/types"

/** Envoie une position. Ne rejette pas fort : le suivi ne doit pas planter
 *  l'app si un ping échoue (réseau mobile intermittent) — on log et on continue. */
export async function sendPing(token: string, payload: PingPayload): Promise<boolean> {
    try {
        await request(`${MISSION_API}/tracking/ping`, { method: "POST", body: payload, token })
        return true
    } catch (e) {
        console.warn("[tracking] ping échoué :", (e as Error).message)
        return false
    }
}
