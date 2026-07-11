import api from '@/lib/axiosConfig'
import employeeService from '@/services/employeeService'
import { missionService } from '@/services/missionService'
import { StatutMission } from '@/types/mission'

/**
 * Source de vérité UNIQUE de la disponibilité opérationnelle.
 *
 * Règle métier : un véhicule ou un chauffeur est disponible s'il est
 * DISPONIBLE côté flotte/RH **ET** qu'il n'a aucune mission EN_COURS.
 * Utilisé par le modal d'affectation ET par l'OptimisateurFlotteIA — les
 * deux écrans affichent donc toujours les mêmes chiffres, et le plan IA ne
 * propose jamais une ressource occupée (le serveur le refuserait de toute
 * façon : garde dans Mission.API Assign/Create).
 */

// Tolère les réponses paginées { data|items|results|value: [...] }
const toArray = (val: unknown): any[] => {
    if (Array.isArray(val)) return val
    if (val && typeof val === 'object') {
        const v = val as Record<string, unknown>
        for (const k of ['data', 'items', 'results', 'value']) {
            if (Array.isArray(v[k])) return v[k] as any[]
        }
    }
    return []
}

export interface RessourcesDisponibles {
    /** Véhicules DISPONIBLE sans mission EN_COURS (shape brute Fleet.API) */
    vehicules: any[]
    /** Chauffeurs DISPONIBLE sans mission EN_COURS (shape brute IAM.API) */
    chauffeurs: any[]
    /** Ids occupés (pour affichage/debug éventuel) */
    occupes: { vehiculeIds: Set<number>; employeeIds: Set<number> }
}

export async function getRessourcesDisponibles(): Promise<RessourcesDisponibles> {
    const [vRes, dRes, actives] = await Promise.all([
        api.get('/vehicules/disponibles'),
        employeeService.getAll({ post: 'CHAUFFEUR', statut: 'DISPONIBLE' }),
        missionService.getAll(StatutMission.EN_COURS).catch(() => []),
    ])

    const vehiculeIds = new Set<number>(
        toArray(actives).map((m: any) => m.vehiculeId).filter(Boolean))
    const employeeIds = new Set<number>(
        toArray(actives).map((m: any) => m.employeeId).filter(Boolean))

    return {
        vehicules: toArray(vRes.data).filter((v: any) => !vehiculeIds.has(v.idVehicule)),
        chauffeurs: toArray(dRes).filter((d: any) => !employeeIds.has(d.idEmployee)),
        occupes: { vehiculeIds, employeeIds },
    }
}

export default { getRessourcesDisponibles }
