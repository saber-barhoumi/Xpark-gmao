using PredictionPanne.Domain.Entities;

namespace PredictionPanne.Application.DTOs;

// Une prédiction telle qu'exposée par l'API.
public record PredictionDto(
    long      IdPrediction,
    long      VehiculeId,
    string    Immatriculation,
    string    Marque,
    string    Modele,
    string    TypePanne,
    string    NiveauRisque,
    double    Probabilite,
    double    ScoreConfiance,
    DateTime? DatePanneEstimee,
    DateTime? DateMaintenanceRecommandee,
    int?      DureeVieRestanteJours,
    double?   KilometrageRestant,
    string?   PieceARemplacer,
    string    Explication,
    string    Recommandation,
    string    Source,
    string    VersionModele,
    DateTime  DateCalcul
);

/// <summary>
/// État de santé d'un véhicule : score global + prédictions qui le composent.
/// C'est l'unité d'affichage du classement et des indicateurs de risque.
/// </summary>
public record SanteVehiculeDto(
    long                 VehiculeId,
    string               Immatriculation,
    string               Marque,
    string               Modele,
    int                  AnneeConstruction,
    double               Kilometrage,
    // Score de santé 0..100 (100 = parfait).
    int                  ScoreSante,
    string               NiveauRisque,
    int                  NombrePredictions,
    DateTime?            ProchaineMaintenanceRecommandee,
    int?                 DureeVieRestanteJours,
    IEnumerable<PredictionDto> Predictions
);

// KPIs et séries du tableau de bord.
public record DashboardDto(
    int    NombreVehiculesAnalyses,
    int    NombreVehiculesARisque,      // ELEVE ou CRITIQUE
    int    ScoreSanteMoyen,
    int    NombrePredictionsActives,
    int    MaintenancesA30Jours,
    double CoutMaintenanceEvitePotentiel,
    // Répartition du parc par niveau de risque (camembert/donut).
    IEnumerable<RepartitionDto> RepartitionRisque,
    // Répartition des prédictions par organe (barres).
    IEnumerable<RepartitionDto> RepartitionTypePanne,
    // Classement des véhicules les plus à risque.
    IEnumerable<SanteVehiculeDto> ClassementVehicules
);

public record RepartitionDto(string Libelle, int Nombre);

// Résultat d'un recalcul déclenché manuellement.
public record RecalculResultatDto(
    int      VehiculesAnalyses,
    int      PredictionsGenerees,
    string   VersionModele,
    DateTime DateCalcul
);

// ─────────────────────────────────────────────────────────────────────────────
// Contrat d'entrée/sortie du MOTEUR de prédiction (indépendant du stockage)
// ─────────────────────────────────────────────────────────────────────────────

/// <summary>
/// Vecteur de caractéristiques (« features ») d'un véhicule.
/// C'est le point de bascule vers le ML : ce même objet sera sérialisé tel quel
/// vers un modèle entraîné le jour où on en branche un.
/// </summary>
public record VehiculeFeatures(
    long     VehiculeId,
    string   Immatriculation,
    string   Marque,
    string   Modele,
    int      AgeAnnees,
    double   Kilometrage,
    int      NombreInterventions,
    int      NombreInterventionsCuratives,
    int      JoursDepuisDerniereIntervention,
    double   KilometrageDepuisDerniereRevision,
    double   CoutMaintenanceTotal,
    // Interventions curatives sur les 180 derniers jours.
    int      PannesRecentes,
    // Organes déjà touchés, déduits des descriptions d'intervention.
    IReadOnlyDictionary<TypePanne, int> HistoriqueParOrgane
);

// Prédiction brute produite par un moteur, avant persistance.
public record PredictionCalculee(
    TypePanne    TypePanne,
    NiveauRisque NiveauRisque,
    double       Probabilite,
    double       ScoreConfiance,
    DateTime?    DatePanneEstimee,
    DateTime?    DateMaintenanceRecommandee,
    int?         DureeVieRestanteJours,
    double?      KilometrageRestant,
    string?      PieceARemplacer,
    string       Explication,
    string       Recommandation
);
