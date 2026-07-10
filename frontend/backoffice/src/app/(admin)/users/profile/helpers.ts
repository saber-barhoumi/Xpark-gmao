/** Helpers partagés des composants du profil (temps relatif FR, URLs photos). */

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000'

/** URL absolue d'une photo stockée par l'API (chemin relatif /uploads/…) */
export const photoUrl = (path?: string | null): string | null =>
  path ? `${API_URL.replace('/api', '')}${path}` : null

/** Initiales pour l'avatar de secours */
export const initials = (prenom = '', nom = '') =>
  `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase() || '–'

/** Temps relatif en français : « il y a 5 min », « il y a 3 h », « hier »… */
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const j = Math.floor(h / 24)
  if (j === 1) return 'hier'
  if (j < 7) return `il y a ${j} jours`
  return new Date(iso).toLocaleDateString('fr-FR')
}

/** Date + heure courtes en français */
export const dateTimeFr = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '—'

/** Navigateur + OS lisibles depuis le user-agent (pour l'activité de connexion) */
export function readableAgent(ua?: string): string {
  if (!ua) return 'Appareil inconnu'
  const browser =
    ua.includes('Edg/') ? 'Edge' :
    ua.includes('Chrome/') ? 'Chrome' :
    ua.includes('Firefox/') ? 'Firefox' :
    ua.includes('Safari/') ? 'Safari' : 'Navigateur'
  const os =
    ua.includes('Windows') ? 'Windows' :
    ua.includes('Mac OS') ? 'macOS' :
    ua.includes('Android') ? 'Android' :
    ua.includes('iPhone') || ua.includes('iPad') ? 'iOS' :
    ua.includes('Linux') ? 'Linux' : ''
  return os ? `${browser} · ${os}` : browser
}
