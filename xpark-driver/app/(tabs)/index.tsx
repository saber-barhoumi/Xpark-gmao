import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/auth/AuthContext"
import { useMissions } from "@/hooks/useMissions"
import { Button, Card, Empty, Header, StatusBadge } from "@/components/ui"
import { colors, font, radius, spacing } from "@/theme"
import type { Mission } from "@/types"

/**
 * Tableau de bord — écran principal après connexion.
 * Chauffeur, véhicule courant, mission active (statut / distance / départ) et
 * accès rapide à la navigation.
 */
export default function Dashboard() {
    const router = useRouter()
    const { user } = useAuth()
    const { missions, loading, reload } = useMissions()

    const active = missions.find((m) => m.statut === "EN_COURS")
        ?? missions.find((m) => m.statut === "EN_ATTENTE")
    const counts = {
        attente: missions.filter((m) => m.statut === "EN_ATTENTE").length,
        cours: missions.filter((m) => m.statut === "EN_COURS").length,
        terminees: missions.filter((m) => m.statut === "TERMINEE").length,
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <Header title={`Bonjour, ${user?.prenom || "chauffeur"} 👋`} subtitle="XPARK Driver" />
            <ScrollView contentContainerStyle={styles.body}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.brand} />}>

                {/* Véhicule courant */}
                <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Text style={{ fontSize: 28 }}>🚚</Text>
                    <View>
                        <Text style={styles.muted}>Véhicule assigné</Text>
                        <Text style={styles.strong}>{active?.vehiculeImmatriculation || "Aucun véhicule actif"}</Text>
                    </View>
                </Card>

                {/* Mission active */}
                {active ? (
                    <Card style={{ marginTop: spacing.md }}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.cardTitle}>Mission #{active.idMission}</Text>
                            <StatusBadge statut={active.statut} />
                        </View>
                        <Text style={styles.route}>
                            {active.villeDepart || "—"} → {active.villeArrivee || active.destination}
                        </Text>
                        <View style={styles.metrics}>
                            <Metric label="Distance" value={active.distanceKm ? `${active.distanceKm.toFixed(0)} km` : "—"} />
                            <Metric label="Départ" value={new Date(active.dateDepart).toLocaleDateString("fr-FR")} />
                            <Metric label="Client" value={active.clientNom || "—"} />
                        </View>
                        <View style={{ height: spacing.md }} />
                        <Button title="🧭 Naviguer / Suivre la mission"
                            onPress={() => router.push(`/navigation/${active.idMission}`)} />
                        <View style={{ height: spacing.sm }} />
                        <Button title="Voir les détails" variant="outline"
                            onPress={() => router.push(`/mission/${active.idMission}`)} />
                    </Card>
                ) : !loading ? (
                    <Card style={{ marginTop: spacing.md }}>
                        <Empty icon="📦" title="Aucune mission active"
                            text="Vos missions assignées apparaîtront ici." />
                    </Card>
                ) : null}

                {/* Compteurs */}
                <View style={styles.counters}>
                    <Counter value={counts.attente} label="En attente" color={colors.warning} />
                    <Counter value={counts.cours} label="En cours" color={colors.info} />
                    <Counter value={counts.terminees} label="Terminées" color={colors.success} />
                </View>
            </ScrollView>
        </View>
    )
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.metric}>
            <Text style={styles.muted}>{label}</Text>
            <Text style={styles.metricValue}>{value}</Text>
        </View>
    )
}
function Counter({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <View style={styles.counter}>
            <Text style={[styles.counterValue, { color }]}>{value}</Text>
            <Text style={styles.muted}>{label}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    body: { padding: spacing.lg, paddingBottom: 40 },
    muted: { color: colors.muted, fontSize: font.tiny },
    strong: { color: colors.text, fontSize: font.body, fontWeight: "700" },
    cardTitle: { fontSize: font.h3, fontWeight: "800", color: colors.text },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    route: { fontSize: font.body, fontWeight: "700", color: colors.brand, marginTop: 6 },
    metrics: { flexDirection: "row", marginTop: spacing.md, gap: spacing.sm },
    metric: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.sm },
    metricValue: { fontSize: font.small, fontWeight: "700", color: colors.text, marginTop: 2 },
    counters: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
    counter: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center", paddingVertical: spacing.md },
    counterValue: { fontSize: 26, fontWeight: "900" },
})
