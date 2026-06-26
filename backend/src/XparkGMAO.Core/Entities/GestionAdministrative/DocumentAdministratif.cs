using XparkGMAO.Core.Entities.GestionFlotte;

namespace XparkGMAO.Core.Entities.GestionAdministrative;

/// <summary>
/// Type de document administratif
/// </summary>
public enum TypeDocument
{
    CARTE_GRISE,
    VIGNETTE,
    VISITE_TECHNIQUE,
    PERMIS_CIRCULER,
    CERTIFICAT_CONFORMITE,
    ASSURANCE,
    AUTRE
}

/// <summary>
/// Entité représentant un document administratif d'un véhicule
/// </summary>
public class DocumentAdministratif
{
    public long IdDocument { get; set; }
    public TypeDocument TypeDocument { get; set; }
    public string NumeroDocument { get; set; } = string.Empty;
    public DateTime DateEmission { get; set; }
    public DateTime DateExpiration { get; set; }
    public string? Autorite { get; set; }
    public string? FichierPath { get; set; }
    public string? Observations { get; set; }
    public long VehiculeId { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Vehicule Vehicule { get; set; } = null!;
}
