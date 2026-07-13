/**
 * Thème XPARK Driver — reprend l'identité visuelle du Front Office XPARK
 * (rouge #C11425, sombre #0F1B24) pour une cohérence d'écosystème.
 * Centralisé ici : un seul endroit à modifier pour toute l'app.
 */

export const colors = {
    brand: "#C11425",        // rouge XPARK
    brandDark: "#a01019",
    dark: "#0F1B24",         // bleu-nuit XPARK (entêtes, splash)
    darkSoft: "#16283a",

    bg: "#f4f6f9",
    card: "#ffffff",
    border: "#e6e9ee",
    text: "#1f2b38",
    muted: "#6b7280",

    success: "#146c43",
    warning: "#b45309",
    danger: "#b02a37",
    info: "#0aa2c0",
    white: "#ffffff",
}

/** Couleurs par statut de mission (aligné backend) */
export const statusColors: Record<string, { bg: string; fg: string; label: string }> = {
    EN_ATTENTE: { bg: "#fff3cd", fg: "#b45309", label: "En attente" },
    EN_COURS:   { bg: "#cfe2ff", fg: "#084298", label: "En cours" },
    TERMINEE:   { bg: "#d1e7dd", fg: "#146c43", label: "Terminée" },
    ANNULEE:    { bg: "#f8d7da", fg: "#b02a37", label: "Annulée" },
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 }

export const font = {
    h1: 26, h2: 21, h3: 17, body: 15, small: 13, tiny: 11,
}
