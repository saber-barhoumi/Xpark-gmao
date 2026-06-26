using XparkGMAO.Core.Entities.Security;
using XparkGMAO.Core.Entities.GestionFinance;
using XparkGMAO.Core.Entities.GestionOperations;
using XparkGMAO.Core.Entities.FrontOffice;

namespace XparkGMAO.Core.Entities.GestionAdministrative;

/// <summary>
/// Entité représentant un client (entreprise ou particulier)
/// </summary>
public class Client : Utilisateur
{
    public string? NomSociete { get; set; }
    public string? SecteurActivite { get; set; }
    public string? Adresse { get; set; }
    public string? Ville { get; set; }
    public string? CodePostal { get; set; }
    public string? Pays { get; set; } = "Tunisie";
    public string? NumeroFiscal { get; set; }
    public string? SiteWeb { get; set; }
    public bool EstEntreprise { get; set; }

    // Navigation properties
    public ICollection<Facture> Factures { get; set; } = new List<Facture>();
    public ICollection<Mission> Missions { get; set; } = new List<Mission>();
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<Devis> Devis { get; set; } = new List<Devis>();
}
