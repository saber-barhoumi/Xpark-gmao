using IAM.Application.DTOs;
using IAM.Domain.Entities;

namespace IAM.Application.Interfaces;

/// <summary>
/// Contrat MFA (FICHE §2) : Authenticator TOTP + Email OTP, historique de
/// connexions et journal d'audit sécurité. Implémenté par
/// IAM.Infrastructure.Services.MfaService (extrait de ce fichier lors du
/// passage en Clean Architecture — l'interface appartient à l'Application).
/// </summary>
public interface IMfaService
{
    Task<MfaSettingsDto>          GetSettingsAsync(long userId);
    Task<AuthenticatorSetupDto>   BeginAuthenticatorSetupAsync(long userId, string email, string ip);
    Task<MfaSettingsDto>          ConfirmAuthenticatorAsync(long userId, string code, string ip);
    Task<MfaSettingsDto>          DisableAuthenticatorAsync(long userId, string ip);
    Task<MfaSettingsDto>          ToggleEmailOtpAsync(long userId, string ip);
    Task                          SendEmailOtpAsync(Utilisateur user);
    Task<bool>                    VerifyEmailOtpAsync(long userId, string code);
    Task<bool>                    VerifyAuthenticatorCodeAsync(long userId, string code);
    Task<List<string>>            GetEnabledMethodsAsync(long userId);
    Task                          RecordLoginAsync(long userId, string loginMethod, string? mfaMethod,
                                                   string? ip, string? userAgent, bool success, string? failureReason = null);
    Task                          AuditAsync(long? userId, string action, string? description, string? ip);
    Task<List<LoginHistoryDto>>   GetLoginHistoryAsync(long userId, int limit = 20);
    Task<bool>                    DeleteLoginHistoryAsync(long userId, long id);
    Task<int>                     ClearLoginHistoryAsync(long userId);
}
