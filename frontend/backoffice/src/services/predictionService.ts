import api from '@/lib/axiosConfig'
import type {
    PredictionDashboard, Prediction, RecalculResultat, SanteVehicule,
} from '@/types/prediction'

/**
 * Client du microservice PredictionPanne (maintenance prédictive).
 * Même forme que les autres services du back-office : `api` gère le JWT,
 * le slash final et le rafraîchissement de jeton.
 */
const predictionService = {
    /** KPIs, répartitions et classement des véhicules à risque. */
    getDashboard: async (): Promise<PredictionDashboard> => {
        const res = await api.get('/predictions/dashboard')
        return res.data
    },

    /** Santé de tout le parc, du plus dégradé au plus sain. */
    getSanteFlotte: async (): Promise<SanteVehicule[]> => {
        const res = await api.get('/predictions/sante')
        return res.data ?? []
    },

    /** Santé détaillée d'un véhicule. */
    getSanteVehicule: async (vehiculeId: number): Promise<SanteVehicule> => {
        const res = await api.get(`/predictions/sante/${vehiculeId}`)
        return res.data
    },

    /** Historique des prédictions d'un véhicule. */
    getHistorique: async (vehiculeId: number, limite = 50): Promise<Prediction[]> => {
        const res = await api.get(`/predictions/historique/${vehiculeId}`, { params: { limite } })
        return res.data ?? []
    },

    /**
     * Relance le moteur sur tout le parc (ADMIN / ADMINISTRATEUR / GESTIONNAIRE).
     * Un corps vide `{}` est envoyé explicitement : un POST sans en-tête
     * Content-Length est rejeté en 400 par nginx avant d'atteindre le service.
     */
    recalculer: async (): Promise<RecalculResultat> => {
        const res = await api.post('/predictions/recalculer', {})
        return res.data
    },
}

export default predictionService
