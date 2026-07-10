"use client"

/**
 * financeService — portail client XPARK.
 * Finance.API (:5005) : factures du client connecté.
 * L'endpoint /my résout le client via le claim `userId` du JWT — un client
 * ne peut jamais consulter les factures d'un autre.
 */

import { apiFetch } from "./authService"

const FINANCE_API = process.env.NEXT_PUBLIC_FINANCE_API_URL || "http://localhost:5005/api"

export const financeService = {
    /** Factures du client connecté */
    getMyInvoices: () => apiFetch("GET", `${FINANCE_API}/factures/my`),
}

export default financeService
