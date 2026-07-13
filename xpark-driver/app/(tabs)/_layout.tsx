import { Redirect, Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/auth/AuthContext"
import { colors } from "@/theme"

/** Navigation principale (après connexion) : 4 onglets. Garde d'authentification. */
export default function TabsLayout() {
    const { user, loading } = useAuth()
    if (loading) return null
    if (!user) return <Redirect href="/login" />

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.brand,
                tabBarInactiveTintColor: colors.muted,
                tabBarStyle: { borderTopColor: colors.border, height: 60, paddingBottom: 8, paddingTop: 6 },
                tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
            }}
        >
            <Tabs.Screen name="index" options={{
                title: "Accueil",
                tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
            }} />
            <Tabs.Screen name="missions" options={{
                title: "Missions",
                tabBarIcon: ({ color, size }) => <Ionicons name="cube" color={color} size={size} />,
            }} />
            <Tabs.Screen name="profile" options={{
                title: "Profil",
                tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
            }} />
            <Tabs.Screen name="settings" options={{
                title: "Réglages",
                tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
            }} />
        </Tabs>
    )
}
