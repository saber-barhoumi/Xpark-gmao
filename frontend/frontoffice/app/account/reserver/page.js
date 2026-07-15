"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { aiService } from "@/lib/missionService"
import transportRequestService from "@/lib/transportRequestService"
import ClientPortalLayout from "@/components/portal/ClientPortalLayout"

const VEHICLE_TYPES = [
    { value: "BERLINE", label: "🚗 Berline (léger)" },
    { value: "UTILITAIRE", label: "🚐 Utilitaire" },
    { value: "VAN", label: "🚐 Van / Minibus" },
    { value: "CAMION", label: "🚚 Camion" },
]

const cardStyle = { background: "var(--pcard)", border: "1px solid var(--pborder)", borderRadius: 12, padding: 25 }

// Marge d'affichage de la fourchette IA (preview seulement — la valeur qui fait foi
// est calculée et stockée côté serveur, voir Mission.API/Services/AiPriceRangeCalculator.cs).
// Garder ces deux constantes synchronisées si la marge change un jour.
const PRICE_RANGE_MARGIN = 0.08

/**
 * Demander un transport — wizard 3 étapes (fiche FRONTOFFICE §4.4) :
 * 1. Trajet & date · 2. Véhicule & paramètres · 3. Estimation IA & envoi.
 * Ne crée PAS de mission : soumet une Demande de Transport (devis) que
 * l'administrateur chiffrera avant de vous l'envoyer pour acceptation.
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
        aiService.getCities().then(setCities).catch(() => {})
    }, [])

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
            await transportRequestService.submit({
                dateSouhaitee: form.dateDepart,
                villeDepart: form.villeDepart,
                villeArrivee: form.villeArrivee,
                cargoDescription: form.objetMission || `Transport ${form.villeDepart} → ${form.villeArrivee}`,
                cargoWeightKg: Number(form.poidsFret) || 0,
                passengerCount: Number(form.passagers) || 1,
                vehicleTypeRequested: form.vehicleType,
                distanceKm: distance?.distance_km ?? 0,
                aiEstimatedPrice: prediction?.predicted_cost_tnd ?? 0,
                aiVehicleTypeRecommended: prediction?.vehicle_type_used,
            })
            router.push("/account/demandes?created=1")
        } catch (err) {
            setError(err.message || "Erreur lors de l'envoi de la demande.")
        } finally { setLoading(false) }
    }

    return (
        <ClientPortalLayout title="🚗 Réserver un véhicule">
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <div style={{ maxWidth: 800 }}>
                    <div style={{ maxWidth: 800 }}>
                        <div>
                            <div style={{ textAlign: "center", marginBottom: 20 }}>
                                {/* Progress 1/3 → 3/3 */}
                                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                                    {[1, 2, 3].map(n => (
                                        <span key={n} style={{
                                            width: 90, height: 6, borderRadius: 3,
                                            background: step >= n ? "#C11425" : "var(--pborder)",
                                        }} />
                                    ))}
                                </div>
                                <p style={{ marginTop: 8, color: "var(--pmuted)", fontSize: 14 }}>
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
                                        <p style={{ color: "#6b7280", marginBottom: 5 }}>💡 Estimation IA XPARK (indicative)</p>
                                        <p style={{ fontSize: 36, fontWeight: 800, color: "#0d6efd", marginBottom: 5 }}>
                                            {(prediction.predicted_cost_tnd * (1 - PRICE_RANGE_MARGIN)).toFixed(0)}
                                            {" – "}
                                            {(prediction.predicted_cost_tnd * (1 + PRICE_RANGE_MARGIN)).toFixed(0)} TND
                                        </p>
                                        <p style={{ fontSize: 13, color: "#6b7280" }}>
                                            Fourchette indicative — pas le prix final. Un devis précis vous sera envoyé par notre équipe.
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
                                            ℹ️ Votre demande sera envoyée à notre équipe, qui vous enverra un <strong>devis
                                            précis</strong> à accepter ou refuser depuis «&nbsp;Mes demandes&nbsp;». Aucune
                                            mission n&apos;est créée avant votre acceptation du devis.
                                        </p>
                                    </div>

                                    <div className="text-center" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                                        <button type="button" className="thm-btn" onClick={() => setStep(2)}
                                            style={{ background: "#6b7280", padding: "12px 25px" }}>
                                            ← Retour<span />
                                        </button>
                                        <button type="button" className="thm-btn contact-two__btn" onClick={confirm} disabled={loading}>
                                            {loading ? "Envoi…" : "📤 Envoyer ma demande"}<span />
                                        </button>
                                    </div>
                                    <p className="text-center" style={{ marginTop: 15 }}>
                                        <Link href="/account" style={{ color: "#0d6efd" }}>← Retour au tableau de bord</Link>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ClientPortalLayout>
    )
}
