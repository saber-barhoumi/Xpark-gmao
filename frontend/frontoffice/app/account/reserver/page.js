"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Layout from "@/components/layout/Layout"
import { isAuthenticated } from "@/lib/authService"
import missionService, { aiService } from "@/lib/missionService"

const VEHICLE_TYPES = [
    { value: "BERLINE", label: "🚗 Berline (léger)" },
    { value: "UTILITAIRE", label: "🚐 Utilitaire" },
    { value: "VAN", label: "🚐 Van / Minibus" },
    { value: "CAMION", label: "🚚 Camion" },
]

const cardStyle = { background: "#f8f9fa", borderRadius: 12, padding: 25 }

/**
 * Réserver un véhicule — wizard 3 étapes (fiche FRONTOFFICE §4.4) :
 * 1. Trajet & date · 2. Véhicule & paramètres · 3. Estimation IA & confirmation.
 * Crée une mission EN_ATTENTE affectée ensuite par OptimisateurFlotteIA.
 */
export default function ReserverPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [cities, setCities] = useState([])
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        villeDepart: "", villeArrivee: "", dateDepart: "", objetMission: "",
        vehicleType: "BERLINE", passagers: 1, poidsFret: 0, autoroute: false,
    })
    const [distance, setDistance] = useState(null)     // { distance_km, travel_hours }
    const [prediction, setPrediction] = useState(null) // { predicted_cost_tnd, ... }

    useEffect(() => {
        if (!isAuthenticated()) { router.push("/auth/login"); return }
        aiService.getCities().then(setCities).catch(() => {})
    }, [router])

    // Distance automatique dès que les 2 villes sont choisies
    useEffect(() => {
        setDistance(null)
        if (!form.villeDepart || !form.villeArrivee || form.villeDepart === form.villeArrivee) return
        aiService.getDistance(form.villeDepart, form.villeArrivee)
            .then(setDistance)
            .catch(() => setError("Distance non disponible pour cette paire de villes."))
    }, [form.villeDepart, form.villeArrivee])

    const set = (key) => (e) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
        setForm({ ...form, [key]: value })
        setError("")
    }

    const goStep2 = () => {
        if (!form.villeDepart || !form.villeArrivee) { setError("Choisissez les villes de départ et d'arrivée."); return }
        if (form.villeDepart === form.villeArrivee) { setError("Départ et arrivée doivent être différents."); return }
        if (!distance) { setError("Distance en cours de calcul — patientez."); return }
        if (!form.dateDepart || new Date(form.dateDepart) < new Date()) { setError("Choisissez une date de départ future."); return }
        setError(""); setStep(2)
    }

    const goStep3 = async () => {
        setLoading(true); setError("")
        try {
            const p = await aiService.predictPrice({
                departure: form.villeDepart,
                arrival: form.villeArrivee,
                date_depart: form.dateDepart,
                vehicle_type_gmao: form.vehicleType,
                has_autoroute: form.autoroute,
                cargo_weight: Number(form.poidsFret) || 0,
                passenger_count: Number(form.passagers) || 1,
            })
            setPrediction(p)
            setStep(3)
        } catch (err) {
            setError(err.message || "Estimation IA indisponible.")
        } finally { setLoading(false) }
    }

    const confirm = async () => {
        setLoading(true); setError("")
        try {
            await missionService.createRequest({
                dateDepart: form.dateDepart,
                villeDepart: form.villeDepart,
                villeArrivee: form.villeArrivee,
                objetMission: form.objetMission,
                distanceKm: distance?.distance_km ?? 0,
                coutEstime: prediction?.predicted_cost_tnd ?? 0,
                aiVehiculeTypeUsed: prediction?.vehicle_type_used,
            })
            router.push("/account/missions?created=1")
        } catch (err) {
            setError(err.message || "Erreur lors de la création de la réservation.")
        } finally { setLoading(false) }
    }

    return (
        <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="RÉSERVER UN VÉHICULE">
            <section className="contact-two">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-8 col-lg-10">
                            <div className="section-title text-center">
                                <div className="section-title__tagline-box">
                                    <span className="section-title__tagline">Espace Client XPARK</span>
                                </div>
                                <h2 className="section-title__title">Réserver un véhicule</h2>
                                {/* Progress 1/3 → 3/3 */}
                                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 15 }}>
                                    {[1, 2, 3].map(n => (
                                        <span key={n} style={{
                                            width: 90, height: 6, borderRadius: 3,
                                            background: step >= n ? "#0d6efd" : "#dee2e6",
                                        }} />
                                    ))}
                                </div>
                                <p style={{ marginTop: 8, color: "#6b7280", fontSize: 14 }}>
                                    Étape {step}/3 — {step === 1 ? "Trajet & date" : step === 2 ? "Véhicule & paramètres" : "Estimation & confirmation"}
                                </p>
                            </div>

                            {error && <div className="text-center" style={{ padding: 12, marginBottom: 20, background: "#fde8e8", color: "#b02a37", borderRadius: 8 }}>{error}</div>}

                            {/* ── ÉTAPE 1 : Trajet & date ─────────────── */}
                            {step === 1 && (
                                <div className="contact-two__form">
                                    <div className="row">
                                        <div className="col-xl-6">
                                            <label style={{ fontWeight: 600, fontSize: 14 }}>Ville de départ</label>
                                            <div className="contact-two__input-box">
                                                <input list="cities" value={form.villeDepart} onChange={set("villeDepart")}
                                                    placeholder="Ex: Tunis" />
                                            </div>
                                        </div>
                                        <div className="col-xl-6">
                                            <label style={{ fontWeight: 600, fontSize: 14 }}>Ville d&apos;arrivée</label>
                                            <div className="contact-two__input-box">
                                                <input list="cities" value={form.villeArrivee} onChange={set("villeArrivee")}
                                                    placeholder="Ex: Sousse" />
                                            </div>
                                        </div>
                                        <datalist id="cities">
                                            {cities.map(c => <option key={c} value={c} />)}
                                        </datalist>

                                        {distance && (
                                            <div className="col-xl-12" style={{ marginBottom: 20 }}>
                                                <div style={{ ...cardStyle, padding: 15, display: "flex", gap: 30 }}>
                                                    <span>📏 <strong>{distance.distance_km.toFixed(0)} km</strong></span>
                                                    <span>⏱️ ~<strong>{distance.travel_hours.toFixed(1)} h</strong> de trajet</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="col-xl-6">
                                            <label style={{ fontWeight: 600, fontSize: 14 }}>Date & heure de départ</label>
                                            <div className="contact-two__input-box">
                                                <input type="datetime-local" value={form.dateDepart} onChange={set("dateDepart")} />
                                            </div>
                                        </div>
                                        <div className="col-xl-6">
                                            <label style={{ fontWeight: 600, fontSize: 14 }}>Objet (optionnel)</label>
                                            <div className="contact-two__input-box">
                                                <input value={form.objetMission} onChange={set("objetMission")}
                                                    placeholder="Ex: Livraison marchandise" />
                                            </div>
                                        </div>
                                        <div className="col-xl-12 text-center">
                                            <button type="button" className="thm-btn contact-two__btn" onClick={goStep2}>
                                                Étape 2 →<span />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── ÉTAPE 2 : Véhicule & paramètres ─────── */}
                            {step === 2 && (
                                <div className="contact-two__form">
                                    <div className="row">
                                        <div className="col-xl-6">
                                            <label style={{ fontWeight: 600, fontSize: 14 }}>Type de véhicule</label>
                                            <div className="contact-two__input-box">
                                                <select value={form.vehicleType} onChange={set("vehicleType")}
                                                    style={{ width: "100%", height: 60, border: "none", background: "#f4f5f8", padding: "0 20px" }}>
                                                    {VEHICLE_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-xl-3 col-6">
                                            <label style={{ fontWeight: 600, fontSize: 14 }}>Passagers</label>
                                            <div className="contact-two__input-box">
                                                <input type="number" min={1} max={50} value={form.passagers} onChange={set("passagers")} />
                                            </div>
                                        </div>
                                        <div className="col-xl-3 col-6">
                                            <label style={{ fontWeight: 600, fontSize: 14 }}>Fret (kg)</label>
                                            <div className="contact-two__input-box">
                                                <input type="number" min={0} step={10} value={form.poidsFret} onChange={set("poidsFret")} />
                                            </div>
                                        </div>
                                        <div className="col-xl-12" style={{ marginBottom: 20 }}>
                                            <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                                                <input type="checkbox" checked={form.autoroute} onChange={set("autoroute")} />
                                                🛣️ Trajet par autoroute (péage inclus dans l&apos;estimation)
                                            </label>
                                        </div>
                                        <div className="col-xl-12 text-center" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                                            <button type="button" className="thm-btn" onClick={() => setStep(1)}
                                                style={{ background: "#6b7280", padding: "12px 25px" }}>
                                                ← Retour<span />
                                            </button>
                                            <button type="button" className="thm-btn contact-two__btn" onClick={goStep3} disabled={loading}>
                                                {loading ? "Estimation IA…" : "Étape 3 →"}<span />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── ÉTAPE 3 : Estimation & confirmation ─── */}
                            {step === 3 && prediction && (
                                <div>
                                    <div style={{ ...cardStyle, marginBottom: 20, textAlign: "center" }}>
                                        <p style={{ color: "#6b7280", marginBottom: 5 }}>💡 Prix estimé par l&apos;IA XPARK</p>
                                        <p style={{ fontSize: 42, fontWeight: 800, color: "#0d6efd", marginBottom: 5 }}>
                                            {prediction.predicted_cost_tnd.toFixed(2)} TND
                                        </p>
                                        <p style={{ fontSize: 13, color: "#6b7280" }}>
                                            Carburant {prediction.fuel_cost_tnd?.toFixed(0)} · Main-d&apos;œuvre {prediction.labor_cost_tnd?.toFixed(0)}
                                            {prediction.toll_cost_tnd > 0 && <> · Péage {prediction.toll_cost_tnd.toFixed(0)}</>} TND
                                        </p>
                                    </div>

                                    <div style={{ ...cardStyle, marginBottom: 25 }}>
                                        <h4 style={{ fontSize: 17, marginBottom: 12 }}>📋 Récapitulatif</h4>
                                        <table style={{ width: "100%", fontSize: 14 }}>
                                            <tbody>
                                                <tr><td style={{ color: "#6b7280", padding: 4 }}>Trajet</td>
                                                    <td><strong>{form.villeDepart} → {form.villeArrivee}</strong> ({distance?.distance_km.toFixed(0)} km)</td></tr>
                                                <tr><td style={{ color: "#6b7280", padding: 4 }}>Départ</td>
                                                    <td>{new Date(form.dateDepart).toLocaleString("fr-FR")}</td></tr>
                                                <tr><td style={{ color: "#6b7280", padding: 4 }}>Véhicule</td>
                                                    <td>{VEHICLE_TYPES.find(v => v.value === form.vehicleType)?.label}</td></tr>
                                                <tr><td style={{ color: "#6b7280", padding: 4 }}>Passagers / Fret</td>
                                                    <td>{form.passagers} passager(s) · {form.poidsFret} kg</td></tr>
                                            </tbody>
                                        </table>
                                        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 12, marginBottom: 0 }}>
                                            ℹ️ Votre demande sera <strong>EN ATTENTE</strong> : notre système intelligent
                                            (OptimisateurFlotteIA) lui affectera le véhicule le plus adapté et un chauffeur
                                            disponible. Vous suivrez tout depuis «&nbsp;Mes missions&nbsp;».
                                        </p>
                                    </div>

                                    <div className="text-center" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                                        <button type="button" className="thm-btn" onClick={() => setStep(2)}
                                            style={{ background: "#6b7280", padding: "12px 25px" }}>
                                            ← Retour<span />
                                        </button>
                                        <button type="button" className="thm-btn contact-two__btn" onClick={confirm} disabled={loading}>
                                            {loading ? "Création…" : "✅ Confirmer la réservation"}<span />
                                        </button>
                                    </div>
                                    <p className="text-center" style={{ marginTop: 15 }}>
                                        <Link href="/account">← Retour à mon compte</Link>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    )
}
