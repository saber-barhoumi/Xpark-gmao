/**
 * ShipmentMapView (NATIF) — encapsule react-native-maps.
 *
 * Pourquoi un composant séparé : react-native-maps est natif (Android/iOS) et
 * casse le bundle web. En isolant la carte ici, Metro résout automatiquement la
 * variante `.web.tsx` (stub) sur le web et ce fichier sur mobile — sans jamais
 * inclure react-native-maps dans le graphe web. L'écran Navigation reste unique.
 */
import { StyleSheet, Text, View } from "react-native"
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps"
import { colors } from "@/theme"

export type MapRegion = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }
type LatLng = { latitude: number; longitude: number }

export default function ShipmentMapView({
    region, pos, heading, destination, routePoints,
}: {
    region: MapRegion
    pos: LatLng | null
    heading: number
    destination: LatLng
    routePoints: LatLng[]
}) {
    return (
        <MapView
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton
        >
            {routePoints.length > 0 && (
                <Polyline coordinates={routePoints} strokeColor={colors.brand} strokeWidth={5} />
            )}
            <Marker coordinate={destination} title="Destination">
                <View style={styles.destPin}><Text style={{ fontSize: 16 }}>🏁</Text></View>
            </Marker>
            {pos && (
                <Marker coordinate={pos} anchor={{ x: 0.5, y: 0.5 }} flat rotation={heading}>
                    <View style={styles.truck}><Text style={{ fontSize: 18 }}>🚚</Text></View>
                </Marker>
            )}
        </MapView>
    )
}

const styles = StyleSheet.create({
    truck: { backgroundColor: colors.brand, borderRadius: 20, padding: 5, borderWidth: 2, borderColor: "#fff" },
    destPin: { backgroundColor: colors.success, borderRadius: 20, padding: 5, borderWidth: 2, borderColor: "#fff" },
})
