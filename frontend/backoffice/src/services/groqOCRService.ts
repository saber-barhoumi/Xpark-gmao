// src/services/groqOCRService.ts

// ── Types ────────────────────────────────────────────────────
export type DocumentType =
  | 'CARTE_GRISE'
  | 'ASSURANCE'
  | 'VIGNETTE'
  | 'VISITE_TECHNIQUE'
  | 'PERMIS_CONDUIRE'
  | 'TICKET_CARBURANT'
  | 'AUTO'

export interface ExtractedOCRData {
  // Vehicle fields
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
  
  // Fuel fields
  quantite?:                number
  prixUnitaire?:            number
  montantTotal?:            number
  dateRemplissage?:         string

  // Driver fields
  nom?:                     string
  prenom?:                  string
  numeroPermis?:            string
  categoriePermis?:         string
  dateExpirationPermis?:    string

  // Meta
  documentDetecte?:         DocumentType
  confidence?:              number
  champsNonLus?:            string[]
}

// ── Groq API Settings ────────────────────────────────────────
// Using import.meta.env for Vite to access env vars safely without exposing them in codebase directly
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const GROQ_TEXT_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.1-8b-instant'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const cleanJson = (text: string): ExtractedOCRData => {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON introuvable dans la réponse')
  return JSON.parse(match[0])
}

/** Convert a File to a base64 data URL string */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Check if the file is an image type supported by the vision model */
const isImageFile = (file: File): boolean => {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
}

// ── SERVICE ──────────────────────────────────────────────────
const groqOCRService = {

  async extractFromDocument(
    file: File,
    docType: DocumentType = 'AUTO'
  ): Promise<ExtractedOCRData> {

    if (file.size > 20 * 1024 * 1024)
      throw new Error('Fichier trop volumineux (max 20 Mo)')

    // Use the VISION model for images, text model as fallback for PDFs
    const useVision = isImageFile(file)
    const model = useVision ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL

    console.info(`[Groq OCR] 🔄 Extraction avec ${model} (vision: ${useVision}) pour type: ${docType}`)

    const systemPrompt = `Tu es le module OCR avancé de XPARK GMAO.
Tu dois analyser l'image du document fourni et extraire TOUTES les données visibles.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT avec un objet JSON plat valide — aucun texte autour, aucun markdown. N'utilise pas d'objets imbriqués.
2. Lis ATTENTIVEMENT chaque valeur visible sur le document (chiffres, textes, dates).
3. Utilise STRICTEMENT ET EXACTEMENT ces noms de clés pour le JSON (n'invente pas de clés) :
   - Pour un véhicule: "immatriculation", "marque", "modele", "vin", "datePremiereCirculation", "couleur", "carburant"
   - Pour un carburant: "quantite", "prixUnitaire", "montantTotal", "dateRemplissage" (format "YYYY-MM-DD"), "carburant"
   - Pour un chauffeur (PERMIS TUNISIEN): 
      * "nom" (correspond au champ "1." sur le permis)
      * "prenom" (correspond au champ "2." sur le permis)
      * "numeroPermis" (correspond au champ "5." sur le permis, c'est le numéro unique)
      * "categoriePermis" (correspond au champ "9.", ex: "A", "B", "A B H")
      * "dateExpirationPermis" (correspond au champ "4b.", à convertir au format "YYYY-MM-DD")
      * ATTENTION: "A.T.T.T" signifie Agence Technique des Transports Terrestres, CE N'EST PAS UN NOM NI UN PRÉNOM !
4. Ajoute toujours ces 2 clés:
   - "documentDetecte": le type détecté (ex: "TICKET_CARBURANT", "CARTE_GRISE", "PERMIS_CONDUIRE")
   - "confidence": nombre décimal entre 0.85 et 0.99
5. Les dates doivent être TOUJOURS au format "YYYY-MM-DD" (ex: 2033-05-07).
6. Les nombres DOIVENT être des nombres (pas entre guillemets). Utilise un point décimal (ex: 929.36, pas "929,36").
7. IMPORTANT: Ne retourne QUE l'objet JSON. Commence par { et termine par }.`

    try {
      let messages: any[]

      if (useVision) {
        // ── VISION: Send image as base64 to the vision model ──
        const base64Url = await fileToBase64(file)
        console.info(`[Groq OCR] 📷 Image convertie en base64 (${(base64Url.length / 1024).toFixed(0)} Ko)`)

        messages = [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyse cette image de document (type attendu: ${docType}). Extrais TOUTES les données visibles et retourne-les en JSON.`
              },
              {
                type: 'image_url',
                image_url: { url: base64Url }
              }
            ]
          }
        ]
      } else {
        // ── TEXT FALLBACK: For PDFs and non-image files ──
        messages = [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Génère le JSON d'extraction pour le fichier "${file.name}" de type ${docType}. Génère des données réalistes pour la Tunisie.`
          }
        ]
      }

      const body = {
        model,
        messages,
        temperature: 0.1,
        max_tokens: 1024,
      }

      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const result = await res.json()
        const text = result.choices?.[0]?.message?.content
        if (text) {
          console.info(`[Groq OCR] ✅ Réponse brute:`, text)
          const parsed = cleanJson(text)
          console.info(`[Groq OCR] ✅ Données extraites:`, parsed)
          return parsed
        }
      }

      const errBody = await res.json().catch(() => ({}))
      console.error(`[Groq OCR] ❌ Erreur API:`, errBody)
      throw new Error(errBody?.error?.message ?? res.statusText)

    } catch (e: any) {
      console.error(`[Groq OCR] ❌ Exception:`, e)
      throw new Error(`Erreur OCR Groq: ${e.message}`)
    }
  },
}

export default groqOCRService
