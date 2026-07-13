import { useMemo, useState } from "react"
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useMissions } from "@/hooks/useMissions"
import { Empty, Header, StatusBadge } from "@/components/ui"
import { colors, font, radius, spacing } from "@/theme"
import type { Mission, MissionStatut } from "@/types"

/** Mes missions — liste filtrable par statut. */
const FILTERS: { key: "TOUS" | MissionStatut; label: string }[] = [
    { key: "TOUS", label: "Toutes" },
    { key: "EN_ATTENTE", label: "En attente" },
    { key: "EN_COURS", label: "En cours" },
    { key: "TERMINEE", label: "Terminées" },
]

export default function MissionsScreen() {
    const router = useRouter()
    const { missions, loading, reload } = useMissions()
    const [filter, setFilter] = useState<"TOUS" | MissionStatut>("TOUS")

    const data = useMemo(
        () => (filter === "TOUS" ? missions : missions.filter((m) => m.statut === filter)),
        [missions, filter])

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <Header title="Mes missions" subtitle={`${missions.length} au total`} />

            <View style={styles.filters}>
                {FILTERS.map((f) => {
                    const on = filter === f.key
                    const n = f.key === "TOUS" ? missions.length : missions.filter((m) => m.statut === f.key).length
                    return (
                        <Pressable key={f.key} onPress={() => setFilter(f.key)}
                            style={[styles.chip, on && styles.chipOn]}>
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label} ({n})</Text>
                        </Pressable>
                    )
                })}
            </View>

            <FlatList
                data={data}
                keyExtractor={(m) => String(m.idMission)}
                contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.brand} />}
                ListEmptyComponent={!loading ? <Empty icon="📦" title="Aucune mission" /> : null}
                renderItem={({ item }) => <MissionRow m={item} onPress={() => router.push(`/mission/${item.idMission}`)} />}
            />
        </View>
    )
}

function MissionRow({ m, onPress }: { m: Mission; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={styles.row}>
            <View style={styles.rowHead}>
                <Text style={styles.rowId}>#{m.idMission}</Text>
                <StatusBadge statut={m.statut} />
            </View>
            <Text style={styles.rowRoute}>{m.villeDepart || "—"} → {m.villeArrivee || m.destination}</Text>
            <Text style={styles.rowMeta}>
                {new Date(m.dateDepart).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                {m.distanceKm ? ` · ${m.distanceKm.toFixed(0)} km` : ""}
                {m.clientNom ? ` · ${m.clientNom}` : ""}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: spacing.lg },
    chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.card },
    chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
    chipText: { color: colors.text, fontSize: font.small, fontWeight: "600" },
    chipTextOn: { color: colors.white },
    row: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.sm },
    rowHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    rowId: { fontSize: font.body, fontWeight: "800", color: colors.text },
    rowRoute: { fontSize: font.body, fontWeight: "700", color: colors.brand, marginTop: 6 },
    rowMeta: { fontSize: font.small, color: colors.muted, marginTop: 4 },
})
