using IAM.API.Data;
using IAM.API.DTOs;
using IAM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Shared.Common;

namespace IAM.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    IAuthService  authService,
    IUserService  userService,
    IEmailService emailService,
    IMfaService   mfaService,
    IamDbContext  db) : ControllerBase
{
    private string ClientIp   => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    private string? UserAgent => Request.Headers.UserAgent.FirstOrDefault();
    private long   CurrentUserId => long.Parse(User.FindFirst("userId")!.Value);

    // ── MFA — vérification lors du login (FICHE §6, étape 2) ─────────────────

    /// <summary>Échange (jeton MFA pending + code TOTP/email) contre les vrais jetons JWT.</summary>
    [HttpPost("mfa/verify")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> VerifyMfa([FromBody] MfaVerifyRequestDto dto)
    {
        var result = await authService.VerifyMfaAsync(dto, ClientIp, UserAgent);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result));
    }

    /// <summary>Renvoie un code OTP par email pendant le challenge MFA.</summary>
    [HttpPost("mfa/email/resend")]
    public async Task<ActionResult<ApiResponse<string>>> ResendMfaEmail([FromBody] MfaResendEmailDto dto)
    {
        await authService.ResendMfaEmailOtpAsync(dto.MfaToken);
        return Ok(ApiResponse<string>.Ok("Code renvoyé par email."));
    }

    // ── MFA — paramètres de sécurité (utilisateur connecté) ──────────────────

    [Authorize]
    [HttpGet("mfa/settings")]
    public async Task<ActionResult<ApiResponse<MfaSettingsDto>>> GetMfaSettings()
        => Ok(ApiResponse<MfaSettingsDto>.Ok(await mfaService.GetSettingsAsync(CurrentUserId)));

    /// <summary>Démarre la configuration Authenticator : renvoie secret + QR code.</summary>
    [Authorize]
    [HttpPost("mfa/authenticator/setup")]
    public async Task<ActionResult<ApiResponse<AuthenticatorSetupDto>>> SetupAuthenticator()
    {
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "user@xpark.tn";
        var setup = await mfaService.BeginAuthenticatorSetupAsync(CurrentUserId, email, ClientIp);
        return Ok(ApiResponse<AuthenticatorSetupDto>.Ok(setup));
    }

    /// <summary>Confirme le setup avec un premier code TOTP valide → active le MFA.</summary>
    [Authorize]
    [HttpPost("mfa/authenticator/confirm")]
    public async Task<ActionResult<ApiResponse<MfaSettingsDto>>> ConfirmAuthenticator([FromBody] AuthenticatorConfirmDto dto)
        => Ok(ApiResponse<MfaSettingsDto>.Ok(
            await mfaService.ConfirmAuthenticatorAsync(CurrentUserId, dto.Code, ClientIp)));

    [Authorize]
    [HttpPost("mfa/authenticator/disable")]
    public async Task<ActionResult<ApiResponse<MfaSettingsDto>>> DisableAuthenticator()
        => Ok(ApiResponse<MfaSettingsDto>.Ok(
            await mfaService.DisableAuthenticatorAsync(CurrentUserId, ClientIp)));

    [Authorize]
    [HttpPost("mfa/email/toggle")]
    public async Task<ActionResult<ApiResponse<MfaSettingsDto>>> ToggleEmailOtp()
        => Ok(ApiResponse<MfaSettingsDto>.Ok(
            await mfaService.ToggleEmailOtpAsync(CurrentUserId, ClientIp)));

    /// <summary>Historique des connexions de l'utilisateur (FICHE §5 LoginHistory).</summary>
    [Authorize]
    [HttpGet("security/login-history")]
    public async Task<ActionResult<ApiResponse<List<LoginHistoryDto>>>> GetLoginHistory([FromQuery] int limit = 20)
        => Ok(ApiResponse<List<LoginHistoryDto>>.Ok(
            await mfaService.GetLoginHistoryAsync(CurrentUserId, Math.Min(limit, 100))));

    // ── Auth core ─────────────────────────────────────────────────────────────

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginRequestDto dto)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var result = await authService.LoginAsync(dto, ip);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result));
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterRequestDto dto)
    {
        var result = await authService.RegisterAsync(dto);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Inscription réussie. Vérifiez votre email."));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<string>>> Logout()
    {
        var userId = long.Parse(User.FindFirst("userId")!.Value);
        await authService.LogoutAsync(userId);
        return Ok(ApiResponse<string>.Ok("Déconnexion réussie."));
    }

    [HttpPost("refresh-token")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        var result = await authService.RefreshTokenAsync(dto.RefreshToken);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result));
    }

    [HttpPost("confirm-email")]
    public async Task<ActionResult<ApiResponse<string>>> ConfirmEmail(
        [FromQuery] string? email = null,
        [FromQuery] string? token = null,
        [FromBody]  ConfirmEmailDto? body = null)
    {
        var dto = body ?? new ConfirmEmailDto(email ?? "", token ?? "");
        await authService.ConfirmEmailAsync(dto);
        return Ok(ApiResponse<string>.Ok("Email confirmé avec succès."));
    }

    [HttpPost("recover-password")]
    public async Task<ActionResult<ApiResponse<string>>> RecoverPassword([FromBody] RecoverPasswordDto dto)
    {
        await authService.RecoverPasswordAsync(dto);
        return Ok(ApiResponse<string>.Ok("Si cet email existe, un lien a été envoyé."));
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<string>>> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        await authService.ResetPasswordAsync(dto);
        return Ok(ApiResponse<string>.Ok("Mot de passe réinitialisé."));
    }

    // Frontend also calls /auth/create-password (same flow as reset-password)
    [HttpPost("create-password")]
    public async Task<ActionResult<ApiResponse<string>>> CreatePassword([FromBody] ResetPasswordDto dto)
    {
        await authService.ResetPasswordAsync(dto);
        return Ok(ApiResponse<string>.Ok("Mot de passe créé."));
    }

    [Authorize]
    [HttpPost("set-pin")]
    public async Task<ActionResult<ApiResponse<string>>> SetPin([FromBody] SetPinDto dto)
    {
        var userId = long.Parse(User.FindFirst("userId")!.Value);
        await authService.SetPinAsync(userId, dto);
        return Ok(ApiResponse<string>.Ok("PIN défini."));
    }

    [HttpPost("login-pin")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> LoginPin([FromBody] LoginPinDto dto)
    {
        var result = await authService.LoginPinAsync(dto);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result));
    }

    [Authorize]
    [HttpPost("unlock-session")]
    [HttpPost("unlock-screen")]   // frontend alias
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> UnlockSession([FromBody] UnlockSessionDto dto)
    {
        var userId = long.Parse(User.FindFirst("userId")!.Value);
        var result = await authService.UnlockSessionAsync(userId, dto);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result));
    }

    [Authorize]
    [HttpPost("lock-screen")]
    public ActionResult<ApiResponse<string>> LockScreen()
    {
        // Session lock is client-side; server just acknowledges
        return Ok(ApiResponse<string>.Ok("Session verrouillée."));
    }

    // ── Profile (frontend calls /auth/profile for current-user convenience) ──

    [Authorize]
    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetProfile()
    {
        var userId = long.Parse(User.FindFirst("userId")!.Value);
        var result = await userService.GetProfileAsync(userId);
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = long.Parse(User.FindFirst("userId")!.Value);
        var result = await userService.UpdateProfileAsync(userId, dto);
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<ActionResult<ApiResponse<string>>> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = long.Parse(User.FindFirst("userId")!.Value);
        await userService.ChangePasswordAsync(userId, dto);
        return Ok(ApiResponse<string>.Ok("Mot de passe modifié."));
    }

    // ── Confirmation helpers ───────────────────────────────────────────────────

    [HttpPost("resend-confirmation")]
    public async Task<ActionResult<ApiResponse<string>>> ResendConfirmation(
        [FromBody] ResendConfirmationDto dto)
    {
        var emailLower = dto.Email.ToLower();
        var user = await db.Utilisateurs.FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower);
        if (user is null) return Ok(ApiResponse<string>.Ok("Si cet email existe, un lien a été envoyé."));

        var token = Guid.NewGuid().ToString("N");
        user.EmailConfirmationToken = token;
        await db.SaveChangesAsync();
        var delivered = await emailService.SendEmailConfirmationAsync(user.Email, token);
        if (!delivered)
            Console.WriteLine($"[DEV] Token de confirmation pour {user.Email}: {token}");
        return Ok(ApiResponse<string>.Ok("Email de confirmation envoyé."));
    }

    [HttpPost("validate-token")]
    public ActionResult<ApiResponse<object>> ValidateToken([FromBody] ValidateTokenDto dto)
    {
        // Lightweight check — full validation happens when the token is used
        var valid = !string.IsNullOrWhiteSpace(dto.Token);
        return Ok(ApiResponse<object>.Ok(new { valid }));
    }
}

public record ResendConfirmationDto(string Email);
public record ValidateTokenDto(string Token);
