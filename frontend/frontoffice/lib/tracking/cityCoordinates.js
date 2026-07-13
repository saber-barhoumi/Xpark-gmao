"use client"

/**
 * Coordonnées [lat, lng] des villes / délégations tunisiennes utilisées par
 * XPARK. Sert à géolocaliser départ et arrivée sur la carte de suivi.
 *
 * Extensible : ajouter une entrée suffit. La résolution est tolérante
 * (minuscules, sans accents, alias). Repli sur le chef-lieu de gouvernorat
 * puis sur Tunis si la ville est inconnue — la carte reste toujours affichable.
 */

export const CITY_COORDS = {
    // ── Grand Tunis ──
    "tunis": [36.8065, 10.1815],
    "bab bhar": [36.7985, 10.1795],
    "ariana": [36.8625, 10.1956],
    "ariana city": [36.8625, 10.1956],
    "ettadhamen": [36.8756, 10.0963],
    "ettadhamen ariana": [36.8756, 10.0963],
    "douar hicher": [36.8360, 10.0960],
    "manouba": [36.8101, 10.0956],
    "la marsa": [36.8783, 10.3247],
    "ben arous": [36.7533, 10.2189],
    "rades": [36.7680, 10.2760],
    "megrine": [36.7690, 10.2340],
    // ── Nord-Est ──
    "nabeul": [36.4560, 10.7376],
    "hammamet": [36.4000, 10.6167],
    "zaghouan": [36.4029, 10.1429],
    "bizerte": [37.2744, 9.8739],
    // ── Nord-Ouest ──
    "beja": [36.7256, 9.1817],
    "jendouba": [36.5011, 8.7803],
    "ain draham": [36.7772, 8.6889],
    "le kef": [36.1742, 8.7049],
    "kef": [36.1742, 8.7049],
    "siliana": [36.0849, 9.3708],
    // ── Sahel & Centre-Est ──
    "sousse": [35.8256, 10.6412],
    "hammam sousse": [35.8600, 10.5940],
    "akouda": [35.8700, 10.5670],
    "kalaa kebira": [35.8720, 10.5350],
    "msaken": [35.7290, 10.5790],
    "bouficha": [36.2986, 10.4520],
    "enfidha": [36.1350, 10.3800],
    "monastir": [35.7643, 10.8113],
    "mahdia": [35.5047, 11.0622],
    // ── Centre ──
    "kairouan": [35.6781, 10.0963],
    "bou hajla": [35.2460, 9.8330],
    "sidi bouzid": [35.0382, 9.4849],
    "kasserine": [35.1676, 8.8365],
    // ── Sud-Est ──
    "sfax": [34.7406, 10.7603],
    "agareb": [34.7460, 10.5300],
    "gabes": [33.8815, 10.0982],
    "medenine": [33.3399, 10.4917],
    "djerba": [33.8076, 10.8451],
    "houmt souk": [33.8756, 10.8571],
    "zarzis": [33.5039, 11.1122],
    "tataouine": [32.9297, 10.4518],
    // ── Sud-Ouest ──
    "gafsa": [34.4250, 8.7842],
    "tozeur": [33.9197, 8.1335],
    "kebili": [33.7047, 8.9690],
}

// Repli par gouvernorat (mot-clé contenu dans le nom) → chef-lieu
const GOV_FALLBACK = [
    ["ariana", [36.8625, 10.1956]],
    ["sousse", [35.8256, 10.6412]],
    ["sfax", [34.7406, 10.7603]],
    ["gabes", [33.8815, 10.0982]],
    ["nabeul", [36.4560, 10.7376]],
    ["bizerte", [37.2744, 9.8739]],
    ["kairouan", [35.6781, 10.0963]],
    ["tunis", [36.8065, 10.1815]],
]

const DEFAULT = [36.8065, 10.1815] // Tunis

function normalize(name) {
    return (name || "")
        .toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

/** Résout une ville en [lat, lng]. Toujours une valeur (repli gracieux). */
export function resolveCity(name) {
    const n = normalize(name)
    if (!n) return DEFAULT
    if (CITY_COORDS[n]) return CITY_COORDS[n]

    // Essai sur le premier mot (ex. "Sfax Ville" → "sfax")
    const first = n.split(" ")[0]
    if (CITY_COORDS[first]) return CITY_COORDS[first]

    // Repli par gouvernorat contenu dans le nom
    for (const [kw, coord] of GOV_FALLBACK) {
        if (n.includes(kw)) return coord
    }
    return DEFAULT
}
