using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Entities.GestionOperations;

namespace XparkGMAO.Core.Entities.GestionAdministrative;

public enum PostEmployee { CHAUFFEUR, TECHNICIEN, ADMINISTRATEUR, GESTIONNAIRE, DIRECTEUR, RESPONSABLE_MAINTENANCE }
public enum ServiceEmployee { TRANSPORT, MAINTENANCE, ADMINISTRATION, DIRECTION }
public enum StatutEmployee { DISPONIBLE, EN_MISSION, EN_CONGE, INACTIF }

// Enums for specialized fields
public enum SpecialtyTechnician { MECANIQUE, ELECTRICITE, PNEUMATIQUE, HYDRAULIQUE }
public enum LevelTechnician { JUNIOR, SENIOR, EXPERT }

public class Employee
{
    public long IdEmployee { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string NumeroMatricule { get; set; } = string.Empty;
    public PostEmployee Post { get; set; }
    public ServiceEmployee Service { get; set; }
    public StatutEmployee Statut { get; set; } = StatutEmployee.DISPONIBLE;
    public string Telephone { get; set; } = string.Empty;
    public DateTime DateEmbauche { get; set; }
    public bool Activ { get; set; } = true;

    // Additional fields for Drivers
    public string? NumeroPermis { get; set; }
    public CategoriePermis? CategoriePermis { get; set; }
    public DateTime? DateExpirationPermis { get; set; }

    // Additional fields for Technicians
    public SpecialtyTechnician? Specialty { get; set; }
    public LevelTechnician? Level { get; set; }

    // Navigation
    public ICollection<Mission> Missions { get; set; } = new List<Mission>();
}
