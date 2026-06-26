using XparkGMAO.Shared.Enums;

namespace IAM.API.DTOs;

public record CreateChauffeurDto(
    string Nom, string Prenom, string Email,
    string Password, string Telephone,
    string NumeroPermis, CategoriePermis CategoriePermis,
    DateTime DateExpirationPermis
);

public record ChauffeurDto(
    long   IdUtilisateur, string Nom, string Prenom,
    string Email, string Telephone,
    string NumeroPermis, string CategoriePermis,
    DateTime DateExpirationPermis, string Disponibilite,
    double Evaluation, int NombreMissionsEffectuees,
    double KilometrageTotal
);
