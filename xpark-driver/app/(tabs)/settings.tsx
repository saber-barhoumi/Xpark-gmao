import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native"
import { useState } from "react"
import { useRouter } from "expo-router"
import { useAuth } from "@/auth/AuthContext"
import { Button, Card, Header, Row } from "@/components/ui"
import { colors, font, spacing } from "@/theme"

/** Réglages — langue, notifications, compte, déconnexion. */
export default function SettingsScreen() {
    const router = useRouter()
    const { user, signOut } = useAuth()
    const [notif, setNotif] = useState(true)

    const onLogout = () => {
        Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ? Le suivi GPS en cours sera arrêté.", [
            { text: "Annuler", style: "cancel" },
            {
                text: "Se déconnecter", style: "destructive",
                onPress: async () => { await signOut(); router.replace("/login") },
            },
        ])
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <Header title="Réglages" />
            <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
                <Card>
                    <Text style={styles.section}>Préférences</Text>
                    <Row label="Langue" value="Français" />
                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Notifications</Text>
                        <Switch value={notif} onValueChange={setNotif} trackColor={{ true: colors.brand }} />
                    </View>
                </Card>

                <Card style={{ marginTop: spacing.md }}>
                    <Text style={styles.section}>Compte</Text>
                    <Row label="Nom" value={`${user?.prenom || ""} ${user?.nom || ""}`.trim() || "—"} />
                    <Row label="Email" value={user?.email || "—"} />
                    <Row label="Rôle" value={user?.role || "—"} />
                </Card>

                <View style={{ height: spacing.lg }} />
                <Button title="Se déconnecter" variant="danger" onPress={onLogout} />

                <Text style={styles.version}>XPARK Driver v1.0.0 · © XPARK</Text>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    section: { fontSize: font.small, fontWeight: "800", color: colors.muted, textTransform: "uppercase", marginBottom: spacing.sm },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
    switchLabel: { color: colors.text, fontSize: font.small, fontWeight: "600" },
    version: { textAlign: "center", color: colors.muted, fontSize: font.tiny, marginTop: spacing.xl },
})
