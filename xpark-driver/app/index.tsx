import { Redirect } from "expo-router"
import { ActivityIndicator, View } from "react-native"
import { useAuth } from "@/auth/AuthContext"
import { colors } from "@/theme"

/** Point d'entrée : redirige vers le tableau de bord ou l'écran de connexion. */
export default function Index() {
    const { user, loading } = useAuth()
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.dark }}>
                <ActivityIndicator color="#fff" size="large" />
            </View>
        )
    }
    return <Redirect href={user ? "/(tabs)" : "/login"} />
}
