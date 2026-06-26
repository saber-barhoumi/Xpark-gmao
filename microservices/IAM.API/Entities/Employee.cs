using XparkGMAO.Shared.Enums;

namespace IAM.API.Entities;

public class Employee
{
    public long               IdEmployee           { get; set; }
    public string             Name                 { get; set; } = string.Empty;
    public string             Prenom               { get; set; } = string.Empty;
    public string             NumeroMatricule      { get; set; } = string.Empty;
    public PostEmployee       Post                 { get; set; }
    public ServiceEmployee    Service              { get; set; }
    public StatutEmployee     Statut               { get; set; } = StatutEmployee.DISPONIBLE;
    public string             Telephone            { get; set; } = string.Empty;
    public DateTime           DateEmbauche         { get; set; }
    public bool               Activ                { get; set; } = true;

    // Driver-specific
    public string?           NumeroPermis         { get; set; }
    public CategoriePermis?  CategoriePermis      { get; set; }
    public DateTime?         DateExpirationPermis { get; set; }

    // Technician-specific
    public SpecialtyTechnician? Specialty { get; set; }
    public LevelTechnician?     Level     { get; set; }
}
