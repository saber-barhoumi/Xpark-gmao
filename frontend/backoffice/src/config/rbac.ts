/**
 * RBAC — source unique des groupes de rôles côté back-office.
 *
 * Les rôles réels et leurs permissions par route vivent dans
 * `routes/index.ts` (`AppRoute.allowedRoles`) — c'est la seule table à
 * tenir à jour. La barre latérale (`helpers/Manu.ts`) dérive sa propre
 * visibilité de cette même table (via l'URL de chaque lien), donc la
 * navigation et la protection de route ne peuvent pas diverger.
 *
 * Absence de `allowedRoles` sur une route = accessible à tout utilisateur
 * connecté (pages personnelles : dashboard, profil, sécurité, FAQ...).
 */

export type AppRole =
  | 'ADMIN' | 'ADMINISTRATEUR' | 'GESTIONNAIRE'
  | 'TECHNICIEN' | 'CHAUFFEUR' | 'CLIENT' | string

/** Direction — accès large à la gestion opérationnelle et financière. */
export const STAFF: AppRole[] = ['ADMIN', 'ADMINISTRATEUR', 'GESTIONNAIRE']

/** STAFF + terrain technique (maintenance, flotte, tâches, messagerie interne). */
export const OPS: AppRole[] = [...STAFF, 'TECHNICIEN']

/** Un rôle est autorisé si la liste est vide/absente, ou s'il y figure (insensible à la casse). */
export function roleMatches(allowedRoles: string[] | undefined, role?: string | null): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true
  if (!role) return false
  const upper = role.toUpperCase()
  return allowedRoles.some(r => r.toUpperCase() === upper)
}
