using XparkGMAO.Shared.Enums;

namespace IAM.API.DTOs;

// ─── Auth Requests ────────────────────────────────────────────────────────────
public record LoginRequestDto(string Email, string Password);
public record RegisterRequestDto(
    string Nom, string Prenom, string Email,
    string Password, string ConfirmPassword, string Telephone,
    Role Role = Role.CLIENT);
public record ResetPasswordDto(string Email, string Token, string NewPassword, string ConfirmPassword);
public record ConfirmEmailDto(string Email, string Token);
public record SetPinDto(string Pin);
public record LoginPinDto(string Email, string Pin);
public record UnlockSessionDto(string Password);
public record RecoverPasswordDto(string Email);
public record RefreshTokenDto(string RefreshToken);

// ─── Auth Response ────────────────────────────────────────────────────────────
public record AuthResponseDto(
    string Token,
    string RefreshToken,
    string Email,
    string Role,
    string Statut,
    string Nom,
    string Prenom,
    long   IdUtilisateur,
    DateTime Expiration,
    bool   RequiresEmailConfirmation = false,
    bool   RequiresAdminApproval = false,
    string? Message = null,
    string? PhotoUrl = null
);
