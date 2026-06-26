namespace XparkGMAO.Core.Entities.IntelligenceArtificielle;

/// <summary>
/// Entité représentant un trajet calculé par l'IA
/// </summary>
public class TrajetCalcule
{
    public long IdTrajet { get; set; }
    public string Origine { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public double Distance { get; set; }
    public double PrixEstime { get; set; }
    public double CoutCarburant { get; set; }
    public double ConfianceIA { get; set; }
    public string? TypeVehicule { get; set; }
    public DateTime DateCalcul { get; set; } = DateTime.UtcNow;
    public long? UtilisateurId { get; set; }
}

/// <summary>
/// Entité représentant une prédiction de panne
/// </summary>
public class PredictionPanne
{
    public long IdPrediction { get; set; }
    public long VehiculeId { get; set; }
    public double Probabilite { get; set; }
    public string TypePanne { get; set; } = string.Empty;
    public int DelaiEstime { get; set; }
    public double CoutEstime { get; set; }
    public string? Recommandations { get; set; }
    public DateTime DateGeneration { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Entité représentant un modèle IA
/// </summary>
public class CalculateurPrixTrajetIA
{
    public long IdCalculateur { get; set; }
    public string ModeleIA { get; set; } = string.Empty;
    public string VersionModele { get; set; } = string.Empty;
    public double Precision { get; set; }
    public DateTime DateEntrainement { get; set; }
    public bool Actif { get; set; } = true;
}
