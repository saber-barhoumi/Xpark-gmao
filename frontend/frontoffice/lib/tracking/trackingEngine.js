"use client"

/**
 * trackingEngine — cœur du suivi, VOLONTAIREMENT découplé de l'UI et du GPS.
 *
 * Modèle actuel : simulation déterministe fonction du temps. La position, la
 * vitesse, l'état, l'ETA et la progression sont dérivés de l'heure de départ,
 * de la route et d'un « planning » incluant des incidents réalistes (trafic,
 * arrêt). Comme tout est fonction pure de `now`, le mouvement est parfaitement
 * fluide (recalcul à chaque frame) et reproductible.
 *
 * Future compatibilité GPS : il suffira de fournir une `position` réelle à
 * `snapshotFromPosition()` — toute la dérivation (état, cap, restant, ETA,
 * timeline) est déjà factorisée ici. L'UI (carte, panneaux) ne change pas.
 */

import { bearing, haversineKm, pointAtDistance, projectOntoRoute } from "./geo"

// ── États du colis (couvre le cycle demandé) ────────────────────────────────
export const STATES = {
    WAITING:    { key: "WAITING",    label: "En attente d'enlèvement", color: "#b45309", icon: "📦" },
    ASSIGNED:   { key: "ASSIGNED",   label: "Chauffeur affecté",       color: "#0d6efd", icon: "🧑‍✈️" },
    LOADED:     { key: "LOADED",     label: "Chargement terminé",      color: "#6f42c1", icon: "🏗️" },
    DEPARTED:   { key: "DEPARTED",   label: "Départ effectué",         color: "#0d6efd", icon: "🚦" },
    IN_TRANSIT: { key: "IN_TRANSIT", label: "En route",                color: "#146c43", icon: "🚚" },
    TRAFFIC:    { key: "TRAFFIC",    label: "Ralentissement (trafic)", color: "#b45309", icon: "🚧" },
    STOP:       { key: "STOP",       label: "Arrêt temporaire",        color: "#6b7280", icon: "⏸️" },
    NEAR:       { key: "NEAR",       label: "Proche de la destination",color: "#0aa2c0", icon: "📍" },
    ARRIVED:    { key: "ARRIVED",    label: "Arrivé à destination",    color: "#146c43", icon: "🏁" },
    DELIVERED:  { key: "DELIVERED",  label: "Livraison terminée",      color: "#146c43", icon: "✅" },
    CANCELLED:  { key: "CANCELLED",  label: "Annulée",                 color: "#b02a37", icon: "✖️" },
}

// Segments du trajet : [fractionFin, vitesseKmh, état]. Un arrêt ponctuel est
// injecté séparément. Déterministe → même « scénario » pour une mission donnée.
const SEGMENTS = [
    [0.06, 30, "DEPARTED"],
    [0.40, 72, "IN_TRANSIT"],
    [0.50, 26, "TRAFFIC"],     // zone de trafic
    [0.61, 72, "IN_TRANSIT"],
    [0.88, 70, "IN_TRANSIT"],
    [0.97, 40, "NEAR"],
    [1.00, 18, "ARRIVED"],
]
const STOP_AT_FRAC = 0.61      // arrêt technique
const STOP_MINUTES = 8

/**
 * Construit le planning temps→distance (clés cumulées) avec incidents.
 * Retourne { keyframes:[{h,km,speed,state}], endH, totalKm }.
 */
function buildSchedule(totalKm) {
    const keyframes = [{ h: 0, km: 0, speed: SEGMENTS[0][1], state: "DEPARTED" }]
    let h = 0
    let prevFrac = 0
    for (const [frac, speed, state] of SEGMENTS) {
        const segKm = totalKm * (frac - prevFrac)
        h += segKm / speed
        keyframes.push({ h, km: totalKm * frac, speed, state })
        // Arrêt technique inséré juste après avoir franchi STOP_AT_FRAC
        if (prevFrac < STOP_AT_FRAC && frac >= STOP_AT_FRAC) {
            h += STOP_MINUTES / 60
            keyframes.push({ h, km: totalKm * STOP_AT_FRAC, speed: 0, state: "STOP" })
        }
        prevFrac = frac
    }
    keyframes.sort((a, b) => a.h - b.h)
    return { keyframes, endH: h, totalKm }
}

