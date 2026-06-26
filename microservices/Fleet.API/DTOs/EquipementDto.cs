using XparkGMAO.Shared.Enums;

namespace Fleet.API.DTOs;

public record CreateEquipementDto(
    string Nom, TypeEquipement Type, CategorieEquipement Categorie,
    string? Marque, string? Modele, string? NumeroSerie, string? Fournisseur,
    DateTime? DateAchat, decimal? PrixAchat, DateTime? DateFinGarantie,
    int DureeVieTheoriqueEnMois, long? VehiculeId
);

public record EquipementDto(
    long IdEquipement, string Nom, string CodeInventaire,
    string Type, string Categorie, string Etat,
    string? Marque, string? Modele, long? VehiculeId,
    bool Actif, DateTime DateCreation
);
