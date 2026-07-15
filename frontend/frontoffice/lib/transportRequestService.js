"use client"

/**
 * transportRequestService — demandes de transport ("devis") du portail client.
 * Étape AVANT la Mission : le client soumet, édite ou annule SA demande tant
 * qu'elle est PENDING_QUOTATION ; une fois QUOTATION_SENT, il ne peut plus
 * qu'accepter (→ Mission créée) ou refuser. Miroir de missionService.js —
 * même transport (apiFetch, JWT), même service (Mission.API :5003).
 */

import { apiFetch } from "./authService"

const MISSION_API = process.env.NEXT_PUBLIC_MISSION_API_URL || "http://localhost:5003/api"

export const transportRequestService = {
    /** Soumission d'une nouvelle demande — aucune Mission créée à ce stade. */
    submit: (data) => apiFetch("POST", `${MISSION_API}/missions/demandes`, data),

    /** Demandes du client connecté, du plus récent au plus ancien. */
    getMyRequests: () => apiFetch("GET", `${MISSION_API}/missions/demandes/my`),

    getMyRequest: (id) => apiFetch("GET", `${MISSION_API}/missions/demandes/my/${id}`),

    /** Édition tant que la demande est PENDING_QUOTATION. */
    edit: (id, data) => apiFetch("PUT", `${MISSION_API}/missions/demandes/my/${id}`, data),

    /** Retrait de la demande tant qu'elle est PENDING_QUOTATION. */
    cancel: (id, reason) => apiFetch("PUT", `${MISSION_API}/missions/demandes/my/${id}/cancel`, { reason }),

    /** Acceptation du devis → crée la Mission (EN_ATTENTE, affectée par OptimisateurFlotteIA). */
    accept: (id) => apiFetch("PUT", `${MISSION_API}/missions/demandes/my/${id}/accept`),

    /** Refus du devis — aucune Mission créée. */
    reject: (id, reason) => apiFetch("PUT", `${MISSION_API}/missions/demandes/my/${id}/reject`, { reason }),
}

export default transportRequestService
