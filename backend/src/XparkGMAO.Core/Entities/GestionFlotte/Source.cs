using XparkGMAO.Core.Entities.GestionFinance;

namespace XparkGMAO.Core.Entities.GestionFlotte;

/// <summary>
/// Types de sources d'approvisionnement en carburant
/// </summary>
public enum TypeSource
{
    STATION_EXTERNE = 0,   // Station-service publique
    DAC_INTERNE = 1,       // Dépôt d'Approvisionnement en Carburant interne
    CARTE_CARBURANT = 2,   // Carte carburant entreprise
    CITERE_MOBILE = 3,     // Citerne mobile
    STOCKAGE_PRIVE = 4     // Réservoir/cuve privée
}

/// <summary>
/// Source d'approvisionnement en carburant
/// </summary>
public class Source
{
    public long IdSource { get; set; }
    public string NomSource { get; set; } = string.Empty;
    public TypeSource TypeSource { get; set; }
    public string? Adresse { get; set; }
    public string? Ville { get; set; }
    public double? Longitude { get; set; }
    public double? Latitude { get; set; }

    /// <summary>Prix moyen pratiqué par cette source (TND/L)</summary>
    public double? PrixMoyen { get; set; }

    /// <summary>Remise accordée à la flotte (%)</summary>
    public double? RemiseFiotte { get; set; }

    /// <summary>Code carte carburant (si TypeSource = CARTE_CARBURANT)</summary>
    public string? CodeCarte { get; set; }

    public bool Actif { get; set; } = true;
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Carburant> ConsommationsCarburant { get; set; } = new List<Carburant>();
}
