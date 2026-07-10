"use client"

/**
 * supportService — portail client XPARK.
 * Mission.API (:5003) /api/support : tickets de support du client.
 * Statuts : OUVERT → EN_COURS → RESOLU / FERME.
 */

import { apiFetch } from "./authService"

const MISSION_API = process.env.NEXT_PUBLIC_MISSION_API_URL || "http://localhost:5003/api"

export const supportService = {
    /** Tickets du client connecté */
    getMyTickets: () => apiFetch("GET", `${MISSION_API}/support/my`),

    /** Création d'un ticket : { sujet, categorie, message, missionId? } */
    createTicket: (data) => apiFetch("POST", `${MISSION_API}/support`, data),

    /** Le client ferme son ticket */
    closeTicket: (id) => apiFetch("PUT", `${MISSION_API}/support/my/${id}/close`),
}

export default supportService
