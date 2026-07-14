/**
 * aiPricingService — client unique du service de tarification IA
 * (CalculateurPrixTrajetIA, :8000).
 *
 * ⚠️ Un SEUL point d'appel de l'IA côté back office. Il reflète volontairement
 * l'`aiService` du portail client (frontoffice/lib/missionService.js) pour que
 * le Front Office ET le Back Office estiment le prix avec exactement la même
 * logique et le même endpoint — pas de duplication, pas d'incohérence.
 *
 * Endpoints réutilisés (identiques au portail client) :
 *   GET  /cities                       → liste des villes connues
 *   GET  /distance?departure&arrival   → { distance_km, travel_hours, ... }
 *   POST /predict                      → coût estimé + ventilation
 */

const AI_API = import.meta.env.VITE_AI_API_URL ?? 'http://localhost:8000'

// ── Types du contrat /predict (alignés sur le back CalculateurPrixTrajetIA) ────

/** Corps envoyé à POST /predict. Seuls departure/arrival/date_depart sont requis. */
export interface PredictPayload {
    departure: string
    arrival: string
    date_depart: string                       // ISO local "YYYY-MM-DDTHH:mm"
    vehicle_type_gmao?: string                // BERLINE, CAMION, UTILITAIRE… (enum GMAO)
    fuel_type_gmao?: string                   // DIESEL, ESSENCE…
    fuel_consumption_per_100km?: number
    has_autoroute?: boolean
    cargo_weight?: number
    passenger_count?: number
    luggage_weight?: number
    traffic_condition?: string
    weather_condition?: string
}

export interface DistanceInfo {
    distance_km: number
    travel_hours: number
    departure_governorate?: string
    arrival_governorate?: string
}

export interface PredictionData {
    predicted_cost_tnd: number
    distance_km: number
    travel_hours: number
    fuel_cost_tnd: number
    labor_cost_tnd: number
    toll_cost_tnd: number
    driver_allowance_tnd: number
    maintenance_cost_tnd: number
    cargo_surcharge_tnd: number
    vehicle_type_used: string
    fuel_type_used: string
    model_used?: string
}

// ── Service ───────────────────────────────────────────────────────────────────

export const aiPricingService = {
    /** Villes connues du modèle (mêmes paires que /distance). */
    getCities: async (): Promise<string[]> => {
        const res = await fetch(`${AI_API}/cities`)
        if (!res.ok) throw new Error('Service IA indisponible')
        return (await res.json()).cities
    },

    /** Distance + durée pour une paire de villes. 404 si paire inconnue. */
    getDistance: async (departure: string, arrival: string): Promise<DistanceInfo> => {
        const res = await fetch(
            `${AI_API}/distance?departure=${encodeURIComponent(departure)}&arrival=${encodeURIComponent(arrival)}`)
        if (!res.ok) throw new Error('Distance inconnue pour cette paire de villes')
        return res.json()
    },

    /** Estimation du coût de trajet par l'IA (même modèle que le portail client). */
    predictPrice: async (payload: PredictPayload): Promise<PredictionData> => {
        const res = await fetch(`${AI_API}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Estimation IA indisponible')
        return res.json()
    },
}

export default aiPricingService
