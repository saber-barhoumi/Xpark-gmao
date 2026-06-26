using XparkGMAO.Core.Entities.Security;
using XparkGMAO.Core.Entities.GestionOperations;

namespace XparkGMAO.Core.Entities.GestionFlotte;

/// <summary>
/// Statut d'un chauffeur
/// </summary>
public enum StatutChauffeur
{
    DISPONIBLE,
    EN_MISSION,
    EN_CONGE,
    SUSPENDU,
    INACTIF
}

/// <summary>
/// Catégorie de permis de conduire
/// </summary>
public enum CategoriePermis
{
    A,
    B,
    C,
    D,
    E,
    BE,
    CE
}

/// <summary>
/// Entité représentant un chauffeur
/// </summary>
public class Chauffeur : Utilisateur
{
    public string NumeroPermis { get; set; } = string.Empty;
    public CategoriePermis CategoriePermis { get; set; }
    public DateTime DateExpirationPermis { get; set; }
    public StatutChauffeur Disponibilite { get; set; } = StatutChauffeur.DISPONIBLE;
    public double Evaluation { get; set; } = 5.0;
    public int NombreMissionsEffectuees { get; set; }
    public double KilometrageTotal { get; set; }
    public DateTime? DateDerniereFormation { get; set; }

    // Navigation properties
    public ICollection<Mission> Missions { get; set; } = new List<Mission>();
}
