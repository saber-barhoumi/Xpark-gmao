"use client"

/**
 * Graphiques SVG légers du portail client — zéro dépendance externe.
 * Couleurs charte onpoint + variables CSS du portail (dark mode ok).
 */

export const CHART_COLORS = ["#C11425", "#084298", "#146c43", "#b45309", "#6f42c1", "#0dcaf0"]

/** Barres verticales : data = [{ label, value }] */
export function BarChart({ data, height = 180, format = (v) => v }) {
    if (!data.length) return null
    const max = Math.max(...data.map(d => d.value), 1)
    const bw = 100 / data.length
    return (
        <svg viewBox="0 0 100 60" style={{ width: "100%", height, display: "block" }} preserveAspectRatio="none">
            {data.map((d, i) => {
                const h = (d.value / max) * 42
                return (
                    <g key={d.label}>
                        <rect x={i * bw + bw * 0.18} y={50 - h} width={bw * 0.64} height={Math.max(h, 0.5)}
                            rx="1.2" fill={d.value > 0 ? "#C11425" : "var(--pborder)"} opacity={d.value > 0 ? 1 : 0.6} />
                        <text x={i * bw + bw / 2} y={46.5 - h} textAnchor="middle"
                            style={{ fontSize: 3.2, fontWeight: 700, fill: "var(--ptext)" }}>
                            {d.value > 0 ? format(d.value) : ""}
                        </text>
                        <text x={i * bw + bw / 2} y={56} textAnchor="middle"
                            style={{ fontSize: 3, fill: "var(--pmuted)" }}>{d.label}</text>
                    </g>
                )
            })}
        </svg>
    )
}

/** Donut : data = [{ label, value }] — légende incluse */
export function DonutChart({ data, size = 170 }) {
    const total = data.reduce((s, d) => s + d.value, 0)
    if (!total) return null
    let angle = -90
    const arcs = data.filter(d => d.value > 0).map((d, i) => {
        const sweep = (d.value / total) * 360
        const path = arcPath(50, 50, 38, angle, angle + Math.min(sweep, 359.99))
        angle += sweep
        return { ...d, path, color: CHART_COLORS[i % CHART_COLORS.length] }
    })
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
                {arcs.map(a => (
                    <path key={a.label} d={a.path} fill="none" stroke={a.color} strokeWidth="14" />
                ))}
                <text x="50" y="47" textAnchor="middle" style={{ fontSize: 15, fontWeight: 800, fill: "var(--ptext)" }}>{total}</text>
                <text x="50" y="60" textAnchor="middle" style={{ fontSize: 6.5, fill: "var(--pmuted)" }}>missions</text>
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {arcs.map(a => (
                    <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: a.color }} />
                        <span>{a.label}</span>
                        <strong>{a.value}</strong>
                        <span style={{ color: "var(--pmuted)", fontSize: 12 }}>({Math.round((a.value / total) * 100)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

/** Barres horizontales : data = [{ label, value }] */
export function HBarChart({ data, format = (v) => v }) {
    if (!data.length) return null
    const max = Math.max(...data.map(d => d.value), 1)
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.map((d, i) => (
                <div key={d.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{d.label}</span>
                        <span style={{ color: "var(--pmuted)" }}>{format(d.value)}</span>
                    </div>
                    <div style={{ height: 9, background: "var(--pbg)", border: "1px solid var(--pborder)",
                        borderRadius: 5, overflow: "hidden" }}>
                        <div style={{ width: `${(d.value / max) * 100}%`, height: "100%",
                            background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 5 }} />
                    </div>
                </div>
            ))}
        </div>
    )
}

// ── helpers ──────────────────────────────────────────────────────────────────

function arcPath(cx, cy, r, start, end) {
    const s = polar(cx, cy, r, start)
    const e = polar(cx, cy, r, end)
    const large = end - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

function polar(cx, cy, r, deg) {
    const rad = (deg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
