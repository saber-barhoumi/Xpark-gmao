/**
 * locationTask — suivi GPS (le cœur de XPARK Driver).
 *
 * Deux modes selon la plateforme :
 *
 *  • NATIF (téléphone) — suivi en ARRIÈRE-PLAN via `expo-task-manager` :
 *    la tâche continue même app en arrière-plan / écran verrouillé (indispensable :
 *    le chauffeur ne garde pas l'app au premier plan en conduisant). La tâche
 *    s'exécute dans un contexte séparé de React → la config active (jeton,
 *    missionId, véhicule) est persistée dans AsyncStorage et relue à chaque
 *    position.
 *
 *  • WEB (navigateur, pour le test/démo) — `expo-task-manager` et les fonctions
 *    background d'`expo-location` n'existent PAS sur le web. On retombe alors sur
 *    un suivi au PREMIER PLAN via `watchPositionAsync` (API Geolocation du
 *    navigateur) : la boucle GPS reste testable depuis un PC, mais s'arrête si
 *    l'onglet est fermé (pas de background possible sur le web).
 *
 * Dans les deux cas : chaque position part vers le backend via POST /tracking/ping.
 * Un échec réseau n'interrompt pas le suivi (mobile intermittent).
 *
 * Flux : GPS → cette tâche → Mission.API → carte client Front Office.
 */

import { Platform } from "react-native"
import * as Location from "expo-location"
import * as TaskManager from "expo-task-manager"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { sendPing } from "@/api/tracking"

export const LOCATION_TASK = "xpark-location-task"
const CFG_KEY = "xpark_tracking_cfg"

const isWeb = Platform.OS === "web"
const PING_INTERVAL_SEC = Number(process.env.EXPO_PUBLIC_PING_INTERVAL_SEC ?? 5)
const PING_DISTANCE_M = Number(process.env.EXPO_PUBLIC_PING_DISTANCE_M ?? 25)

interface TrackingConfig {
    token: string
    missionId: number
    vehiculeId?: number
}

/** Envoie une position GPS au backend (logique partagée natif/web). */
async function pingFromLocation(cfg: TrackingConfig, loc: Location.LocationObject): Promise<void> {
    const { coords, timestamp } = loc
    await sendPing(cfg.token, {
        missionId: cfg.missionId,
        vehiculeId: cfg.vehiculeId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        // vitesse en m/s → km/h (négatif = inconnu)
        speedKmh: coords.speed != null && coords.speed >= 0 ? coords.speed * 3.6 : undefined,
        heading: coords.heading != null && coords.heading >= 0 ? coords.heading : undefined,
        accuracy: coords.accuracy ?? undefined,
        recordedAt: new Date(timestamp).toISOString(),
    })
}

// ── Tâche background : NATIF UNIQUEMENT (TaskManager absent sur le web) ────────
if (!isWeb) {
    TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
        if (error) {
            console.warn("[locationTask] erreur :", error.message)
            return
        }
        const { locations } = (data ?? {}) as { locations?: Location.LocationObject[] }
        if (!locations?.length) return

        const raw = await AsyncStorage.getItem(CFG_KEY)
        if (!raw) return
        const cfg: TrackingConfig = JSON.parse(raw)

        for (const loc of locations) {
            await pingFromLocation(cfg, loc)
        }
    })
}

// ── Suivi au premier plan (web) : navigator.geolocation via watchPositionAsync ─
let webWatch: Location.LocationSubscription | null = null
let webMissionId: number | null = null

async function startWebTracking(cfg: TrackingConfig): Promise<void> {
    const fg = await Location.requestForegroundPermissionsAsync()
    if (fg.status !== "granted") {
        throw new Error("Permission de localisation refusée. Activez-la pour démarrer la mission.")
    }
    await AsyncStorage.setItem(CFG_KEY, JSON.stringify(cfg))

    if (webWatch) { webWatch.remove(); webWatch = null }
    webMissionId = cfg.missionId
    webWatch = await Location.watchPositionAsync(
        {
            accuracy: Location.Accuracy.High,
            timeInterval: PING_INTERVAL_SEC * 1000,
            distanceInterval: PING_DISTANCE_M,
        },
        (loc) => { pingFromLocation(cfg, loc).catch(() => { /* réseau intermittent */ }) },
    )
}

async function stopWebTracking(): Promise<void> {
    if (webWatch) { webWatch.remove(); webWatch = null }
    webMissionId = null
    await AsyncStorage.removeItem(CFG_KEY)
}

// ── API publique ──────────────────────────────────────────────────────────────

/** Démarre le suivi pour une mission. Demande les permissions nécessaires. */
export async function startTracking(missionId: number, vehiculeId: number | undefined, token: string): Promise<void> {
    const cfg: TrackingConfig = { token, missionId, vehiculeId }
    if (isWeb) return startWebTracking(cfg)

    const fg = await Location.requestForegroundPermissionsAsync()
    if (fg.status !== "granted") {
        throw new Error("Permission de localisation refusée. Activez-la pour démarrer la mission.")
    }
    // La permission « arrière-plan » peut être refusée : le suivi fonctionne
    // alors au premier plan uniquement. On ne bloque pas.
    try { await Location.requestBackgroundPermissionsAsync() } catch { /* ignore */ }

    await AsyncStorage.setItem(CFG_KEY, JSON.stringify(cfg))

    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK)
    }
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: PING_INTERVAL_SEC * 1000,
        distanceInterval: PING_DISTANCE_M,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
            notificationTitle: "XPARK Driver — mission en cours",
            notificationBody: "Votre position est partagée avec XPARK pendant la livraison.",
            notificationColor: "#C11425",
        },
    })
}

/** Arrête le suivi et efface la configuration active. */
export async function stopTracking(): Promise<void> {
    if (isWeb) return stopWebTracking()

    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK)
    }
    await AsyncStorage.removeItem(CFG_KEY)
}

/** Mission actuellement suivie (ou null). Sert à restaurer l'état de l'UI. */
export async function activeTrackedMissionId(): Promise<number | null> {
    // Sur le web le suivi est au premier plan : il ne survit pas à un rafraîchissement,
    // donc l'état en mémoire est la source de vérité.
    if (isWeb) return webMissionId

    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)
    if (!started) return null
    const raw = await AsyncStorage.getItem(CFG_KEY)
    return raw ? (JSON.parse(raw) as TrackingConfig).missionId : null
}
