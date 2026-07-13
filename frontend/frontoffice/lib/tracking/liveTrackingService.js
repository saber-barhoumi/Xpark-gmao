"use client"

/**
 * liveTrackingService — récupère la dernière position GPS réelle d'une mission
 * (envoyée par l'app XPARK Driver) depuis Mission.API.
 *
 * Le composant de suivi interroge ce service périodiquement ; s'il existe un
 * point « frais » (isFresh, < 60 s), la carte affiche la VRAIE position du
 * camion au lieu de la simulation.
 */

import { apiFetch } from "./../../lib/authService"

const MISSION_API = process.env.NEXT_PUBLIC_MISSION_API_URL || "http://localhost:5003/api"

/** Dernière position d'une mission. Retourne null si aucune / erreur. */
export async function getLiveFix(missionId) {
    try {
        const data = await apiFetch("GET", `${MISSION_API}/tracking/mission/${missionId}/live`)
        return data?.hasFix ? data : null
    } catch {
        return null
    }
}
