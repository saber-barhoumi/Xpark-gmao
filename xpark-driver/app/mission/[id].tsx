import { useMemo } from "react"
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useMissions } from "@/hooks/useMissions"
import { Button, Card, Empty, Header, Row, StatusBadge } from "@/components/ui"
import { colors, font, spacing } from "@/theme"

/**
 * Détails d'une mission : enlèvement, livraison, client, marchandises, véhicule,
 * timeline, et bouton pour lancer la navigation/suivi GPS.
 */
export default function MissionDetails() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const { missions, loading } = useMissions()
    const m = useMemo(() => missions.find((x) => String(x.idMission) === String(id)), [missions, id])

    if (loading && !m) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.bg }}>
                <Header title="Mission" back />
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
            </View>
        )
    }
    if (!m) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.bg }}>
                <Header title="Mission" back />
                <Empty icon="❓" title="Mission introuvable" />
            </View>
        )
    }

    const timeline = [
        { icon: "📝", label: "Commande confirmée", done: true },
        { icon: "🧑‍✈️", label: "Chauffeur affecté", done: !!m.chauffeurNom },
        { icon: "🚦", label: "Départ", done: m.statut === "EN_COURS" || m.statut === "TERMINEE" },
        { icon: "✅", label: "Livraison", done: m.statut === "TERMINEE" },
    ]

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <Header title={`Mission #${m.idMission}`} subtitle={m.villeDepart + " → " + (m.villeArrivee || m.destination)} back />
            <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
                <View style={styles.badgeRow}><StatusBadge statut={m.statut} /></View>

                <Card>
                    <Text style={styles.section}>Trajet</Text>
                    <Row label="Enlèvement" value={m.villeDepart || "—"} />
                    <Row label="Livraison" value={m.villeArrivee || m.destination} />
                    <Row label="Distance" value={m.distanceKm ? `${m.distanceKm.toFixed(0)} km` : "—"} />
                    <Row label="Départ prévu" value={new Date(m.dateDepart).toLocaleString("fr-FR")} />
                </Card>

                <Card style={{ marginTop: spacing.md }}>
                    <Text style={styles.section}>Client & marchandises</Text>
                    <Row label="Client" value={m.clientNom || "—"} />
                    <Row label="Objet" value={m.objetMission || "Transport de marchandises"} />
                </Card>

                <Card style={{ marginTop: spacing.md }}>
                    <Text style={styles.section}>Véhicule</Text>
                    <Row label="Immatriculation" value={m.vehiculeImmatriculation || "—"} />
                    <Row label="Type" value={m.aiVehiculeTypeUsed || "—"} />
                </Card>

                <Card style={{ marginTop: spacing.md }}>
                    <Text style={styles.section}>Historique</Text>
                    {timeline.map((t, i) => (
                        <View key={i} style={styles.tl}>
                            <Text style={[styles.tlIcon, { opacity: t.done ? 1 : 0.4 }]}>{t.icon}</Text>
                            <Text style={[styles.tlLabel, { color: t.done ? colors.text : colors.muted }]}>{t.label}</Text>
                            {t.done ? <Text style={styles.tlDone}>✓</Text> : null}
                        </View>
                    ))}
                </Card>

                <View style={{ height: spacing.lg }} />
                {m.statut === "EN_COURS" || m.statut === "EN_ATTENTE" ? (
                    <Button title="🧭 Démarrer la navigation" onPress={() => router.push(`/navigation/${m.idMission}`)} />
                ) : null}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    badgeRow: { marginBottom: spacing.md },
    section: { fontSize: font.small, fontWeight: "800", color: colors.muted, textTransform: "uppercase", marginBottom: spacing.sm },
    tl: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
    tlIcon: { fontSize: 18 },
    tlLabel: { flex: 1, fontSize: font.small, fontWeight: "600" },
    tlDone: { color: colors.success, fontWeight: "900" },
})
