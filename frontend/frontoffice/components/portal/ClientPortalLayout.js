"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import authService, { getCurrentUser, isAuthenticated } from "@/lib/authService"
import missionService from "@/lib/missionService"

/**
 * Client Portal shell (après login) : Header + Sidebar + Main content, SANS footer.
 * Reprend la charte du thème onpoint (base rouge #C11425, noir #0F1B24).
 * Header : logo, recherche, notifications, AI assistant, langue, dark mode, avatar, logout.
 * Sidebar sombre à gauche. Contenu au centre. Responsive (sidebar repliable mobile).
 */

const NAV = [
    { icon: "🏠", label: "Tableau de bord", href: "/account" },
    { icon: "🚚", label: "Mes missions", href: "/account/missions" },
    { icon: "➕", label: "Réserver", href: "/account/reserver" },
    { icon: "📍", label: "Suivi en direct", href: "/account/missions", soon: true },
    { icon: "💰", label: "Finances", href: "#", soon: true },
    { icon: "📄", label: "Documents", href: "#", soon: true },
    { icon: "📊", label: "Analyses", href: "#", soon: true },
    { icon: "🤖", label: "Assistant IA", href: "#", soon: true },
    { icon: "🎫", label: "Support", href: "#", soon: true },
    { icon: "🔐", label: "Sécurité", href: "/account/security" },
]

const STATUS_LABEL = {
    EN_ATTENTE: "en attente d'affectation",
    EN_COURS: "en cours",
    TERMINEE: "terminée",
    ANNULEE: "annulée",
}

