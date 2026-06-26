// src/services/geminiOCRService.ts
// VERSION GROK ONLY — Modèles vision xAI officiels (avril 2026)

// ── xAI Grok ─────────────────────────────────────────────────
const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY || ''
const GROK_URL     = 'https://api.x.ai/v1/chat/completions'

// ✅ MODÈLES OFFICIELS avec support image (text + image → text)
// Source : https://docs.x.ai/developers/models
const GROK_MODELS = [
  'grok-4-1-fast-non-reasoning',  // Le plus rapide, $0.20/1M, 2M context, vision ✅
  'grok-4-1-fast-reasoning',      // Avec raisonnement, même prix, vision ✅
  'grok-4.20-0309-non-reasoning', // Flagship, plus cher mais très précis, vision ✅
]

// ── Types ────────────────────────────────────────────────────
export type DocumentType =
  | 'CARTE_GRISE'
  | 'ASSURANCE'
  | 'VIGNETTE'
  | 'VISITE_TECHNIQUE'
  | 'AUTO'

export interface ExtractedVehicleData {
  immatriculation?:         string
  marque?:                  string
  modele?:                  string
  variante?:                string
  annee?:                   number
  datePremiereCirculation?: string
  vin?:                     string
  puissanceFiscale?:        number
  puissanceMoteur?:         number
  carburant?:               string
  couleur?:                 string
  nombrePlaces?:            number
  poidsVide?:               number
  poidsTotalCharge?:        number
  proprietaire?:            string
  adresseProprietaire?:     string
  typeVehicule?:            string
  categorie?:               string
  assuranceCompagnie?:      string
  assuranceNumero?:         string
  assuranceType?:           string
  assuranceDateDebut?:      string
  assuranceDateFin?:        string
  assurancePrime?:          number
  vignetteAnnee?:           number
  vignetteNumero?:          string
  vignetteMontant?:         number
  visiteDateDerniere?:      string
  visiteDateProchaine?:     string
  visiteCentreControle?:    string
  visiteResultat?:          string
  visiteNumero?:            string
  documentDetecte?:         DocumentType
  confidence?:              number
  champsNonLus?:            string[]
}

// ── Prompt OCR ────────────────────────────────────────────────
const OCR_PROMPT = `Tu es un expert OCR spécialisé dans les documents de véhicules tunisiens.
Analyse cette image et extrait TOUTES les informations visibles (texte arabe ET français).

RÈGLES STRICTES :
1. Réponds UNIQUEMENT avec un JSON valide — aucun markdown, aucun commentaire
2. Champ absent ou illisible = null (jamais une chaîne vide)
3. Dates format "DD/MM/YYYY"
4. Immatriculation tunisienne ex : "119 TUN 3025"
5. Pour la marque, normalise : MAZDA, VOLKSWAGEN, RENAULT, PEUGEOT, etc.
6. documentDetecte = "CARTE_GRISE" | "ASSURANCE" | "VIGNETTE" | "VISITE_TECHNIQUE"
7. confidence = nombre entre 0 et 1 selon ta certitude

Retourne EXACTEMENT ce JSON (remplace null par les valeurs trouvées) :
{
  "immatriculation": null,
  "marque": null,
  "modele": null,
  "variante": null,
  "vin": null,
  "annee": null,
  "datePremiereCirculation": null,
  "carburant": null,
  "couleur": null,
  "puissanceFiscale": null,
  "puissanceMoteur": null,
  "nombrePlaces": null,
  "poidsVide": null,
  "poidsTotalCharge": null,
  "typeVehicule": null,
  "categorie": null,
  "proprietaire": null,
  "adresseProprietaire": null,
  "assuranceCompagnie": null,
  "assuranceNumero": null,
  "assuranceType": null,
  "assuranceDateDebut": null,
  "assuranceDateFin": null,
  "assurancePrime": null,
  "vignetteAnnee": null,
  "vignetteNumero": null,
  "vignetteMontant": null,
  "visiteDateDerniere": null,
  "visiteDateProchaine": null,
  "visiteCentreControle": null,
  "visiteResultat": null,
  "visiteNumero": null,
  "documentDetecte": null,
  "confidence": null
}`

// ── Helpers ──────────────────────────────────────────────────
const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // xAI accepte uniquement jpg/jpeg et png
      const rawMime = file.type || 'image/jpeg'
      const safeMime = rawMime.includes('png') ? 'image/png' : 'image/jpeg'
      resolve({ data: result.split(',')[1], mimeType: safeMime })
    }
    reader.onerror = () => reject(new Error('Erreur lecture fichier'))
    reader.readAsDataURL(file)
  })

const cleanJson = (text: string): ExtractedVehicleData => {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON introuvable dans la réponse')
  return JSON.parse(match[0])
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── SERVICE ──────────────────────────────────────────────────
const geminiOCRService = {

  async extractFromDocument(
    file: File,
    _docType: DocumentType = 'AUTO'
  ): Promise<ExtractedVehicleData> {

    if (file.size > 20 * 1024 * 1024)
      throw new Error('Fichier trop volumineux (max 20 Mo)')

    const { data: base64, mimeType } = await fileToBase64(file)

    let lastError: Error = new Error('Aucun modèle disponible')

    for (let i = 0; i < GROK_MODELS.length; i++) {
      const model = GROK_MODELS[i]
      console.info(`[Grok] 🔄 Tentative ${i + 1}/${GROK_MODELS.length} — ${model}...`)

      const body = {
        model,
        messages: [{
          role: 'user',
          content: [
            {
              type:      'image_url',
              image_url: {
                url:    `data:${mimeType};base64,${base64}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: OCR_PROMPT,
            },
          ],
        }],
        temperature: 0.1,
        max_tokens:  2048,
        stream:      false,
      }

      try {
        const res = await fetch(GROK_URL, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${GROK_API_KEY}`,
          },
          body: JSON.stringify(body),
        })

        if (res.ok) {
          const result = await res.json()
          const text   = result.choices?.[0]?.message?.content
          if (text) {
            console.info(`[Grok] ✅ Succès avec ${model}`)
            return cleanJson(text)
          }
          console.warn(`[Grok] Réponse vide de ${model}`)
          lastError = new Error(`Réponse vide de ${model}`)
          continue
        }

        const errBody = await res.json().catch(() => ({}))
        const errMsg  = errBody?.error?.message ?? res.statusText
        console.warn(`[Grok] ${res.status} ${model}: ${errMsg}`)

        if (res.status === 429) {
          const wait = (i + 1) * 5000 // 5s, 10s, 15s
          console.warn(`[Grok] ⏳ Rate limit — attente ${wait / 1000}s...`)
          await sleep(wait)
          lastError = new Error(`Rate limit (429): ${errMsg}`)
          continue
        }

        if (res.status === 401) {
          throw new Error('Clé API xAI invalide — vérifier sur https://console.x.ai/')
        }

        lastError = new Error(`Grok ${res.status}: ${errMsg}`)
        continue

      } catch (e: any) {
        lastError = e
        if (i < GROK_MODELS.length - 1) {
          console.warn(`[Grok] Erreur ${model}: ${e.message} — tentative suivante`)
          continue
        }
      }
    }

    throw new Error(
      `OCR échoué. Dernière erreur: ${lastError.message}\n` +
      `Si le problème persiste, vérifiez les crédits sur https://console.x.ai/`
    )
  },
}

export default geminiOCRService
