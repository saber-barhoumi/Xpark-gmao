import api from '@/lib/axiosConfig';
import { OptimizePlan, OptimizerDriver, OptimizerVehicle } from '../types/optimizer';

// Direct URL of the FastAPI service — only used for the health indicator.
// The optimization itself flows through Mission.API + RabbitMQ (event-driven).
const OPTIMIZER_API = import.meta.env.VITE_OPTIMIZER_API_URL ?? 'http://localhost:8001';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const optimizerService = {
    /**
     * Déclenche une optimisation via le bus d'événements (FICHE §2.3) :
     *   POST /api/missions/optimize
     *     → Mission.API publie xpark.missions.ready-for-optimization (RabbitMQ)
     *     → OptimisateurFlotteIA calcule et publie xpark.optimization.plan-generated
     *     → Mission.API stocke le plan ; on le récupère par polling.
     */
    requestOptimization: async (vehicles: OptimizerVehicle[], drivers: OptimizerDriver[]): Promise<string> => {
        const res = await api.post('/missions/optimize', { vehicles, drivers });
        return res.data.batchId;
    },

    /** Retourne le plan si disponible, null tant que le calcul est en cours (HTTP 202). */
    getPlan: async (batchId: string): Promise<OptimizePlan | null> => {
        const res = await api.get(`/missions/optimize/${batchId}`);
        if (res.status === 202) return null;
        return res.data;
    },

    /** Flux complet : déclenchement + polling jusqu'à réception du plan. */
    optimize: async (
        vehicles: OptimizerVehicle[],
        drivers: OptimizerDriver[],
        { timeoutMs = 30_000, intervalMs = 1_000 } = {},
    ): Promise<OptimizePlan> => {
        const batchId = await optimizerService.requestOptimization(vehicles, drivers);
        const deadline = Date.now() + timeoutMs;

        while (Date.now() < deadline) {
            await sleep(intervalMs);
            const plan = await optimizerService.getPlan(batchId);
            if (plan) {
                // L'optimiseur publie { batchId, error } en cas d'échec (§9.3)
                if ((plan as any).error) throw new Error((plan as any).error);
                return plan;
            }
        }
        throw new Error("Délai dépassé — aucun plan reçu du bus d'événements (RabbitMQ).");
    },

    /** Health check direct du service FastAPI (indicateur d'état sur la page). */
    health: async (): Promise<boolean> => {
        try {
            const res = await fetch(`${OPTIMIZER_API}/health`);
            return res.ok;
        } catch {
            return false;
        }
    },
};

export default optimizerService;
