/**
 * ShipmentMapView (WEB) — stub. react-native-maps est natif : sur le web on
 * affiche un message. Metro sélectionne ce fichier automatiquement pour la
 * cible web, ce qui évite d'inclure react-native-maps dans le bundle web.
 */
import { StyleSheet, Text, View } from "react-native"
import { colors, font, spacing } from "@/theme"

export type MapRegion = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }
type LatLng = { latitude: number; longitude: number }

export default function ShipmentMapView(_props: {
    region: MapRegion
    pos: LatLng | null
    heading: number
    destination: LatLng
    routePoints: LatLng[]
}) {
    return (
        <View style={styles.wrap}>
            <Text style={{ fontSize: 46, marginBottom: 10 }}>🗺️📱</Text>
            <Text style={styles.title}>Carte disponible sur mobile</Text>
            <Text style={styles.text}>
                La carte de navigation et le suivi GPS utilisent des fonctionnalités
                natives du téléphone. Ouvrez XPARK Driver sur Android / iOS (Expo Go)
                pour visualiser le trajet et démarrer le suivi.
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, backgroundColor: colors.bg },
    title: { fontSize: font.h3, fontWeight: "800", color: colors.text, marginBottom: 8 },
    text: { fontSize: font.small, color: colors.muted, textAlign: "center", lineHeight: 20, maxWidth: 420 },
})
