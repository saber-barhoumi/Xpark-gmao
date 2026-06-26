using XparkGMAO.Shared.Enums;

namespace IAM.API.DTOs;

public record CreateEmployeeDto(
    string Name, string Prenom, string NumeroMatricule,
    PostEmployee Post, ServiceEmployee Service,
    string Telephone, DateTime DateEmbauche,
    string? NumeroPermis, CategoriePermis? CategoriePermis,
    DateTime? DateExpirationPermis,
    SpecialtyTechnician? Specialty, LevelTechnician? Level
);

public record UpdateEmployeeDto(
    string? Name, string? Prenom,
    PostEmployee? Post, ServiceEmployee? Service,
    StatutEmployee? Statut, string? Telephone
);

public record EmployeeDto(
    long   IdEmployee, string Name, string Prenom,
    string NumeroMatricule, string Post, string Service,
    string Statut, string Telephone, DateTime DateEmbauche,
    string? NumeroPermis, string? CategoriePermis,
    DateTime? DateExpirationPermis,
    string? Specialty, string? Level
);
