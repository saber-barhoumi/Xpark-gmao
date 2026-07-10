"use client"

/**
 * assistantEngine — cerveau de l'assistant IA du portail client.
 * Séparé de l'UI (app/account/assistant/page.js) pour garder le projet organisé.
 *
 * Capacités :
 *  1. Estimation de prix réelle : détecte deux villes dans la question, interroge
 *     CalculateurPrixTrajetIA (/distance puis /predict) et répond prix + durée.
 *  2. Réponses guidées (réservation, suivi, annulation, factures, documents, contact).
 * Retour : { text, links?, quickReplies? } — l'UI ne fait qu'afficher.
 */

import { aiService } from "./missionService"

/** Suggestions affichées au démarrage et en fallback */
export const QUICK_REPLIES = [
    "Combien coûte un transport Tunis → Sfax ?",
    "Comment réserver un transport ?",
    "Où en est ma livraison ?",
    "Comment annuler une réservation ?",
    "Où trouver mes factures ?",
]

export const WELCOME = {
    text: "Bonjour 👋 Je suis l'assistant XPARK. Je peux estimer le prix d'un trajet "
        + "(ex : « Combien coûte Tunis → Sousse ? ») et vous guider dans votre espace client.",
    quickReplies: QUICK_REPLIES,
}

/** Minuscules sans accents, pour un matching robuste des villes et mots-clés */
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

let citiesCache = null
async function getCities() {
    if (!citiesCache) {
        try { citiesCache = await aiService.getCities() } catch { citiesCache = [] }
    }
    return citiesCache
}

/** Détecte jusqu'à 2 villes connues dans le texte, dans leur ordre d'apparition */
async function detectCities(text) {
    const t = norm(text)
    const cities = await getCities()
    const found = []
    for (const c of cities) {
        const idx = t.indexOf(norm(c))
        if (idx >= 0) found.push({ city: c, idx })
    }
    // Ville la plus longue prioritaire quand deux noms se chevauchent (ex. "Ben Arous"/"Arous")
    found.sort((a, b) => a.idx - b.idx || norm(b.city).length - norm(a.city).length)
    const uniques = []
    for (const f of found) {
        if (!uniques.some(u => u.idx <= f.idx && f.idx < u.idx + norm(u.city).length)) uniques.push(f)
        if (uniques.length === 2) break
    }
    return uniques.map(u => u.city)
}

const has = (t, ...words) => words.some(w => t.includes(w))

/**
 * Traite un message utilisateur → réponse de l'assistant.
 * Toujours résolue (jamais de throw) : les erreurs deviennent des réponses polies.
 */
