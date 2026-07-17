using IAM.Infrastructure.Data;
using IAM.Application.DTOs;
using IAM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IAM.Infrastructure.Services;

/// <summary>
/// MFA engine (FICHE §2) : Authenticator TOTP + Email OTP, historique de
/// connexions et journal d'audit sécurité.
/// </summary>
public class MfaService(
    IamDbContext db,
    IEmailService email,
    IConfiguration config,
    ILogger<MfaService> logger) : IMfaService
{
    private const int OtpValidityMinutes = 10;   // FICHE §2.2
    private const int OtpMaxAttempts     = 5;

    // ── Settings ─────────────────────────────────────────────────────────────

    private async Task<UserMfaSettings> GetOrCreateAsync(long userId)
    {
        var settings = await db.MfaSettings.FirstOrDefaultAsync(s => s.UserId == userId);
        if (settings is null)
        {
            settings = new UserMfaSettings { UserId = userId };
            db.MfaSettings.Add(settings);
            await db.SaveChangesAsync();
        }
        return settings;
    }

    private static MfaSettingsDto ToDto(UserMfaSettings s) => new(
        AuthenticatorEnabled: s.AuthenticatorEnabled,
        EmailOtpEnabled:      s.EmailOtpEnabled,
        DefaultMethod:        s.DefaultMethod,
        MfaRequired:          s.AuthenticatorEnabled || s.EmailOtpEnabled);

    public async Task<MfaSettingsDto> GetSettingsAsync(long userId)
        => ToDto(await GetOrCreateAsync(userId));

    public async Task<List<string>> GetEnabledMethodsAsync(long userId)
    {
        var s = await GetOrCreateAsync(userId);
        var methods = new List<string>();
        if (s.AuthenticatorEnabled) methods.Add("AUTHENTICATOR");
        if (s.EmailOtpEnabled)      methods.Add("EMAIL");
        // Mettre la méthode par défaut en premier
        methods.Sort((a, b) => a == s.DefaultMethod ? -1 : b == s.DefaultMethod ? 1 : 0);
        return methods;
    }

    // ── Authenticator (TOTP — FICHE §2.1) ────────────────────────────────────

    public async Task<AuthenticatorSetupDto> BeginAuthenticatorSetupAsync(long userId, string email, string ip)
    {
        var settings = await GetOrCreateAsync(userId);

        // Nouveau secret à chaque setup — actif seulement après confirmation du code
        settings.AuthenticatorSecret  = TotpService.GenerateSecret();
        settings.AuthenticatorEnabled = false;
        settings.UpdatedAt            = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var uri = TotpService.BuildOtpAuthUri(email, settings.AuthenticatorSecret);
        await AuditAsync(userId, "MFA_SETUP_STARTED", "Authenticator setup initié", ip);

        return new AuthenticatorSetupDto(
            Secret:        settings.AuthenticatorSecret,
            OtpAuthUri:    uri,
            QrCodeDataUri: TotpService.BuildQrCodeDataUri(uri));
    }

    public async Task<MfaSettingsDto> ConfirmAuthenticatorAsync(long userId, string code, string ip)
    {
        var settings = await GetOrCreateAsync(userId);
        if (string.IsNullOrEmpty(settings.AuthenticatorSecret))
            throw new InvalidOperationException("Aucun setup Authenticator en cours.");

        if (!TotpService.VerifyCode(settings.AuthenticatorSecret, code))
        {
            await AuditAsync(userId, "MFA_SETUP_FAILED", "Code Authenticator invalide", ip);
            throw new UnauthorizedAccessException("Code invalide. Vérifiez votre application Authenticator.");
        }

        settings.AuthenticatorEnabled = true;
        settings.DefaultMethod        = "AUTHENTICATOR";
        settings.UpdatedAt            = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await AuditAsync(userId, "MFA_ENABLED", "Authenticator (TOTP) activé", ip);
        return ToDto(settings);
    }

    public async Task<MfaSettingsDto> DisableAuthenticatorAsync(long userId, string ip)
    {
        var settings = await GetOrCreateAsync(userId);
        settings.AuthenticatorEnabled = false;
        settings.AuthenticatorSecret  = null;
        if (settings.DefaultMethod == "AUTHENTICATOR" && settings.EmailOtpEnabled)
            settings.DefaultMethod = "EMAIL";
        settings.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await AuditAsync(userId, "MFA_DISABLED", "Authenticator (TOTP) désactivé", ip);
        return ToDto(settings);
    }

    public async Task<bool> VerifyAuthenticatorCodeAsync(long userId, string code)
    {
        var settings = await GetOrCreateAsync(userId);
        return settings.AuthenticatorEnabled
               && !string.IsNullOrEmpty(settings.AuthenticatorSecret)
               && TotpService.VerifyCode(settings.AuthenticatorSecret, code);
    }

    // ── Email OTP (FICHE §2.2) ───────────────────────────────────────────────

    public async Task<MfaSettingsDto> ToggleEmailOtpAsync(long userId, string ip)
    {
        var settings = await GetOrCreateAsync(userId);
        settings.EmailOtpEnabled = !settings.EmailOtpEnabled;
        if (!settings.EmailOtpEnabled && settings.DefaultMethod == "EMAIL" && settings.AuthenticatorEnabled)
            settings.DefaultMethod = "AUTHENTICATOR";
        if (settings.EmailOtpEnabled && !settings.AuthenticatorEnabled)
            settings.DefaultMethod = "EMAIL";
        settings.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await AuditAsync(userId, settings.EmailOtpEnabled ? "MFA_ENABLED" : "MFA_DISABLED",
            $"Vérification par email {(settings.EmailOtpEnabled ? "activée" : "désactivée")}", ip);
        return ToDto(settings);
    }

    public async Task SendEmailOtpAsync(Utilisateur user)
    {
        // Invalider les codes précédents
        await db.EmailOtps
            .Where(o => o.UserId == user.IdUtilisateur && !o.IsUsed)
            .ExecuteUpdateAsync(s => s.SetProperty(o => o.IsUsed, true));

        var otp = Random.Shared.Next(0, 1_000_000).ToString("D6");
        db.EmailOtps.Add(new EmailOtp
        {
            UserId     = user.IdUtilisateur,
            CodeHash   = BCrypt.Net.BCrypt.HashPassword(otp),
            ExpiryTime = DateTime.UtcNow.AddMinutes(OtpValidityMinutes),
        });
        await db.SaveChangesAsync();

        var delivered = await email.SendMfaOtpAsync(user.Email, otp);

        // Mode DEV : si l'email n'a pas pu partir (SMTP absent ou identifiants
        // placeholder), le code est visible dans les logs du conteneur pour
        // permettre la démo (docker logs xpark-iam-api). À désactiver en prod
        // en configurant un vrai SMTP.
        if (!delivered || config["Email:DevLogOtp"] == "true")
            logger.LogWarning("[DEV] Code OTP MFA pour {Email}: {Otp} (valide {Min} min)",
                user.Email, otp, OtpValidityMinutes);
    }

    public async Task<bool> VerifyEmailOtpAsync(long userId, string code)
    {
        var otp = await db.EmailOtps
            .Where(o => o.UserId == userId && !o.IsUsed)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();

        if (otp is null) return false;

        if (DateTime.UtcNow > otp.ExpiryTime || otp.Attempts >= OtpMaxAttempts)
        {
            otp.IsUsed = true;
            await db.SaveChangesAsync();
            return false;
        }

        if (!BCrypt.Net.BCrypt.Verify(code, otp.CodeHash))
        {
            otp.Attempts++;
            await db.SaveChangesAsync();
            return false;
        }

        otp.IsUsed = true;
        otp.UsedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    // ── Historique & audit (FICHE §5 / §7) ───────────────────────────────────

    public async Task RecordLoginAsync(long userId, string loginMethod, string? mfaMethod,
        string? ip, string? userAgent, bool success, string? failureReason = null)
    {
        try
        {
            db.LoginHistory.Add(new LoginHistoryEntry
            {
                UserId        = userId,
                LoginMethod   = loginMethod,
                MfaMethod     = mfaMethod,
                IpAddress     = ip,
                UserAgent     = userAgent is { Length: > 500 } ? userAgent[..500] : userAgent,
                IsSuccessful  = success,
                FailureReason = failureReason,
            });
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogWarning("LoginHistory non enregistré: {Message}", ex.Message);
        }
    }

    public async Task AuditAsync(long? userId, string action, string? description, string? ip)
    {
        try
        {
            db.AuthAuditLogs.Add(new AuthAuditLog
            {
                UserId = userId, Action = action, Description = description, IpAddress = ip,
            });
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogWarning("AuditLog non enregistré: {Message}", ex.Message);
        }
    }

    public async Task<List<LoginHistoryDto>> GetLoginHistoryAsync(long userId, int limit = 20)
        => await db.LoginHistory
            .Where(h => h.UserId == userId)
            .OrderByDescending(h => h.LoggedInAt)
            .Take(limit)
            .Select(h => new LoginHistoryDto(
                h.LoggedInAt, h.LoginMethod, h.MfaMethod, h.IpAddress,
                h.UserAgent, h.IsSuccessful, h.FailureReason))
            .ToListAsync();
}
