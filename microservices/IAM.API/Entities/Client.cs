namespace IAM.API.Entities;

public class Client : Utilisateur
{
    public string? NomSociete      { get; set; }
    public string? SecteurActivite { get; set; }
    public string? Adresse         { get; set; }
    public string? Ville           { get; set; }
    public string? CodePostal      { get; set; }
    public string? Pays            { get; set; } = "Tunisie";
    public string? NumeroFiscal    { get; set; }
    public string? SiteWeb         { get; set; }
    public bool    EstEntreprise   { get; set; }
}
