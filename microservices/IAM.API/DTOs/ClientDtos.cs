namespace IAM.API.DTOs;

public record CreateClientDto(
    string Nom, string Prenom, string Email,
    string? Telephone, string? NomSociete,
    string? SecteurActivite, string? Adresse,
    string? Ville, bool EstEntreprise,
    string? NumeroFiscal
);

public record UpdateClientDto(
    string? Nom, string? Prenom, string? Telephone,
    string? NomSociete, string? SecteurActivite,
    string? Adresse, string? Ville, string? NumeroFiscal
);

public record ClientDto(
    long   IdUtilisateur, string Nom, string Prenom,
    string Email, string? Telephone,
    string? NomSociete, string? SecteurActivite,
    string? Adresse, string? Ville, bool EstEntreprise,
    string? NumeroFiscal, DateTime DateCreation
);
