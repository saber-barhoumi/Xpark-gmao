namespace IAM.API.DTOs;

public record UserProfileDto(
    long   IdUtilisateur,
    string Nom, string Prenom, string Email,
    string Telephone, string Role,
    bool   Actif, bool EmailConfirmed, bool HasPin,
    DateTime DateCreation, string? Photo,
    string Statut
);

public record UpdateProfileDto(string? Nom, string? Prenom, string? Telephone);
public record ChangePasswordDto(string CurrentPassword, string NewPassword, string ConfirmPassword);