/** Interpole distance parcourue + vitesse + état à partir des heures écoulées. */
function coveredAt(schedule, elapsedH) {
    const kf = schedule.keyframes
    if (elapsedH <= 0) return { km: 0, speed: 0, state: "DEPARTED" }
    if (elapsedH >= schedule.endH) return { km: schedule.totalKm, speed: 0, state: "ARRIVED" }
    let i = 0
    while (i < kf.length - 1 && kf[i + 1].h < elapsedH) i++
    const a = kf[i], b = kf[i + 1]
    const span = b.h - a.h || 1e-9
    const frac = (elapsedH - a.h) / span
    return {
        km: a.km + (b.km - a.km) * frac,
        speed: b.speed,          // vitesse du segment en cours
        state: b.state,
    }
}

// ── Fabrique du moteur ──────────────────────────────────────────────────────

export function createEngine({ mission, route }) {
    const totalKm = route.totalKm || mission.distanceKm || Math.max(1,
        haversineKm(route.points[0], route.points[route.points.length - 1]))
    const schedule = buildSchedule(totalKm)
    const pickup = route.points[0]
    const destination = route.points[route.points.length - 1]
    const departMs = new Date(mission.dateDepart).getTime()
    const hasDriver = !!(mission.chauffeurNom || mission.vehiculeImmatriculation || mission.employeeId)

    /** Dérive un instantané complet à l'instant `nowMs`. */
    function snapshotAt(nowMs) {
        const statut = mission.statut

        // Terminaux
        if (statut === "ANNULEE") {
            return base(STATES.CANCELLED, pickup, 0, 0, totalKm, 0, 0, null)
        }
        if (statut === "TERMINEE") {
            return base(STATES.DELIVERED, destination, 100, totalKm, totalKm, 0, 0,
                mission.dateRetour ? new Date(mission.dateRetour) : null,
                route.points.length - 1, lastBearing())
        }
        if (statut === "EN_ATTENTE") {
            const st = hasDriver ? STATES.ASSIGNED : STATES.WAITING
            const etaMs = departMs + schedule.endH * 3600_000
            const remMin = Math.max(0, Math.round((etaMs - nowMs) / 60_000))
            return base(st, pickup, 0, 0, totalKm, 0, remMin, new Date(etaMs), 0, firstBearing())
        }

        // EN_COURS
        const elapsedH = (nowMs - departMs) / 3600_000
        const { km, speed, state } = coveredAt(schedule, elapsedH)
        const pos = pointAtDistance(route.points, route.cum, km)
        const progress = Math.min(100, (km / totalKm) * 100)
        const etaMs = departMs + schedule.endH * 3600_000
        const remMin = Math.max(0, Math.round((etaMs - nowMs) / 60_000))
        const st = STATES[state] || STATES.IN_TRANSIT
        return base(st, pos.position, progress, km, totalKm, speed, remMin,
            new Date(etaMs), pos.index, pos.bearing)
    }

    function base(state, position, progress, traveledKm, total, speedKmh, remainingMin, etaDate, index = 0, brng = 0) {
        return {
            state, position, progress,
            traveledKm, remainingKm: Math.max(0, total - traveledKm), totalKm: total,
            speedKmh, remainingMin, etaDate, index, bearing: brng,
        }
    }
    const firstBearing = () => route.points.length > 1 ? bearing(route.points[0], route.points[1]) : 0
    const lastBearing = () => route.points.length > 1
        ? bearing(route.points[route.points.length - 2], route.points[route.points.length - 1]) : 0

    /**
     * Timeline d'événements (confirmé → affecté → chargé → départ →
     * checkpoints → incident → proche → livré) avec statut done/pending.
     */
    function buildTimeline(nowMs) {
        const created = mission.dateCreation ? new Date(mission.dateCreation).getTime() : departMs - 3600_000
        const snap = snapshotAt(nowMs)
        const prog = snap.progress
        const delivered = mission.statut === "TERMINEE"
        const etaMs = departMs + schedule.endH * 3600_000

        const at = (frac) => new Date(departMs + schedule.endH * 3600_000 * frac)
        const evt = (icon, title, desc, time, done) => ({ icon, title, desc, time, done })

        const items = [
            evt("📝", "Commande confirmée", "Votre demande de transport a été enregistrée.",
                new Date(created), true),
            evt("🧑‍✈️", "Chauffeur affecté",
                mission.chauffeurNom ? `${mission.chauffeurNom} prend en charge la mission.` : "Un chauffeur a été assigné.",
                new Date(departMs - 900_000), hasDriver || mission.statut === "EN_COURS" || delivered),
            evt("🏗️", "Marchandises chargées", "Le chargement est terminé, prêt au départ.",
                new Date(departMs - 300_000), mission.statut === "EN_COURS" || delivered),
            evt("🚦", "Départ", `Départ de ${mission.villeDepart || "l'entrepôt"}.`,
                new Date(departMs), mission.statut === "EN_COURS" || delivered),
            evt("📍", "Checkpoint — 25%", "Premier quart du trajet parcouru.",
                at(0.25 * (schedule.endH / schedule.endH)), prog >= 25 || delivered),
            evt("🚧", "Ralentissement trafic", "Ralentissement détecté sur l'itinéraire.",
                at(0.45), prog >= 45 || delivered),
            evt("📍", "Checkpoint — 50%", "Mi-parcours atteint.",
                at(0.5), prog >= 50 || delivered),
            evt("⏸️", "Arrêt technique", "Courte pause réglementaire du chauffeur.",
                at(0.61), prog >= 61 || delivered),
            evt("📍", "Proche de la destination", `Approche de ${mission.villeArrivee || mission.destination}.`,
                at(0.9), prog >= 88 || delivered),
            evt("✅", "Livraison effectuée", "Marchandises livrées au destinataire.",
                delivered && mission.dateRetour ? new Date(mission.dateRetour) : new Date(etaMs), delivered),
        ]
        return items
    }

    /**
     * ★ Point d'entrée GPS RÉEL : convertit une position mesurée par le
     * téléphone du chauffeur en instantané complet (même forme que snapshotAt).
     * C'est ce qui rend le module « prêt pour le GPS » : l'UI (carte, panneaux)
     * ne fait aucune différence entre simulation et position réelle.
     *
     * fix = { latitude, longitude, speedKmh?, heading?, recordedAt? }
     */
    function snapshotFromPosition(fix, nowMs = Date.now()) {
        const proj = projectOntoRoute(route.points, route.cum, [fix.latitude, fix.longitude])
        const covered = proj.coveredKm
        const progress = Math.min(100, (covered / totalKm) * 100)
        const remainingKm = Math.max(0, totalKm - covered)
        const speed = fix.speedKmh != null && fix.speedKmh >= 0 ? fix.speedKmh : 60
        const remMin = Math.max(0, Math.round(remainingKm / Math.max(speed, 20) * 60))
        const etaDate = new Date(nowMs + remMin * 60_000)
        const brng = fix.heading != null ? fix.heading : proj.bearing

        let state = STATES.IN_TRANSIT
        if (mission.statut === "TERMINEE" || progress >= 99.5) state = mission.statut === "TERMINEE" ? STATES.DELIVERED : STATES.ARRIVED
        else if (progress >= 88) state = STATES.NEAR
        else if (speed < 3) state = STATES.STOP
        else if (speed < 35) state = STATES.TRAFFIC

        return base(state, proj.position, progress, covered, totalKm, speed, remMin, etaDate, proj.index, brng)
    }

    return { route, pickup, destination, totalKm, snapshotAt, snapshotFromPosition, buildTimeline }
}
