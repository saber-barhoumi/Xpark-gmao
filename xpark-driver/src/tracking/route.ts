/**
 * Itinéraire routier (OSRM) pour l'écran Navigation. Renvoie la polyligne à
 * tracer + la distance. Repli sur une ligne directe si OSRM est indisponible.
 */

import type { LatLng } from "./cities"

const OSRM = "https://router.project-osrm.org/route/v1/driving"

export interface RouteResult {
    points: LatLng[]
    distanceKm: number
    source: "osrm" | "fallback"
}

export async function getRoute(from: LatLng, to: LatLng): Promise<RouteResult> {
    try {
        const url = `${OSRM}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 8000)
        const res = await fetch(url, { signal: ctrl.signal })
        clearTimeout(timer)
        const data = await res.json()
        const route = data?.routes?.[0]
        if (!route?.geometry?.coordinates?.length) throw new Error("no geometry")
        return {
            points: route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })),
            distanceKm: route.distance / 1000,
            source: "osrm",
        }
    } catch {
        return { points: [from, to], distanceKm: haversineKm(from, to), source: "fallback" }
    }
}

export function haversineKm(a: LatLng, b: LatLng): number {
    const R = 6371, rad = (d: number) => (d * Math.PI) / 180
    const dLat = rad(b.latitude - a.latitude), dLng = rad(b.longitude - a.longitude)
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(h))
}