export async function reply(message) {
    const t = norm(message)

    // ── 1. Estimation de prix (intention prioritaire si 2 villes détectées) ──
    const wantsPrice = has(t, "prix", "cout", "coute", "tarif", "estimation", "combien", "devis")
    const villes = await detectCities(message)

    if (villes.length === 2) {
        try {
            const [dist, pred] = await Promise.all([
                aiService.getDistance(villes[0], villes[1]),
                aiService.predictPrice({
                    departure: villes[0], arrival: villes[1],
                    date_depart: new Date(Date.now() + 24 * 3600_000).toISOString(),
                    vehicle_type_gmao: "FOURGON", has_autoroute: false,
                    cargo_weight: 500, passenger_count: 1,
                }),
            ])
            const h = Math.floor(dist.travel_hours || 0)
            const mn = Math.round(((dist.travel_hours || 0) - h) * 60)
            return {
                text: `🧮 Estimation pour ${villes[0]} → ${villes[1]} :\n`
                    + `• Prix estimé : ${(pred.predicted_cost_tnd ?? 0).toFixed(0)} TND (fourgon, 500 kg)\n`
                    + `• Distance : ${(dist.distance_km ?? 0).toFixed(0)} km\n`
                    + `• Durée estimée : ${h > 0 ? `${h} h ${mn > 0 ? `${mn} min` : ""}` : `${mn} min`}\n\n`
                    + "Le prix exact dépend du véhicule et du poids : lancez une réservation pour une estimation précise.",
                links: [{ label: "🚗 Réserver ce trajet", href: "/account/reserver" }],
                quickReplies: ["Comment réserver un transport ?", "Où en est ma livraison ?"],
            }
        } catch {
            return {
                text: `Je n'ai pas pu estimer ${villes[0]} → ${villes[1]} (service IA momentanément indisponible). `
                    + "Réessayez dans un instant ou lancez directement une réservation.",
                links: [{ label: "🚗 Réserver un transport", href: "/account/reserver" }],
            }
        }
    }

    if (wantsPrice) {
        return {
            text: "Pour estimer un prix, indiquez-moi les deux villes du trajet, par exemple :\n"
                + "« Combien coûte un transport Tunis → Sfax ? »",
            quickReplies: ["Combien coûte un transport Tunis → Sfax ?", "Combien coûte Sousse → Gabès ?"],
        }
    }

    // ── 2. Intentions guidées ────────────────────────────────────────────────
    if (has(t, "reserver", "reservation", "commander", "nouveau transport", "louer"))
        return {
            text: "Pour réserver : Espace client → Réserver. Choisissez vos villes, la date et le type "
                + "de marchandises ; notre IA calcule immédiatement le prix estimé, puis votre demande "
                + "est validée et affectée à un chauffeur.",
            links: [{ label: "➕ Réserver maintenant", href: "/account/reserver" }],
        }

    if (has(t, "suivi", "suivre", "livraison", "ou en est", "position", "en cours", "track"))
        return {
            text: "Le suivi en direct affiche la progression de chaque mission : affectation du chauffeur, "
                + "départ, trajet en cours et arrivée estimée. La page s'actualise automatiquement toutes les 30 s.",
            links: [{ label: "📍 Ouvrir le suivi en direct", href: "/account/tracking" }],
        }

    if (has(t, "annuler", "annulation", "supprimer ma"))
        return {
            text: "Vous pouvez annuler une réservation tant qu'elle est « en attente » (avant affectation "
                + "d'un chauffeur) depuis Mes missions → bouton Annuler. Une fois la mission en cours, "
                + "contactez le support.",
            links: [{ label: "🚚 Mes missions", href: "/account/missions" },
                    { label: "🎫 Contacter le support", href: "/account/support" }],
        }

    if (has(t, "facture", "payer", "paiement", "impaye", "finance"))
        return {
            text: "Vos factures et l'ensemble de vos dépenses sont dans l'onglet Finances : montants TTC, "
                + "échéances et statuts de paiement. Chaque facture est téléchargeable en PDF depuis Documents.",
            links: [{ label: "💰 Mes finances", href: "/account/finances" },
                    { label: "📄 Mes documents", href: "/account/documents" }],
        }

    if (has(t, "document", "attestation", "ordre de mission", "pdf", "telecharger"))
        return {
            text: "L'onglet Documents regroupe vos ordres de mission, attestations de transport et factures, "
                + "générés automatiquement et téléchargeables en PDF.",
            links: [{ label: "📄 Mes documents", href: "/account/documents" }],
        }

    if (has(t, "statistique", "analyse", "depense", "kilometre", "bilan"))
        return {
            text: "L'onglet Analyses présente vos indicateurs : missions par mois, kilomètres parcourus, "
                + "dépenses mensuelles et trajets les plus fréquents.",
            links: [{ label: "📊 Mes analyses", href: "/account/analytics" }],
        }

    if (has(t, "probleme", "reclamation", "support", "aide", "assistance", "contact", "telephone", "appeler"))
        return {
            text: "Notre équipe est joignable au +216 70 000 000 (contact@xpark.tn). Pour une demande suivie, "
                + "ouvrez un ticket : vous verrez la réponse du support directement dans votre espace.",
            links: [{ label: "🎫 Ouvrir un ticket support", href: "/account/support" }],
        }

    if (has(t, "delai", "temps", "duree", "quand"))
        return {
            text: "Les délais dépendent du trajet : ils sont estimés lors de la réservation (distance et durée "
                + "calculées par notre IA) puis suivis en temps réel dans Suivi en direct.",
            links: [{ label: "📍 Suivi en direct", href: "/account/tracking" }],
        }

    if (has(t, "bonjour", "salut", "hello", "bonsoir", "merci"))
        return {
            text: has(t, "merci")
                ? "Avec plaisir ! 😊 Autre chose ?"
                : "Bonjour ! 👋 Comment puis-je vous aider ?",
            quickReplies: QUICK_REPLIES,
        }

    // ── 3. Fallback ──────────────────────────────────────────────────────────
    return {
        text: "Je n'ai pas bien compris. 🤔 Je peux estimer un prix de trajet (donnez-moi deux villes) "
            + "ou vous guider : réservation, suivi, factures, documents, support…",
        quickReplies: QUICK_REPLIES,
    }
}
