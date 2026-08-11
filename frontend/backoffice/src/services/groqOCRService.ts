// src/services/groqOCRService.ts
//
// Lecture assistée des documents administratifs.
//
// CE SERVICE N'APPELLE PLUS LE FOURNISSEUR DIRECTEMENT.
//
// Il l'a fait, et c'était une faille : la clé d'API était lue depuis
// `import.meta.env.VITE_GROQ_API_KEY`, donc figée dans le paquet JavaScript
// à la compilation. Toute personne ouvrant les outils de développement
// pouvait la relever dans le fichier livré et s'en servir sur son propre
// compte, aux frais de l'entreprise.
//
// Aucun réglage ne corrige cela : ce que le navigateur exécute, l'utilisateur
// peut le lire. Une variable « VITE_ » n'est pas un secret, c'est une valeur
// publique. Le document est donc envoyé au service `LecteurDocumentsIA`, qui
// détient la clé et appelle le fournisseur pour le compte du front.
//
// L'appel passe par l'instance axios commune : le jeton de session est joint
// automatiquement, et le service refuse les appels qui n'en portent pas.

import api from '@/lib/axiosConfig'
import { trace } from '@/helpers/journal'

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

// ── Réglages ─────────────────────────────────────────────────
/** Point d'entrée serveur. Le modèle et la clé sont choisis côté serveur. */
const OCR_ENDPOINT = '/ocr/extraire'

const TAILLE_MAX = 20 * 1024 * 1024

/** Types que le modèle de vision sait lire. */
const isImageFile = (file: File): boolean =>
  ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)

// ── SERVICE ──────────────────────────────────────────────────
const groqOCRService = {

  async extractFromDocument(
    file: File,
    docType: DocumentType = 'AUTO'
  ): Promise<ExtractedOCRData> {

    if (file.size > TAILLE_MAX)
      throw new Error('Fichier trop volumineux (20 Mo maximum)')

    // Le PDF n'est pas lisible par le modèle de vision. On le dit clairement
    // plutôt que de basculer sur un modèle de texte : l'ancienne version
    // demandait alors au modèle d'INVENTER « des données réalistes pour la
    // Tunisie », qui venaient ensuite remplir le formulaire comme si elles
    // avaient été lues sur le document.
    if (!isImageFile(file))
      throw new Error(
        'Seules les images sont lisibles (JPEG, PNG, WebP). ' +
        'Pour un PDF, fournissez-en une capture d\'écran.')

    trace(`[OCR] 🔄 Envoi de « ${file.name} » au serveur (type attendu : ${docType})`)

    const formulaire = new FormData()
    formulaire.append('fichier', file)
    formulaire.append('typeDocument', docType)

    try {
      // L'instance axios commune joint le jeton de session ; le service
      // refuse les appels anonymes.
      const { data } = await api.post<ExtractedOCRData>(OCR_ENDPOINT, formulaire, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,          // lecture d'image : bien plus long qu'un appel courant
      })
      trace(`[OCR] ✅ Champs extraits :`, data)
      return data

    } catch (e: any) {
      // Le serveur renvoie un message déjà rédigé pour l'utilisateur ; le
      // détail technique, lui, reste dans le journal du service.
      const message = e?.response?.data?.detail ?? e?.message ?? 'erreur inconnue'
      console.error('[OCR] ❌ Échec de la lecture :', message)
      throw new Error(message)
    }
  },
}

export default groqOCRService
