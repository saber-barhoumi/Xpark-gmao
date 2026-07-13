/**
 * Coordonnées des villes tunisiennes (destinations). Même principe que côté
 * Front Office : résolution tolérante avec repli. Utilisé par l'écran Navigation
 * pour placer la destination et tracer l'itinéraire.
 */

export type LatLng = { latitude: number; longitude: number }

const COORDS: Record<string, [number, number]> = {
    "tunis": [36.8065, 10.1815], "bab bhar": [36.7985, 10.1795],
    "ariana": [36.8625, 10.1956], "ariana city": [36.8625, 10.1956],
    "ettadhamen": [36.8756, 10.0963], "ettadhamen ariana": [36.8756, 10.0963],
    "douar hicher": [36.8360, 10.0960], "manouba": [36.8101, 10.0956],
    "la marsa": [36.8783, 10.3247], "ben arous": [36.7533, 10.2189],
    "nabeul": [36.4560, 10.7376], "hammamet": [36.4000, 10.6167],
    "zaghouan": [36.4029, 10.1429], "bizerte": [37.2744, 9.8739],
    "beja": [36.7256, 9.1817], "jendouba": [36.5011, 8.7803], "le kef": [36.1742, 8.7049],
    "sousse": [35.8256, 10.6412], "hammam sousse": [35.8600, 10.5940],
    "msaken": [35.7290, 10.5790], "bouficha": [36.2986, 10.4520], "enfidha": [36.1350, 10.3800],
    "monastir": [35.7643, 10.8113], "mahdia": [35.5047, 11.0622],
    "kairouan": [35.6781, 10.0963], "bou hajla": [35.2460, 9.8330], "sidi bouzid": [35.0382, 9.4849],
    "kasserine": [35.1676, 8.8365], "sfax": [34.7406, 10.7603], "agareb": [34.7460, 10.5300],
    "gabes": [33.8815, 10.0982], "medenine": [33.3399, 10.4917], "djerba": [33.8076, 10.8451],
    "tataouine": [32.9297, 10.4518], "gafsa": [34.4250, 8.7842], "tozeur": [33.9197, 8.1335],
    "kebili": [33.7047, 8.9690],
}

function normalize(name: string): string {
    return (name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim()
}

export function resolveCity(name?: string): LatLng {
    const n = normalize(name || "")
    const hit = COORDS[n] || COORDS[n.split(" ")[0]] ||
        (["ariana", "sousse", "sfax", "gabes", "nabeul", "bizerte", "kairouan", "tunis"]
            .map((k) => (n.includes(k) ? COORDS[k] : null)).find(Boolean)) ||
        COORDS["tunis"]
    return { latitude: hit![0], longitude: hit![1] }
}
