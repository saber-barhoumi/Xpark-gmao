/**
 * Composants UI réutilisables — charte XPARK. Regroupés pour garder le projet
 * compact tout en restant modulaires (chaque export est autonome).
 */

import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { colors, radius, spacing, statusColors, font } from "@/theme"

/** Entête sombre XPARK, avec bouton retour optionnel. */
export function Header({ title, subtitle, back }: { title: string; subtitle?: string; back?: boolean }) {
    const insets = useSafeAreaInsets()
    const router = useRouter()
    return (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            {back ? (
                <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
                    <Text style={styles.backText}>‹</Text>
                </Pressable>
            ) : null}
            <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>{title}</Text>
                {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
            </View>
        </View>
    )
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
    return <View style={[styles.card, style]}>{children}</View>
}

export function Button({
    title, onPress, variant = "primary", loading, disabled, icon,
}: {
    title: string
    onPress: () => void
    variant?: "primary" | "success" | "danger" | "outline"
    loading?: boolean
    disabled?: boolean
    icon?: React.ReactNode
}) {
    const bg = variant === "primary" ? colors.brand
        : variant === "success" ? colors.success
        : variant === "danger" ? colors.danger
        : "transparent"
    const fg = variant === "outline" ? colors.brand : colors.white
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.btn,
                { backgroundColor: bg, opacity: disabled || loading ? 0.6 : pressed ? 0.85 : 1 },
                variant === "outline" && { borderWidth: 1.5, borderColor: colors.brand },
            ]}
        >
            {loading ? (
                <ActivityIndicator color={fg} />
            ) : (
                <View style={styles.btnInner}>
                    {icon}
                    <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
                </View>
            )}
        </Pressable>
    )
}

export function StatusBadge({ statut }: { statut: string }) {
    const c = statusColors[statut] ?? { bg: "#e2e3e5", fg: "#41464b", label: statut }
    return (
        <View style={[styles.badge, { backgroundColor: c.bg }]}>
            <Text style={[styles.badgeText, { color: c.fg }]}>{c.label}</Text>
        </View>
    )
}

export function Row({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    )
}

export function Empty({ icon, title, text }: { icon: string; title: string; text?: string }) {
    return (
        <View style={styles.empty}>
            <Text style={{ fontSize: 44, marginBottom: 8 }}>{icon}</Text>
            <Text style={styles.emptyTitle}>{title}</Text>
            {text ? <Text style={styles.emptyText}>{text}</Text> : null}
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: colors.dark, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
        flexDirection: "row", alignItems: "center", gap: 8,
    },
    back: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
    backText: { color: colors.white, fontSize: 30, marginTop: -4 },
    headerTitle: { color: colors.white, fontSize: font.h2, fontWeight: "800" },
    headerSub: { color: "rgba(255,255,255,.6)", fontSize: font.small, marginTop: 2 },
    card: {
        backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
        borderWidth: 1, borderColor: colors.border,
    },
    btn: { borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 18, alignItems: "center" },
    btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
    btnText: { fontSize: font.body, fontWeight: "700" },
    badge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill },
    badgeText: { fontSize: font.small, fontWeight: "700" },
    row: {
        flexDirection: "row", justifyContent: "space-between", gap: 12,
        paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    rowLabel: { color: colors.muted, fontSize: font.small },
    rowValue: { color: colors.text, fontSize: font.small, fontWeight: "700", flexShrink: 1, textAlign: "right" },
    empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
    emptyTitle: { fontSize: font.h3, fontWeight: "700", color: colors.text },
    emptyText: { fontSize: font.small, color: colors.muted, textAlign: "center", marginTop: 6 },
})
