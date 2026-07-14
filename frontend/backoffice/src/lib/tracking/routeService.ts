/**
 * routeService — géométrie routière entre deux points.
 *
 * Essaie OSRM (routes réelles) ; en cas d'indisponibilité, repli sur une
 * polyligne légèrement incurvée. Résultat mis en cache par paire de coordonnées.
 *
 * Porté à l'identique depuis le portail client
 * (frontoffice/lib/tracking/routeService.js).
 *
 * Contrat de sortie : { points: [[lat,lng]...], cum: [km...], totalKm, source }
 */

import { cumulativeKm, haversineKm, lerp, type LatLng } from './geo'

export interface RouteResult {
    points: LatLng[]
    cum: number[]
    totalKm: number
    source: 'osrm' | 'fallback'
}

const OSRM = 'https://router.project-osrm.org/route/v1/driving'
const cache = new Map<string, RouteResult>()

const key = (a: LatLng, b: LatLng) =>
    `${a[0].toFixed(4)},${a[1].toFixed(4)}|${b[0].toFixed(4)},${b[1].toFixed(4)}`

/** Polyligne de repli : ligne incurvée (arc doux) entre deux points. */
function fallbackRoute(from: LatLng, to: LatLng): RouteResult {
    const N = 40
    const dist = haversineKm(from, to)
    const bow = Math.min(dist * 0.06, 0.25)
    const mid = lerp(from, to, 0.5)
    const dLat = to[0] - from[0]
    const dLng = to[1] - from[1]
    const len = Math.hypot(dLat, dLng) || 1e-9
    const perp: LatLng = [-dLng / len, dLat / len] // normale unitaire
    const control: LatLng = [mid[0] + perp[0] * bow, mid[1] + perp[1] * bow]

    const points: LatLng[] = []
    for (let i = 0; i <= N; i++) {
        const t = i / N
        // Bézier quadratique from → control → to
        const a = lerp(from, control, t)
        const b = lerp(control, to, t)
        points.push(lerp(a, b, t))
    }
    const cum = cumulativeKm(points)
    return { points, cum, totalKm: cum[cum.length - 1], source: 'fallback' }
}

async function fetchOsrm(from: LatLng, to: LatLng, signal: AbortSignal): Promise<RouteResult> {
    const url = `${OSRM}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`OSRM ${res.status}`)
    const data = await res.json()
    const route = data?.routes?.[0]
    if (!route?.geometry?.coordinates?.length) throw new Error('OSRM: pas de géométrie')
    const points: LatLng[] = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng])
    const cum = cumulativeKm(points)
    return { points, cum, totalKm: route.distance / 1000, source: 'osrm' }
}

/** Récupère la route entre deux villes [lat,lng]. Ne rejette jamais. */
export async function getRoute(from: LatLng, to: LatLng): Promise<RouteResult> {
    const k = key(from, to)
    const cached = cache.get(k)
    if (cached) return cached

    let result: RouteResult
    try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 6000)
        result = await fetchOsrm(from, to, ctrl.signal)
        clearTimeout(timer)
    } catch {
        result = fallbackRoute(from, to)
    }
    cache.set(k, result)
    return result
}
