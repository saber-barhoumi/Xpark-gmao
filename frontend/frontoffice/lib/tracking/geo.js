"use client"

/**
 * Utilitaires géographiques du module de suivi (aucune dépendance).
 * Coordonnées au format [lat, lng] partout dans le module tracking.
 */

const R = 6371 // rayon terrestre (km)
const rad = (d) => (d * Math.PI) / 180
const deg = (r) => (r * 180) / Math.PI

/** Distance haversine en km entre deux points [lat,lng]. */
export function haversineKm(a, b) {
    const dLat = rad(b[0] - a[0])
    const dLng = rad(b[1] - a[1])
    const lat1 = rad(a[0])
    const lat2 = rad(b[0])
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(h))
}

/** Cap (bearing) en degrés 0..360 de a vers b (0 = Nord). */
export function bearing(a, b) {
    const y = Math.sin(rad(b[1] - a[1])) * Math.cos(rad(b[0]))
    const x = Math.cos(rad(a[0])) * Math.sin(rad(b[0])) -
        Math.sin(rad(a[0])) * Math.cos(rad(b[0])) * Math.cos(rad(b[1] - a[1]))
    return (deg(Math.atan2(y, x)) + 360) % 360
}

/** Interpolation linéaire entre deux points [lat,lng] (frac 0..1). */
export function lerp(a, b, frac) {
    return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac]
}

/** Distances cumulées (km) le long d'une polyligne de points [lat,lng]. */
export function cumulativeKm(points) {
    const cum = [0]
    for (let i = 1; i < points.length; i++) {
        cum.push(cum[i - 1] + haversineKm(points[i - 1], points[i]))
    }
    return cum
}

/**
 * Projette un point GPS [lat,lng] sur la polyligne (accroche à la route).
 * Retourne le point projeté, l'index de segment, la distance parcourue (km)
 * jusqu'à la projection et le cap du segment. Sert à convertir une position
 * GPS réelle en progression/ETA (voir trackingEngine.snapshotFromPosition).
 */
export function projectOntoRoute(points, cum, target) {
    if (points.length < 2) return { position: points[0] ?? target, index: 0, coveredKm: 0, bearing: 0 }
    const kx = Math.cos(rad(target[0])) // correction longitude à cette latitude
    let best = { d2: Infinity, index: 0, t: 0 }
    for (let i = 0; i < points.length - 1; i++) {
        const ax = points[i][1] * kx, ay = points[i][0]
        const bx = points[i + 1][1] * kx, by = points[i + 1][0]
        const px = target[1] * kx, py = target[0]
        const dx = bx - ax, dy = by - ay
        const len2 = dx * dx + dy * dy || 1e-12
        let t = ((px - ax) * dx + (py - ay) * dy) / len2
        t = Math.max(0, Math.min(1, t))
        const cx = ax + dx * t, cy = ay + dy * t
        const d2 = (px - cx) ** 2 + (py - cy) ** 2
        if (d2 < best.d2) best = { d2, index: i, t }
    }
    const i = best.index
    const position = lerp(points[i], points[i + 1], best.t)
    const coveredKm = cum[i] + haversineKm(points[i], position)
    return { position, index: i, coveredKm, bearing: bearing(points[i], points[i + 1]) }
}

/**
 * Position le long d'une polyligne à une distance parcourue donnée (km).
 * Retourne la position interpolée, l'index du segment courant et le cap.
 */
export function pointAtDistance(points, cum, distanceKm) {
    const total = cum[cum.length - 1]
    const d = Math.max(0, Math.min(distanceKm, total))
    if (points.length < 2) return { position: points[0] ?? [0, 0], index: 0, bearing: 0 }

    let i = 0
    while (i < cum.length - 2 && cum[i + 1] < d) i++
    const segLen = cum[i + 1] - cum[i] || 1e-9
    const frac = (d - cum[i]) / segLen
    return {
        position: lerp(points[i], points[i + 1], frac),
        index: i,
        bearing: bearing(points[i], points[i + 1]),
    }
}
