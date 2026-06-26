using XparkGMAO.Shared.Enums;

namespace Fleet.API.Entities;

public class Equipement
{
    public long               IdEquipement                  { get; set; }
    public string             Nom                           { get; set; } = string.Empty;
    public string             CodeInventaire                { get; set; } = string.Empty;
    public TypeEquipement     Type                          { get; set; }
    public CategorieEquipement Categorie                    { get; set; }
    public EtatEquipement     Etat                          { get; set; } = EtatEquipement.Neuf;
    public string?            Marque                        { get; set; }
    public string?            Modele                        { get; set; }
    public string?            NumeroSerie                   { get; set; }
    public string?            Fournisseur                   { get; set; }
    public string?            ImageUrl                      { get; set; }
    public DateTime?          DateAchat                     { get; set; }
    public decimal?           PrixAchat                     { get; set; }
    public DateTime?          DateFinGarantie               { get; set; }
    public int                DureeVieTheoriqueEnMois       { get; set; }
    public int                NombreUtilisations            { get; set; }
    public decimal            HeuresUtilisation             { get; set; }
    public int?               SeuilUsureUtilisations        { get; set; }
    public int?               SeuilRemplacementUtilisations { get; set; }
    public long?              VehiculeId                    { get; set; }
    public string?            NotesGenerales                { get; set; }
    public bool               Actif                         { get; set; } = true;
    public DateTime           DateCreation                  { get; set; } = DateTime.UtcNow;
    public DateTime           DateModification              { get; set; } = DateTime.UtcNow;

    public Vehicule? Vehicule { get; set; }
}
