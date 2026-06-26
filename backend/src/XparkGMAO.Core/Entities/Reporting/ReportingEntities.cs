using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.Reporting;

/// <summary>
/// Type de rapport
/// </summary>
public enum TypeRapport
{
    FLOTTE,
    MAINTENANCE,
    FINANCE,
    OPERATIONS,
    PERFORMANCE,
    IA
}

/// <summary>
/// Entité représentant un rapport généré par l'IA
/// </summary>
public class RapportIA
{
    public long IdRapport { get; set; }
    public string Titre { get; set; } = string.Empty;
    public DateTime DateGeneration { get; set; } = DateTime.UtcNow;
    public TypeRapport TypeRapport { get; set; }
    public string Contenu { get; set; } = string.Empty;
    public string? Parametres { get; set; }
    public long? GenerePar { get; set; }
}
