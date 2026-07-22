namespace PredictionPanne.Domain.Entities;

/// <summary>
/// Prédiction de panne pour un véhicule, persistée pour constituer l'historique.
///
/// Chaque exécution du moteur crée de NOUVELLES lignes plutôt que de modifier
/// les précédentes : on veut pouvoir comparer ce qui avait été prédit avec ce
/// qui s'est réellement produit — c'est la matière première d'un futur
/// entraînement supervisé (voir <see cref="Realisee"/>).
/// </summary>
public class Prediction
{
    public long             IdPrediction     { get; set; }
    public long             VehiculeId       { get; set; }

    public TypePanne        TypePanne        { get; set; }
    public NiveauRisque     NiveauRisque     { get; set; }

    /// <summary>Probabilité de défaillance estimée, 0..1.</summary>
    public double           Probabilite      { get; set; }

    /// <summary>Confiance du moteur dans sa propre estimation, 0..1.</summary>
    public double           ScoreConfiance   { get; set; }

    /// <summary>Date de panne estimée (null si aucun signal exploitable).</summary>
    public DateTime?        DatePanneEstimee { get; set; }

    /// <summary>Date de maintenance recommandée — toujours avant la panne estimée.</summary>
    public DateTime?        DateMaintenanceRecommandee { get; set; }

    /// <summary>Durée de vie utile restante estimée, en jours.</summary>
    public int?             DureeVieRestanteJours { get; set; }

    /// <summary>Kilométrage restant estimé avant défaillance.</summary>
    public double?          KilometrageRestant { get; set; }

    /// <summary>Pièce dont le remplacement est anticipé (texte libre, aligné sur le catalogue).</summary>
    public string?          PieceARemplacer  { get; set; }

    /// <summary>Explication lisible : pourquoi le moteur a conclu cela.</summary>
    public string           Explication      { get; set; } = string.Empty;

    /// <summary>Action concrète proposée à l'exploitant.</summary>
    public string           Recommandation   { get; set; } = string.Empty;

    public SourcePrediction Source           { get; set; } = SourcePrediction.REGLES;

    /// <summary>Version du moteur/modèle — indispensable pour comparer deux générations.</summary>
    public string           VersionModele    { get; set; } = "regles-v1";

    public DateTime         DateCalcul       { get; set; } = DateTime.UtcNow;

    // ── Boucle de retour (alimentera l'apprentissage supervisé) ───────────────
    /// <summary>null = pas encore tranché ; true/false = la panne a eu lieu ou non.</summary>
    public bool?            Realisee         { get; set; }
    public DateTime?        DateVerification { get; set; }
}
