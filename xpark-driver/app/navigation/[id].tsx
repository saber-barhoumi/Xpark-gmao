import { useEffect, useMemo, useRef, useState } from "react"
import { Alert, StyleSheet, Text, View } from "react-native"
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from "react-native-maps"
import * as Location from "expo-location"
import { useLocalSearchParams } from "expo-router"
import { useAuth } from "@/auth/AuthContext"
import { useMissions } from "@/hooks/useMissions"
import { resolveCity, type LatLng } from "@/tracking/cities"
import { getRoute, haversineKm, type RouteResult } from "@/tracking/route"
import { activeTrackedMissionId, startTracking, stopTracking } from "@/tracking/locationTask"
import { Button, Header } from "@/components/ui"
import { colors, font, radius, spacing } from "@/theme"

/**
 * Navigation — carte + position GPS temps réel + envoi au backend.
 *
 * L'affichage suit la position du téléphone (watchPositionAsync). Le bouton
 * « Démarrer la mission » lance la tâche d'arrière-plan (locationTask) qui
 * envoie chaque position à Mission.API → la carte du client se met à jour.
 */
export default function NavigationScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const missionId = Number(id)
    const { user } = useAuth()
    const { missions } = useMissions()
    const mission = useMemo(() => missions.find((m) => m.idMission === missionId), [missions, missionId])

    const [pos, setPos] = useState<LatLng | null>(null)
    const [speed, setSpeed] = useState(0)
    const [heading, setHeading] = useState(0)
    const [route, setRoute] = useState<RouteResult | null>(null)
    const [tracking, setTracking] = useState(false)
    const [busy, setBusy] = useState(false)
    const mapRef = useRef<MapView | null>(null)
    const watchRef = useRef<Location.LocationSubscription | null>(null)

    const destination = useMemo<LatLng>(
        () => resolveCity(mission?.villeArrivee || mission?.destination),
        [mission])

    // Position live + état de suivi
    useEffect(() => {
        let mounted = true
        ;(async () => {
            const perm = await Location.requestForegroundPermissionsAsync()
            if (perm.status !== "granted") {
                Alert.alert("Localisation", "Autorisez la localisation pour utiliser la navigation.")
                return
            }
            const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
            if (mounted) setPos({ latitude: first.coords.latitude, longitude: first.coords.longitude })

            watchRef.current = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
                (loc) => {
                    if (!mounted) return
                    setPos({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
                    if (loc.coords.speed != null && loc.coords.speed >= 0) setSpeed(loc.coords.speed * 3.6)
                    if (loc.coords.heading != null && loc.coords.heading >= 0) setHeading(loc.coords.heading)
                })
            const active = await activeTrackedMissionId()
            if (mounted) setTracking(active === missionId)
        })()
        return () => { mounted = false; watchRef.current?.remove() }
    }, [missionId])

    // Itinéraire (une fois la première position connue)
    useEffect(() => {
        if (!pos) return
        getRoute(pos, destination).then(setRoute)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [!!pos, destination.latitude])

    const remainingKm = pos ? haversineKm(pos, destination) : (mission?.distanceKm ?? 0)
    const etaMin = Math.max(0, Math.round((remainingKm / Math.max(speed || 45, 20)) * 60))

    const onToggle = async () => {
        if (!user) return
        setBusy(true)
        try {
            if (tracking) {
                await stopTracking()
                setTracking(false)
            } else {
                await startTracking(missionId, mission?.vehiculeId, user.token)
                setTracking(true)
                Alert.alert("Suivi démarré", "Votre position est maintenant partagée avec XPARK.")
            }
        } catch (e) {
            Alert.alert("Erreur", (e as Error).message)
        } finally {
            setBusy(false)
        }
    }

    const region: Region | undefined = pos
        ? { ...pos, latitudeDelta: 0.15, longitudeDelta: 0.15 }
        : { ...destination, latitudeDelta: 0.5, longitudeDelta: 0.5 }

    return (
        <View style={{ flex: 1, backgroundColor: colors.dark }}>
            <Header title="Navigation" subtitle={`Mission #${missionId} · ${mission?.villeArrivee || mission?.destination || ""}`} back />

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                initialRegion={region}
                showsUserLocation
                showsMyLocationButton
            >
                {route && (
                    <Polyline coordinates={route.points} strokeColor={colors.brand} strokeWidth={5} />
                )}
                <Marker coordinate={destination} title="Destination" description={mission?.villeArrivee || mission?.destination}>
                    <View style={styles.destPin}><Text style={{ fontSize: 16 }}>🏁</Text></View>
                </Marker>
                {pos && (
                    <Marker coordinate={pos} anchor={{ x: 0.5, y: 0.5 }} flat rotation={heading}>
                        <View style={styles.truck}><Text style={{ fontSize: 18 }}>🚚</Text></View>
                    </Marker>
                )}
            </MapView>

            {/* Panneau bas : métriques + bouton suivi */}
            <View style={styles.panel}>
                <View style={styles.metrics}>
                    <Metric label="Distance restante" value={`${remainingKm.toFixed(0)} km`} />
                    <Metric label="Vitesse" value={`${Math.round(speed)} km/h`} />
                    <Metric label="Arrivée (ETA)" value={etaMin > 0 ? `${etaMin} min` : "—"} />
                </View>
                {tracking && (
                    <View style={styles.liveRow}>
                        <View style={styles.dot} />
                        <Text style={styles.liveText}>Suivi actif — position partagée avec XPARK</Text>
                    </View>
                )}
                <Button
                    title={tracking ? "⏹️ Terminer le suivi" : "▶️ Démarrer la mission"}
                    variant={tracking ? "danger" : "success"}
                    onPress={onToggle}
                    loading={busy}
                />
            </View>
        </View>
    )
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.metric}>
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    panel: {
        backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
        padding: spacing.lg, gap: spacing.md, marginTop: -14,
    },
    metrics: { flexDirection: "row", gap: spacing.sm },
    metric: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, alignItems: "center", paddingVertical: spacing.md },
    metricValue: { fontSize: font.h3, fontWeight: "800", color: colors.text },
    metricLabel: { fontSize: font.tiny, color: colors.muted, marginTop: 2 },
    truck: { backgroundColor: colors.brand, borderRadius: 20, padding: 5, borderWidth: 2, borderColor: "#fff" },
    destPin: { backgroundColor: colors.success, borderRadius: 20, padding: 5, borderWidth: 2, borderColor: "#fff" },
    liveRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
    liveText: { color: colors.success, fontSize: font.small, fontWeight: "700" },
})
