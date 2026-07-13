import { Linking, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useMissions } from "@/hooks/useMissions"
import { Button, Card, Header } from "@/components/ui"
import { colors, font, spacing } from "@/theme"

/**
 * Variante WEB de l'écran Navigation.
 *
 * `react-native-maps` est un module NATIF (Android/iOS) : il ne fonctionne pas
 * dans un navigateur. Metro sélectionne automatiquement ce fichier `.web.tsx`
 * sur la cible web et le `.tsx` (avec la carte) sur mobile. La navigation GPS
 * temps réel se fait donc sur l'app mobile (Expo Go / Android / iOS).
 */
export default function NavigationWeb() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const { missions } = useMissions()
    const m = missions.find((x) => String(x.idMission) === String(id))

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <Header title="Navigation" subtitle={`Mission #${id}`} back />
            <View style={styles.body}>
                <Card style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 46, marginBottom: 10 }}>🗺️📱</Text>
                    <Text style={styles.title}>Carte disponible sur mobile</Text>
                    <Text style={styles.text}>
                        La navigation GPS temps réel (carte, position du camion, suivi en
                        arrière-plan) utilise les fonctionnalités natives du téléphone.
                        Ouvrez XPARK Driver sur votre appareil (Expo Go, Android ou iOS)
                        pour démarrer le suivi de la mission
                        {m ? ` ${m.villeDepart || ""} → ${m.villeArrivee || m.destination}` : ""}.
                    </Text>
                    <View style={{ height: spacing.md }} />
                    <Button title="Voir le suivi côté client (Front Office)"
                        variant="outline"
                        onPress={() => Linking.openURL("http://localhost:3001/account/tracking")} />
                </Card>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    body: { padding: spacing.lg },
    title: { fontSize: font.h3, fontWeight: "800", color: colors.text, marginBottom: 8 },
    text: { fontSize: font.small, color: colors.muted, textAlign: "center", lineHeight: 20 },
})
