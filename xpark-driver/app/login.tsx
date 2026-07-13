import { useState } from "react"
import {
    Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/auth/AuthContext"
import { Button } from "@/components/ui"
import { colors, font, radius, spacing } from "@/theme"

/**
 * Écran de connexion. Le chauffeur s'authentifie avec son email + mot de passe
 * XPARK (IAM.API). La session est mémorisée (SecureStore) : il reste connecté.
 */
export default function LoginScreen() {
    const router = useRouter()
    const { signIn } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const onSubmit = async () => {
        if (!email || !password) { setError("Saisissez votre email et votre mot de passe."); return }
        setLoading(true); setError("")
        try {
            await signIn(email, password)
            router.replace("/(tabs)")
        } catch (e) {
            setError((e as Error).message || "Connexion impossible.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.dark }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Hero / branding XPARK */}
                <View style={styles.hero}>
                    <Text style={styles.brand}>XPARK</Text>
                    <View style={styles.driverPill}><Text style={styles.driverPillText}>DRIVER</Text></View>
                    <Text style={styles.tagline}>Transport de marchandises</Text>
                </View>

                {/* Carte de connexion */}
                <View style={styles.card}>
                    <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.title}>Connexion chauffeur</Text>

                    {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        value={email} onChangeText={setEmail}
                        placeholder="chauffeur@xpark.tn" placeholderTextColor={colors.muted}
                        autoCapitalize="none" keyboardType="email-address" style={styles.input}
                    />
                    <Text style={styles.label}>Mot de passe</Text>
                    <TextInput
                        value={password} onChangeText={setPassword}
                        placeholder="••••••••" placeholderTextColor={colors.muted}
                        secureTextEntry style={styles.input}
                    />

                    <View style={{ height: spacing.md }} />
                    <Button title="Se connecter" onPress={onSubmit} loading={loading} />

                    <Text style={styles.hint}>
                        Utilisez votre compte chauffeur XPARK. En cas d'oubli, contactez votre gestionnaire.
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
    hero: { alignItems: "center", marginBottom: spacing.xl },
    brand: { color: colors.white, fontSize: 44, fontWeight: "900", letterSpacing: 4 },
    driverPill: { backgroundColor: colors.brand, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 3, marginTop: 6 },
    driverPillText: { color: colors.white, fontWeight: "800", letterSpacing: 3, fontSize: font.small },
    tagline: { color: "rgba(255,255,255,.6)", marginTop: 10, fontSize: font.small },
    card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl },
    logo: { width: 120, height: 40, alignSelf: "center", marginBottom: spacing.md },
    title: { fontSize: font.h3, fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: spacing.lg },
    label: { color: colors.muted, fontSize: font.small, marginBottom: 6, marginTop: spacing.sm },
    input: {
        borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
        paddingHorizontal: 14, paddingVertical: 12, fontSize: font.body, color: colors.text,
    },
    error: { backgroundColor: "#f8d7da", borderRadius: radius.sm, padding: 10, marginBottom: spacing.sm },
    errorText: { color: colors.danger, fontSize: font.small, fontWeight: "600" },
    hint: { color: colors.muted, fontSize: font.tiny, textAlign: "center", marginTop: spacing.lg },
})
