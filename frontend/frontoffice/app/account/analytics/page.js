"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import missionService from "@/lib/missionService"
import ClientPortalLayout from "@/components/portal/ClientPortalLayout"
import { card, grid4, StatCard, EmptyState, tnd } from "@/components/portal/ui"
import { BarChart, DonutChart, HBarChart } from "@/components/portal/charts"

/**
 * 📊 Analyses — indicateurs du client calculés depuis ses missions :
 * volumes par mois, répartition des statuts, top trajets, dépenses mensuelles.
 * Tout est calculé côté client à partir de Mission.API /missions/my.
 */

const MOIS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]

/** 6 derniers mois glissants : [{ key: "2026-6", label: "Juin" }] */
function derniersMois(n = 6) {
    const out = []
    const now = new Date()
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MOIS[d.getMonth()] })
    }
    return out
}

export default function AnalyticsPage() {
    const [missions, setMissions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        missionService.getMyMissions()
            .then(setMissions).catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const stats = useMemo(() => {
        const terminees = missions.filter(m => m.statut === "TERMINEE")
        const kmTotal = terminees.reduce((s, m) => s + (m.distanceKm || 0), 0)
        const depense = terminees.reduce((s, m) => s + (m.coutTotal || m.coutEstimeAI || 0), 0)

        const mois = derniersMois()
        const parMois = mois.map(mo => ({ label: mo.label, value: 0 }))
        const depensesMois = mois.map(mo => ({ label: mo.label, value: 0 }))
        for (const m of missions) {
            const d = new Date(m.dateDepart)
            const idx = mois.findIndex(mo => mo.key === `${d.getFullYear()}-${d.getMonth()}`)
            if (idx >= 0) {
                parMois[idx].value++
                if (m.statut === "TERMINEE") depensesMois[idx].value += m.coutTotal || m.coutEstimeAI || 0
            }
        }

        const statuts = [
            { label: "Terminées", value: terminees.length },
            { label: "En cours", value: missions.filter(m => m.statut === "EN_COURS").length },
            { label: "En attente", value: missions.filter(m => m.statut === "EN_ATTENTE").length },
            { label: "Annulées", value: missions.filter(m => m.statut === "ANNULEE").length },
        ]

        const trajets = {}
        for (const m of missions) {
            if (m.statut === "ANNULEE") continue
            const key = `${m.villeDepart || "?"} → ${m.villeArrivee || m.destination || "?"}`
            trajets[key] = (trajets[key] || 0) + 1
        }
        const topTrajets = Object.entries(trajets)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value).slice(0, 5)

        return { kmTotal, depense, parMois, depensesMois, statuts, topTrajets,
            coutParKm: kmTotal > 0 ? depense / kmTotal : 0 }
    }, [missions])

    if (!loading && missions.length === 0) {
        return (
            <ClientPortalLayout title="📊 Analyses">
                <EmptyState icon="📊" title="Pas encore de données à analyser"
                    text="Vos indicateurs (missions, kilomètres, dépenses) apparaîtront après votre première réservation."
                    action={<Link href="/account/reserver" className="thm-btn" style={{ padding: "11px 22px" }}>➕ Réserver un transport<span /></Link>} />
            </ClientPortalLayout>
        )
    }

    return (
        <ClientPortalLayout title="📊 Analyses">
            {/* KPIs */}
            <div style={grid4}>
                <StatCard value={missions.length} label="📦 Missions au total" accent="#0d6efd" />
                <StatCard value={`${stats.kmTotal.toFixed(0)} km`} label="🛣️ Kilomètres parcourus" accent="#6f42c1" />
                <StatCard value={tnd(stats.depense)} label="💰 Dépenses totales" accent="#146c43" />
                <StatCard value={stats.coutParKm ? `${stats.coutParKm.toFixed(2)} TND` : "—"} label="📐 Coût moyen / km" accent="#b45309" />
            </div>

            {/* Ligne 1 : missions/mois + répartition statuts */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 16 }}>
                <div style={card}>
                    <h4 style={chartTitle}>📅 Missions par mois (6 derniers mois)</h4>
                    <BarChart data={stats.parMois} />
                </div>
                <div style={card}>
                    <h4 style={chartTitle}>🎯 Répartition par statut</h4>
                    <DonutChart data={stats.statuts} />
                </div>
            </div>

            {/* Ligne 2 : dépenses/mois + top trajets */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                <div style={card}>
                    <h4 style={chartTitle}>💸 Dépenses par mois (TND)</h4>
                    <BarChart data={stats.depensesMois} format={(v) => v.toFixed(0)} />
                </div>
                <div style={card}>
                    <h4 style={chartTitle}>🏆 Trajets les plus fréquents</h4>
                    {stats.topTrajets.length === 0
                        ? <div style={{ color: "var(--pmuted)", fontSize: 14 }}>Pas encore de trajets.</div>
                        : <HBarChart data={stats.topTrajets} format={(v) => `${v} mission${v > 1 ? "s" : ""}`} />}
                </div>
            </div>

            <p style={{ margin: "18px 0 0", fontSize: 12.5, color: "var(--pmuted)" }}>
                💡 Ces indicateurs sont calculés en direct à partir de vos missions. Les dépenses incluent
                les coûts finaux des missions terminées (ou l'estimation IA à défaut).
            </p>
        </ClientPortalLayout>
    )
}

const chartTitle = { fontSize: 16, fontWeight: 700, marginBottom: 16 }
