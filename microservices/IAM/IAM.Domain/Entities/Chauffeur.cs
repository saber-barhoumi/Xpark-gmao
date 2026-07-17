using XparkGMAO.Shared.Enums;

namespace IAM.Domain.Entities;

public class Chauffeur : Utilisateur
{
    public string          NumeroPermis             { get; set; } = string.Empty;
    public CategoriePermis CategoriePermis          { get; set; }
    public DateTime        DateExpirationPermis     { get; set; }
    public StatutChauffeur Disponibilite            { get; set; } = StatutChauffeur.DISPONIBLE;
    public double          Evaluation               { get; set; } = 5.0;
    public int             NombreMissionsEffectuees { get; set; }
    public double          KilometrageTotal         { get; set; }
    public DateTime?       DateDerniereFormation    { get; set; }
}
