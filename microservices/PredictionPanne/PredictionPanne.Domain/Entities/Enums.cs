namespace PredictionPanne.Domain.Entities;

/// <summary>Niveau de risque d'une prédiction — pilote l'affichage et le tri.</summary>
public enum NiveauRisque { FAIBLE = 0, MODERE = 1, ELEVE = 2, CRITIQUE = 3 }

/// <summary>
/// Organe susceptible de tomber en panne. Volontairement aligné sur ce que la
/// GMAO sait déjà tracer via les interventions, pour rester exploitable.
/// </summary>
public enum TypePanne
{
    MOTEUR,
    FREINS,
    PNEUMATIQUES,
    TRANSMISSION,
    SUSPENSION,
    ELECTRIQUE,
    REFROIDISSEMENT,
    CLIMATISATION,
    AUTRE
}

/// <summary>Origine de la prédiction — trace quelle « intelligence » l'a produite.</summary>
public enum SourcePrediction
{
    /// <summary>Moteur de règles interne (heuristiques métier).</summary>
    REGLES,
    /// <summary>Modèle ML externe (branchement futur).</summary>
    MODELE_ML
}
