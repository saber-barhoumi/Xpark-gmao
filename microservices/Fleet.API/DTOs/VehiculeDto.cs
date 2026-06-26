using XparkGMAO.Shared.Enums;

namespace Fleet.API.DTOs;

public record CreateVehiculeDto(
    string Marque, string Modele, string NumeroChassis, string Immatriculation,
    int AnneeConstruction, TypeCarburant TypeCarburant, TypeVehicule TypeVehicule,
    double Kilometrage, string? Couleur, int NombrePlaces, double ConsommationMoyenne,
    DateTime DateAcquisition, double ValeurAcquisition, int PuissanceFiscale,
    DateTime? DateProchaineRevision
);

public record UpdateVehiculeDto(
    string? Marque, string? Modele, double? Kilometrage,
    StatutVehicule? Statut, string? Couleur,
    double? ConsommationMoyenne, int? PuissanceFiscale,
    DateTime? DateProchaineRevision
);

public record VehiculeDto(
    long IdVehicule, string Marque, string Modele,
    string NumeroChassis, string Immatriculation,
    int AnneeConstruction, string TypeCarburant, string TypeVehicule,
    double Kilometrage, string Statut, string? Couleur,
    int NombrePlaces, double ConsommationMoyenne,
    DateTime DateAcquisition, int PuissanceFiscale,
    DateTime? DateProchaineRevision, DateTime? DateDerniereRevision,
    string? Photo, bool Actif
);
