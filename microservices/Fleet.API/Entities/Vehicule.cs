using XparkGMAO.Shared.Enums;

namespace Fleet.API.Entities;

public class Vehicule
{
    public long           IdVehicule                  { get; set; }
    public string         Marque                      { get; set; } = string.Empty;
    public string         Modele                      { get; set; } = string.Empty;
    public string         NumeroChassis               { get; set; } = string.Empty;
    public string         Immatriculation             { get; set; } = string.Empty;
    public int            AnneeConstruction           { get; set; }
    public TypeCarburant  TypeCarburant               { get; set; }
    public TypeVehicule   TypeVehicule                { get; set; }
    public double         Kilometrage                 { get; set; }
    public StatutVehicule Statut                      { get; set; } = StatutVehicule.DISPONIBLE;
    public string?        Couleur                     { get; set; }
    public int            NombrePlaces                { get; set; }
    public double         ConsommationMoyenne         { get; set; }
    public DateTime       DateAcquisition             { get; set; }
    public double         ValeurAcquisition           { get; set; }
    public int            PuissanceFiscale            { get; set; }
    public string?        Photo                       { get; set; }
    public DateTime?      DateDerniereRevision        { get; set; }
    public DateTime?      DateProchaineRevision       { get; set; }
    public double?        KilometrageProchainRevision { get; set; }
    public bool           Actif                       { get; set; } = true;
    public DateTime       DateCreation                { get; set; } = DateTime.UtcNow;

    public ICollection<Assurance>             Assurances  { get; set; } = [];
    public ICollection<DocumentAdministratif> Documents   { get; set; } = [];
    public ICollection<Carburant>             Carburants  { get; set; } = [];
    public ICollection<Equipement>            Equipements { get; set; } = [];
}
