import { OptimizePlan, OptimizeRequest } from '../types/optimizer';

const OPTIMIZER_API = import.meta.env.VITE_OPTIMIZER_API_URL ?? 'http://localhost:8001';

export const optimizerService = {
    /** Lance l'optimisation d'affectation (OptimisateurFlotteIA — Greedy + GA + Local Search) */
    optimize: async (payload: OptimizeRequest): Promise<OptimizePlan> => {
        const res = await fetch(`${OPTIMIZER_API}/optimize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const detail = await res.json().catch(() => null);
            throw new Error(detail?.detail || `Optimiseur indisponible (HTTP ${res.status})`);
        }
        return res.json();
    },

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
