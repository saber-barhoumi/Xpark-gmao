import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/auth/AuthContext"
import { useMissions } from "@/hooks/useMissions"
import { Card, Header, Row } from "@/components/ui"
import { colors, font, spacing } from "@/theme"

/** Profil — informations chauffeur, véhicule courant et statistiques. */
export default function ProfileScreen() {
    const { user } = useAuth()
    const { missions } = useMissions()

    const done = missions.filter((m) => m.statut === "TERMINEE")
    const km = done.reduce((s, m) => s + (m.distanceKm || 0), 0)
    const current = missions.find((m) => m.statut === "EN_COURS")
    const initials = `${(user?.prenom || "")[0] || ""}${(user?.nom || "")[0] || ""}`.toUpperCase() || "?"

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <Header title="Profil" />
            <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
                <Card style={{ alignItems: "center" }}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                    <Text style={styles.name}>{user?.prenom} {user?.nom}</Text>
                    <Text style={styles.muted}>{user?.email}</Text>
                    <Text style={styles.role}>Chauffeur XPARK</Text>
                </Card>

                <Card style={{ marginTop: spacing.md }}>
                    <Text style={styles.section}>Véhicule</Text>
                    <Row label="Véhicule courant" value={current?.vehiculeImmatriculation || "Aucun"} />
                    <Row label="Type" value={current?.aiVehiculeTypeUsed || "—"} />
                </Card>

                <Card style={{ marginTop: spacing.md }}>
                    <Text style={styles.section}>Statistiques</Text>
                    <View style={styles.stats}>
                        <Stat value={String(done.length)} label="Missions livrées" />
                        <Stat value={`${km.toFixed(0)}`} label="Km parcourus" />
                        <Stat value={String(missions.length)} label="Total missions" />
                    </View>
                </Card>
            </ScrollView>
        </View>
    )
}

function Stat({ value, label }: { value: string; label: string }) {
    return (
        <View style={styles.stat}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.muted}>{label}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.dark, alignItems: "center", justifyContent: "center" },
    avatarText: { color: colors.white, fontSize: 26, fontWeight: "800" },
    name: { fontSize: font.h3, fontWeight: "800", color: colors.text, marginTop: spacing.sm },
    muted: { color: colors.muted, fontSize: font.small },
    role: { color: colors.brand, fontSize: font.small, fontWeight: "700", marginTop: 4 },
    section: { fontSize: font.small, fontWeight: "800", color: colors.muted, textTransform: "uppercase", marginBottom: spacing.sm },
    stats: { flexDirection: "row", gap: spacing.sm },
    stat: { flex: 1, alignItems: "center", backgroundColor: colors.bg, borderRadius: 12, paddingVertical: spacing.md },
    statValue: { fontSize: 24, fontWeight: "900", color: colors.brand },
})
