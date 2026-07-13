"use client"

/**
 * routeService — géométrie routière entre deux points.
 *
 * Essaie OSRM (routes réelles sur le réseau routier) ; en cas d'indisponibilité
 * ou de délai, repli sur une polyligne légèrement incurvée (jamais une ligne
 * plate). Le résultat est mis en cache par paire de coordonnées.
 *
 * Contrat de sortie (stable, réutilisable par un futur fournisseur GPS) :
 *   { points: [[lat,lng]...], cum: [km...], totalKm, source: 'osrm'|'fallback' }
 */

import { cumulativeKm, haversineKm, lerp } from "./geo"

const OSRM = "https://router.project-osrm.org/route/v1/driving"
const cache = new Map()

const key = (a, b) => `${a[0].toFixed(4)},${a[1].toFixed(4)}|${b[0].toFixed(4)},${b[1].toFixed(4)}`

/** Polyligne de repli : ligne incurvée (arc doux) entre deux points. */
function fallbackRoute(from, to) {
    const N = 40
    const dist = haversineKm(from, to)
    // Flèche perpendiculaire proportionnelle (courbe douce, aspect « route »)
    const bow = Math.min(dist * 0.06, 0.25)
    const mid = lerp(from, to, 0.5)
    const dLat = to[0] - from[0]
    const dLng = to[1] - from[1]
    const len = Math.hypot(dLat, dLng) || 1e-9
    const perp = [-dLng / len, dLat / len] // normale unitaire
    const control = [mid[0] + perp[0] * bow, mid[1] + perp[1] * bow]

    const points = []
    for (let i = 0; i <= N; i++) {
        const t = i / N
        // Bézier quadratique from → control → to
        const a = lerp(from, control, t)
        const b = lerp(control, to, t)
        points.push(lerp(a, b, t))
    }
    const cum = cumulativeKm(points)
    return { points, cum, totalKm: cum[cum.length - 1], source: "fallback" }
}

async function fetchOsrm(from, to, signal) {
    const url = `${OSRM}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`OSRM ${res.status}`)
    const data = await res.json()
    const route = data?.routes?.[0]
    if (!route?.geometry?.coordinates?.length) throw new Error("OSRM: pas de géométrie")
    const points = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]) // → [lat,lng]
    const cum = cumulativeKm(points)
    return { points, cum, totalKm: route.distance / 1000, source: "osrm" }
}

/** Récupère la route entre deux villes [lat,lng]. Ne rejette jamais. */
export async function getRoute(from, to) {
    const k = key(from, to)
    if (cache.has(k)) return cache.get(k)

    let result
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
