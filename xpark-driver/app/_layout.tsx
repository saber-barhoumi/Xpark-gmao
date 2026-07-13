import "@/tracking/locationTask" // enregistre la tâche GPS d'arrière-plan au démarrage
import { Stack } from "expo-router"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { AuthProvider } from "@/auth/AuthContext"

/** Racine de l'app : provider de session + pile de navigation (sans header natif,
 *  chaque écran gère son propre entête XPARK). */
export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />
            </AuthProvider>
        </SafeAreaProvider>
    )
}
