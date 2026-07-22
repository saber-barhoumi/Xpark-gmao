/** Miroir des DTOs de PredictionPanne.API (casing JSON par défaut d'ASP.NET Core). */

export enum NiveauRisque {
    FAIBLE   = 'FAIBLE',
    MODERE   = 'MODERE',
    ELEVE    = 'ELEVE',
    CRITIQUE = 'CRITIQUE',
}

export interface Prediction {
    idPrediction:               number
    vehiculeId:                 number
    immatriculation:            string
    marque:                     string
    modele:                     string
    typePanne:                  string
    niveauRisque:               NiveauRisque
    probabilite:                number      // 0..1
    scoreConfiance:             number      // 0..1
    datePanneEstimee?:          string | null
    dateMaintenanceRecommandee?: string | null
    dureeVieRestanteJours?:     number | null
    kilometrageRestant?:        number | null
    pieceARemplacer?:           string | null
    explication:                string
    recommandation:             string
    source:                     string      // REGLES | MODELE_ML
    versionModele:              string
    dateCalcul:                 string
}

export interface SanteVehicule {
    vehiculeId:                      number
    immatriculation:                 string
    marque:                          string
    modele:                          string
    anneeConstruction:               number
    kilometrage:                     number
    scoreSante:                      number   // 0..100
    niveauRisque:                    NiveauRisque
    nombrePredictions:               number
    prochaineMaintenanceRecommandee?: string | null
    dureeVieRestanteJours?:          number | null
    predictions:                     Prediction[]
}

export interface Repartition { libelle: string; nombre: number }

export interface PredictionDashboard {
    nombreVehiculesAnalyses:       number
    nombreVehiculesARisque:        number
    scoreSanteMoyen:               number
    nombrePredictionsActives:      number
    maintenancesA30Jours:          number
    coutMaintenanceEvitePotentiel: number
    repartitionRisque:             Repartition[]
    repartitionTypePanne:          Repartition[]
    classementVehicules:           SanteVehicule[]
}

export interface RecalculResultat {
    vehiculesAnalyses:   number
    predictionsGenerees: number
    versionModele:       string
    dateCalcul:          string
}

/** Couleurs du design system par niveau de risque — source unique. */
export const RISQUE_COULEUR: Record<NiveauRisque, string> = {
    [NiveauRisque.FAIBLE]:   'success',
    [NiveauRisque.MODERE]:   'warning',
    [NiveauRisque.ELEVE]:    'orange',
    [NiveauRisque.CRITIQUE]: 'danger',
}

/** Libellés FR des organes.  */
export const ORGANE_LABEL: Record<string, string> = {
    MOTEUR:          'Moteur',
    FREINS:          'Freinage',
    PNEUMATIQUES:    'Pneumatiques',
    TRANSMISSION:    'Transmission',
    SUSPENSION:      'Suspension',
    ELECTRIQUE:      'Électrique',
    REFROIDISSEMENT: 'Refroidissement',
    CLIMATISATION:   'Climatisation',
    AUTRE:           'Autre',
}
