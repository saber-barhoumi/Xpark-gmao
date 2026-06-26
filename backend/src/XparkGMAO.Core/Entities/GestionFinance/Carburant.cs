using XparkGMAO.Core.Entities.GestionFlotte;

namespace XparkGMAO.Core.Entities.GestionFinance;

/// <summary>
/// Entité représentant un plein de carburant
/// </summary>
public class Carburant
{
    public long IdCarburant { get; set; }
    public DateTime DateRemplissage { get; set; }
    public double Quantite { get; set; }
    public double PrixUnitaire { get; set; }
    public double MontantTotal { get; set; }
    public double Kilometrage { get; set; }
    public string? Station { get; set; }
    public string? NumeroBon { get; set; }

    /// <summary>Type de carburant : Diesel, Essence, GPL, Electrique</summary>
    public string TypeCarburant { get; set; } = "Diesel";

    public long VehiculeId { get; set; }
    public long? ChauffeurId { get; set; }

    /// <summary>Source d'approvisionnement (nullable pour compatibilité données existantes)</summary>
    public long? SourceId { get; set; }
    public string? JustificatifUrl { get; set; }

    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Vehicule Vehicule { get; set; } = null!;
    public Source? Source { get; set; }
}

