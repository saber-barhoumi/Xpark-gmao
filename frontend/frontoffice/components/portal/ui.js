"use client"

/**
 * Briques UI partagées du portail client (charte onpoint : rouge #C11425,
 * noir #0F1B24, variables CSS --pcard/--pborder/--pmuted du ClientPortalLayout).
 * Centralisées ici pour que les pages du portail restent cohérentes.
 */

// ── Styles réutilisables ─────────────────────────────────────────────────────

export const card  = { background: "var(--pcard)", border: "1px solid var(--pborder)", borderRadius: 14, padding: 22 }
export const grid4 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }
export const th    = { padding: "10px 8px", fontWeight: 600 }
export const td    = { padding: "12px 8px" }

/** Couleurs par statut mission / facture / ticket */
export const STATUS_COLORS = {
    EN_ATTENTE: { bg: "#fff3cd", fg: "#b45309" },
    EN_COURS:   { bg: "#cfe2ff", fg: "#084298" },
    TERMINEE:   { bg: "#d1e7dd", fg: "#146c43" },
    ANNULEE:    { bg: "#f8d7da", fg: "#b02a37" },
    PAYEE:      { bg: "#d1e7dd", fg: "#146c43" },
    ANNULEE_F:  { bg: "#f8d7da", fg: "#b02a37" },
    OUVERT:     { bg: "#fff3cd", fg: "#b45309" },
    RESOLU:     { bg: "#d1e7dd", fg: "#146c43" },
    FERME:      { bg: "#e2e3e5", fg: "#41464b" },
}

export const STATUS_LABELS = {
    EN_ATTENTE: "En attente",
    EN_COURS:   "En cours",
    TERMINEE:   "Terminée",
    ANNULEE:    "Annulée",
    PAYEE:      "Payée",
    OUVERT:     "Ouvert",
    RESOLU:     "Résolu",
    FERME:      "Fermé",
}

// ── Composants ───────────────────────────────────────────────────────────────

export function StatCard({ value, label, accent }) {
    return (
        <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: accent }}>{value}</div>
            <div style={{ fontSize: 13, color: "var(--pmuted)", marginTop: 4 }}>{label}</div>
        </div>
    )
}

export function Badge({ statut }) {
    const c = STATUS_COLORS[statut] || { bg: "#e2e3e5", fg: "#41464b" }
    return (
        <span style={{ background: c.bg, color: c.fg, padding: "3px 10px", borderRadius: 20,
            fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
            {STATUS_LABELS[statut] || statut}
        </span>
    )
}

export function EmptyState({ icon, title, text, action }) {
    return (
        <div style={{ ...card, textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{title}</div>
            <div style={{ color: "var(--pmuted)", fontSize: 14, marginBottom: action ? 18 : 0 }}>{text}</div>
            {action}
        </div>
    )
}

/** Format TND homogène partout dans le portail */
export const tnd = (v) => `${(v ?? 0).toFixed(2)} TND`

/** Date courte française */
export const dateFr = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—")

/** Date + heure française */
export const dateTimeFr = (d) => (d ? new Date(d).toLocaleString("fr-FR",
    { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—")
