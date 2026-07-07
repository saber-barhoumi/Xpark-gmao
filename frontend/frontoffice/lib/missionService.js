"use client"

/**
 * missionService — portail client XPARK.
 *  - Mission.API : mes missions + demande de réservation (mission EN_ATTENTE,
 *    affectée ensuite par l'admin ou OptimisateurFlotteIA)
 *  - CalculateurPrixTrajetIA (:8000) : villes, distances, estimation de prix
 */

import { apiFetch } from "./authService"

const AI_API = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000"
// Les missions vivent sur Mission.API (:5003), pas sur IAM.API (:5001)
const MISSION_API = process.env.NEXT_PUBLIC_MISSION_API_URL || "http://localhost:5003/api"

export const missionService = {
    /** Missions du client connecté */
    getMyMissions: () => apiFetch("GET", `${MISSION_API}/missions/my`),

    /** Demande de réservation → mission EN_ATTENTE */
    createRequest: (data) => apiFetch("POST", `${MISSION_API}/missions/client-request`, data),

    /** Le client annule SA réservation tant qu'elle est EN_ATTENTE */
    cancelMyMission: (id) => apiFetch("PUT", `${MISSION_API}/missions/my/${id}/cancel`),
}

// ── IA prix de trajet (service public, sans auth) ───────────────────────────

export const aiService = {
    getCities: async () => {
        const res = await fetch(`${AI_API}/cities`)
        if (!res.ok) throw new Error("Service IA indisponible")
        return (await res.json()).cities
    },

    getDistance: async (departure, arrival) => {
        const res = await fetch(
            `${AI_API}/distance?departure=${encodeURIComponent(departure)}&arrival=${encodeURIComponent(arrival)}`)
        if (!res.ok) throw new Error("Distance inconnue pour cette paire de villes")
        return res.json()   // { distance_km, travel_hours, ... }
    },

    predictPrice: async (payload) => {
        const res = await fetch(`${AI_API}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Estimation IA indisponible")
        return res.json()   // { predicted_cost_tnd, vehicle_type_used, ... }
    },
}

export default missionService
