/**
 * RBAC de la page Analyses — qui voit quoi.
 *
 * Direction (ADMIN / ADMINISTRATEUR / GESTIONNAIRE) : tout, y compris les
 * analyses financières privées, le recalcul des KPIs, l'export PDF et le partage.
 * TECHNICIEN : opérations + maintenance + état de flotte (jamais les montants).
 * CHAUFFEUR  : opérations uniquement (volumes de missions, aucun montant TND).
 */

export type AppRole =
  | 'ADMIN' | 'ADMINISTRATEUR' | 'GESTIONNAIRE'
  | 'CHAUFFEUR' | 'TECHNICIEN' | 'CLIENT' | string

export interface AnalyticsPermissions {
  /** Analyses financières privées : revenus, coûts, marges (direction) */
  finance: boolean
  /** État et disponibilité de la flotte */
  fleet: boolean
  /** Interventions & maintenance */
  maintenance: boolean
  /** Coûts carburant (montants) */
  fuel: boolean
  /** Volumes opérationnels : missions, statuts, distances (sans montants) */
  operations: boolean
  /** Bouton « Recalculer les KPIs » */
  recalculate: boolean
  /** Export PDF + partage du rapport */
  export: boolean
}

const DIRECTION: AppRole[] = ['ADMIN', 'ADMINISTRATEUR', 'GESTIONNAIRE']

const NONE: AnalyticsPermissions = {
  finance: false, fleet: false, maintenance: false, fuel: false,
  operations: false, recalculate: false, export: false,
}

export function permissionsFor(role?: AppRole | null): AnalyticsPermissions {
  if (!role) return NONE

  if (DIRECTION.includes(role)) {
    return { finance: true, fleet: true, maintenance: true, fuel: true,
      operations: true, recalculate: true, export: true }
  }

  if (role === 'TECHNICIEN') {
    return { ...NONE, operations: true, fleet: true, maintenance: true }
  }

  if (role === 'CHAUFFEUR') {
    return { ...NONE, operations: true }
  }

  return NONE
}

export const isDirection = (role?: AppRole | null): boolean =>
  !!role && DIRECTION.includes(role)