export default function ClientPortalLayout({ title, children }) {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState(null)
    const [dark, setDark] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)   // mobile
    const [notifOpen, setNotifOpen] = useState(false)
    const [avatarOpen, setAvatarOpen] = useState(false)
    const [langOpen, setLangOpen] = useState(false)
    const [missions, setMissions] = useState([])
    const [search, setSearch] = useState("")
    const rootRef = useRef(null)

    useEffect(() => {
        if (!isAuthenticated()) { router.push("/auth/login"); return }
        setUser(getCurrentUser())
        setDark(localStorage.getItem("xpark_portal_dark") === "1")
        missionService.getMyMissions().then(setMissions).catch(() => {})
    }, [router])

    // Fermer les dropdowns au clic extérieur
    useEffect(() => {
        const onClick = (e) => {
            if (rootRef.current && !e.target.closest(".portal-dropdown")) {
                setNotifOpen(false); setAvatarOpen(false); setLangOpen(false)
            }
        }
        document.addEventListener("click", onClick)
        return () => document.removeEventListener("click", onClick)
    }, [])

    const toggleDark = () => {
        const next = !dark
        setDark(next)
        localStorage.setItem("xpark_portal_dark", next ? "1" : "0")
    }

    const logout = () => router.push("/auth/logout")

    const submitSearch = (e) => {
        e.preventDefault()
        router.push(`/account/missions${search ? `?q=${encodeURIComponent(search)}` : ""}`)
    }

    // Notifications = missions récemment mises à jour
    const notifs = useMemo(() =>
        [...missions]
            .sort((a, b) => new Date(b.dateDepart) - new Date(a.dateDepart))
            .slice(0, 6), [missions])
    const pendingCount = missions.filter(m => m.statut === "EN_ATTENTE" || m.statut === "EN_COURS").length

    if (!user) return null

    const initials = `${(user.prenom || "")[0] || ""}${(user.nom || "")[0] || ""}`.toUpperCase() || "C"

    const vars = dark ? {
        "--pbg": "#0b1219", "--pcard": "#111c26", "--ptext": "#e8edf2",
        "--pmuted": "#8b98a5", "--pborder": "#1e2c39", "--phead": "#0f1922",
    } : {
        "--pbg": "#f4f6f9", "--pcard": "#ffffff", "--ptext": "#1f2b38",
        "--pmuted": "#6b7280", "--pborder": "#e6e9ee", "--phead": "#ffffff",
    }

    return (
        <div ref={rootRef} style={{ ...vars, minHeight: "100vh", background: "var(--pbg)", color: "var(--ptext)",
            fontFamily: "var(--onpoint-font, 'Jost', sans-serif)" }}>

            {/* ── SIDEBAR ─────────────────────────────────────── */}
            <aside style={{
                position: "fixed", top: 0, left: 0, bottom: 0, width: 260, background: "#0F1B24",
                color: "#fff", zIndex: 1050, display: "flex", flexDirection: "column",
                transform: sidebarOpen ? "translateX(0)" : undefined,
                transition: "transform .25s ease",
            }} className="portal-sidebar">
                <div style={{ padding: "22px 24px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                    <Link href="/account" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img src="/assets/images/resources/logo-1.png" alt="XPARK" style={{ maxHeight: 34 }} />
                    </Link>
                </div>
                <nav style={{ flex: 1, overflowY: "auto", padding: "14px 12px" }}>
                    {NAV.map((item) => {
                        const active = pathname === item.href && !item.soon
                        return item.soon ? (
                            <div key={item.label} title="Bientôt disponible"
                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                                    borderRadius: 10, color: "rgba(255,255,255,.38)", fontSize: 14.5, cursor: "not-allowed" }}>
                                <span style={{ fontSize: 17 }}>{item.icon}</span>
                                <span style={{ flex: 1 }}>{item.label}</span>
                                <span style={{ fontSize: 9, background: "rgba(255,255,255,.1)", padding: "2px 6px", borderRadius: 6 }}>BIENTÔT</span>
                            </div>
                        ) : (
                            <Link key={item.label} href={item.href} onClick={() => setSidebarOpen(false)}
                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                                    borderRadius: 10, marginBottom: 2, fontSize: 14.5,
                                    background: active ? "#C11425" : "transparent",
                                    color: active ? "#fff" : "rgba(255,255,255,.78)",
                                    fontWeight: active ? 600 : 400, transition: "background .15s" }}>
                                <span style={{ fontSize: 17 }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>
                <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,.08)", fontSize: 11, color: "rgba(255,255,255,.4)" }}>
                    XPARK GMAO · v1.0.0<br />
                    <Link href="/" style={{ color: "rgba(255,255,255,.55)" }}>← Retour au site</Link>
                </div>
            </aside>

            {/* Overlay mobile */}
            {sidebarOpen && (
                <div onClick={() => setSidebarOpen(false)} className="portal-overlay"
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1040 }} />
            )}

            {/* ── CONTENU (header + main) ──────────────────────── */}
            <div className="portal-main" style={{ marginLeft: 260, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

                {/* HEADER */}
                <header style={{ position: "sticky", top: 0, zIndex: 1030, background: "var(--phead)",
                    borderBottom: "1px solid var(--pborder)", padding: "0 22px", height: 66,
                    display: "flex", alignItems: "center", gap: 14 }}>
                    <button type="button" onClick={() => setSidebarOpen(true)} className="portal-burger"
                        style={{ display: "none", background: "none", border: "none", fontSize: 22, color: "var(--ptext)" }}>☰</button>

                    <form onSubmit={submitSearch} style={{ flex: 1, maxWidth: 420 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--pbg)",
                            border: "1px solid var(--pborder)", borderRadius: 10, padding: "8px 14px" }}>
                            <span style={{ color: "var(--pmuted)" }}>🔍</span>
                            <input value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher une mission, une ville…"
                                style={{ flex: 1, border: "none", background: "transparent", outline: "none",
                                    color: "var(--ptext)", fontSize: 14 }} />
                        </div>
                    </form>

                    <div style={{ flex: 1 }} />

                    {/* Notifications */}
                    <div className="portal-dropdown" style={{ position: "relative" }}>
                        <button type="button" onClick={() => { setNotifOpen(!notifOpen); setAvatarOpen(false); setLangOpen(false) }}
                            style={hdrBtn}>
                            🔔
                            {pendingCount > 0 && <span style={dot}>{pendingCount}</span>}
                        </button>
                        {notifOpen && (
                            <div style={dropdown}>
                                <div style={dropHead}>Notifications</div>
                                {notifs.length === 0 ? (
                                    <div style={{ padding: 16, color: "var(--pmuted)", fontSize: 13 }}>Aucune activité récente.</div>
                                ) : notifs.map(m => (
                                    <Link key={m.idMission} href="/account/missions" onClick={() => setNotifOpen(false)}
                                        style={dropItem}>
                                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                                            {m.villeDepart || "—"} → {m.villeArrivee || m.destination}
                                        </div>
                                        <div style={{ fontSize: 12, color: "var(--pmuted)" }}>
                                            Mission #{m.idMission} {STATUS_LABEL[m.statut] || ""}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* AI Assistant */}
                    <button type="button" title="Assistant IA (bientôt)" style={hdrBtn}
                        onClick={() => alert("🤖 Assistant IA — bientôt disponible dans votre espace client.")}>🤖</button>

                    {/* Langue */}
                    <div className="portal-dropdown" style={{ position: "relative" }}>
                        <button type="button" onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setAvatarOpen(false) }}
                            style={hdrBtn}>🌐</button>
                        {langOpen && (
                            <div style={{ ...dropdown, width: 160 }}>
                                {[["fr", "🇫🇷 Français"], ["en", "🇬🇧 English"], ["ar", "🇹🇳 العربية"]].map(([code, lbl]) => (
                                    <button key={code} type="button" onClick={() => setLangOpen(false)}
                                        style={{ ...dropItem, width: "100%", textAlign: "left", border: "none", background: "transparent",
                                            fontWeight: code === "fr" ? 700 : 400, cursor: "pointer" }}>
                                        {lbl}{code === "fr" && " ✓"}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dark mode */}
                    <button type="button" onClick={toggleDark} title="Mode sombre / clair" style={hdrBtn}>
                        {dark ? "☀️" : "🌙"}
                    </button>

                    {/* Avatar */}
                    <div className="portal-dropdown" style={{ position: "relative" }}>
                        <button type="button" onClick={() => { setAvatarOpen(!avatarOpen); setNotifOpen(false); setLangOpen(false) }}
                            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
                            <span style={{ width: 38, height: 38, borderRadius: "50%", background: "#C11425", color: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                                {initials}
                            </span>
                        </button>
                        {avatarOpen && (
                            <div style={{ ...dropdown, right: 0, width: 220 }}>
                                <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--pborder)" }}>
                                    <div style={{ fontWeight: 700 }}>{user.prenom} {user.nom}</div>
                                    <div style={{ fontSize: 12, color: "var(--pmuted)" }}>{user.email}</div>
                                </div>
                                <Link href="/account" onClick={() => setAvatarOpen(false)} style={dropItem}>🏠 Tableau de bord</Link>
                                <Link href="/account/security" onClick={() => setAvatarOpen(false)} style={dropItem}>🔐 Sécurité</Link>
                                <button type="button" onClick={logout}
                                    style={{ ...dropItem, width: "100%", textAlign: "left", border: "none", background: "transparent",
                                        cursor: "pointer", color: "#C11425", fontWeight: 600 }}>
                                    ⎋ Se déconnecter
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* MAIN */}
                <main style={{ flex: 1, padding: "26px 28px" }}>
                    {title && <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 22 }}>{title}</h1>}
                    {children}
                </main>
            </div>

            {/* Responsive : sidebar cachée < 992px, révélée via burger */}
            <style jsx global>{`
                @media (max-width: 991px) {
                    .portal-main { margin-left: 0 !important; }
                    .portal-sidebar { transform: translateX(-100%); }
                    .portal-burger { display: block !important; }
                }
                @media (min-width: 992px) {
                    .portal-overlay { display: none !important; }
                }
                .portal-main main a { text-decoration: none; }
            `}</style>
        </div>
    )
}

// ── Styles inline réutilisés ────────────────────────────────────────────────
const hdrBtn = {
    position: "relative", width: 42, height: 42, borderRadius: 10, border: "1px solid var(--pborder)",
    background: "var(--pbg)", color: "var(--ptext)", fontSize: 17, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
}
const dot = {
    position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9,
    background: "#C11425", color: "#fff", fontSize: 10, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
}
const dropdown = {
    position: "absolute", top: 52, right: 0, width: 300, background: "var(--pcard)",
    border: "1px solid var(--pborder)", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.16)",
    overflow: "hidden", zIndex: 1060,
}
const dropHead = { padding: "12px 16px", fontWeight: 700, borderBottom: "1px solid var(--pborder)", fontSize: 14 }
const dropItem = {
    display: "block", padding: "11px 16px", fontSize: 13.5, color: "var(--ptext)",
    borderBottom: "1px solid var(--pborder)",
}
