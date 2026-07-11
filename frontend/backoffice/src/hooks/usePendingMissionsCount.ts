import { useEffect, useState } from 'react'
import authService from '@/services/authService'
import missionService from '@/services/missionService'
import { StatutMission } from '@/types/mission'

const STAFF_ROLES = ['ADMIN', 'ADMINISTRATEUR', 'GESTIONNAIRE']
const REFRESH_MS = 60_000

/**
 * Nombre de missions EN_ATTENTE (demandes clients à affecter) — affiché en
 * badge sur l'entrée « Missions » de la sidebar pour que l'admin voie les
 * nouvelles demandes sans ouvrir la page. Rafraîchi toutes les 60 s et lors
 * du retour sur l'onglet (focus).
 */
export function usePendingMissionsCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const role = authService.getCurrentUser()?.role
    if (!role || !STAFF_ROLES.includes(role)) return

    let alive = true
    const load = () =>
      missionService.getAll(StatutMission.EN_ATTENTE)
        .then(list => { if (alive) setCount(Array.isArray(list) ? list.length : 0) })
        .catch(() => { /* silencieux : le badge n'est pas critique */ })

    load()
    const timer = setInterval(load, REFRESH_MS)
    window.addEventListener('focus', load)
    return () => {
      alive = false
      clearInterval(timer)
      window.removeEventListener('focus', load)
    }
  }, [])

  return count
}
