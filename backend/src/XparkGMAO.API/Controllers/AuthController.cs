using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.DTOs;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Interfaces.Services;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;
    private readonly IValidator<RegisterRequestDto> _registerValidator;
    private readonly XparkDbContext _context;

    public AuthController(
        IAuthService authService, 
        ILogger<AuthController> logger,
        IValidator<RegisterRequestDto> registerValidator,
        XparkDbContext context)
    {
        _authService = authService;
        _logger = logger;
        _registerValidator = registerValidator;
        _context = context;
    }

    /// <summary>Connexion avec email et mot de passe</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        _logger.LogInformation("[LOGIN] Tentative de connexion pour {Email} à {Time}", 
            request.Email, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
        
        try
        {
            var response = await _authService.LoginAsync(request);
            _logger.LogInformation("[LOGIN] ✅ Connexion réussie pour {Email}", request.Email);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("[LOGIN] ❌ Échec connexion pour {Email} : {Message}", 
                request.Email, ex.Message);
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[LOGIN] ⚠️ Erreur inattendue pour {Email}", request.Email);
            return StatusCode(500, new { message = "Erreur serveur lors de la connexion" });
        }
    }

    /// <summary>
    /// Inscription d'un nouvel utilisateur ou ré-inscription d'un compte rejeté.
    /// </summary>
    /// <param name="request">Données d'inscription</param>
    /// <returns>201 (Créé), 200 (Ré-inscrit), 409 (Conflit) ou 500 (Erreur)</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResultDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(AuthResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Register([FromBody] RegisterDto request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request);

            if (!result.Success)
            {
                _logger.LogWarning("[REGISTER] Conflit pour {Email}: {Message}", request.Email, result.Message);
                return Conflict(new { message = result.Message });
            }

            // Si c'est une nouvelle inscription (normalement NewStatut == 0)
            _logger.LogInformation("[REGISTER] Succès pour {Email}: {Message}", request.Email, result.Message);
            
            // On retourne 200 si c'est une ré-inscription, 201 si c'est nouveau. 
            // Pour simplifier selon la demande "Return 200 OK" pour la ré-inscription.
            // On peut baser la distinction sur le message ou une propriété si on veut être précis.
            if (result.Message.Contains("soumise à nouveau"))
            {
                return Ok(result);
            }

            return CreatedAtAction(nameof(Login), result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[REGISTER] Erreur lors de l'inscription pour {Email}", request.Email);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "Une erreur inattendue s'est produite lors de l'inscription." });
        }
    }

    /// <summary>Déconnexion</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout()
    {
        var userId = GetCurrentUserId();
        await _authService.LogoutAsync(userId);
        return Ok(new { message = "Déconnexion réussie" });
    }

    /// <summary>Demander la réinitialisation du mot de passe</summary>
    [HttpPost("recover-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> RecoverPassword([FromBody] RequestPasswordResetDto request)
    {
        await _authService.RequestPasswordResetAsync(request.Email);
        return Ok(new { message = "Si cet email existe, un lien de réinitialisation a été envoyé" });
    }

    /// <summary>Réinitialiser le mot de passe avec le token</summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request)
    {
        try
        {
            await _authService.ResetPasswordAsync(request);
            return Ok(new { message = "Mot de passe réinitialisé avec succès" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Créer un nouveau mot de passe (première connexion)</summary>
    [HttpPost("create-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePassword([FromBody] CreatePasswordDto request)
    {
        try
        {
            await _authService.CreatePasswordAsync(request);
            return Ok(new { message = "Mot de passe créé avec succès" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Confirmer l'email avec le token</summary>
    [HttpPost("confirm-email")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string email, [FromQuery] string token)
    {
        try
        {
            await _authService.ConfirmEmailAsync(email, token);
            return Ok(new { message = "Email confirmé avec succès" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Renvoyer l'email de confirmation</summary>
    [HttpPost("resend-confirmation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ResendConfirmation([FromBody] RequestPasswordResetDto request)
    {
        await _authService.ResendConfirmationEmailAsync(request.Email);
        return Ok(new { message = "Email de confirmation renvoyé" });
    }

    /// <summary>Connexion avec PIN</summary>
    [HttpPost("login-pin")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LoginWithPin([FromBody] LoginPinDto request)
    {
        try
        {
            var response = await _authService.LoginWithPinAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>Définir un code PIN pour l'utilisateur connecté</summary>
    [HttpPost("set-pin")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetPin([FromBody] SetPinDto request)
    {
        var userId = GetCurrentUserId();
        await _authService.SetPinAsync(userId, request.Pin);
        return Ok(new { message = "PIN défini avec succès" });
    }

    /// <summary>Verrouiller la session</summary>
    [HttpPost("lock-screen")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> LockScreen()
    {
        var userId = GetCurrentUserId();
        await _authService.LockSessionAsync(userId);
        return Ok(new { message = "Session verrouillée" });
    }

    /// <summary>Déverrouiller la session</summary>
    [HttpPost("unlock-screen")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UnlockScreen([FromBody] UnlockSessionDto request)
    {
        try
        {
            var response = await _authService.UnlockSessionAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>Changer le mot de passe</summary>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _authService.ChangePasswordAsync(userId, request);
            return Ok(new { message = "Mot de passe changé avec succès" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Obtenir le profil de l'utilisateur connecté</summary>
    [HttpGet("profile")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetCurrentUserId();
        var profile = await _authService.GetUserProfileAsync(userId);
        return Ok(profile);
    }

    /// <summary>Mettre à jour le profil utilisateur</summary>
    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
    {
        var userId = GetCurrentUserId();
        await _authService.UpdateUserProfileAsync(userId, request);
        return Ok(new { message = "Profil mis à jour avec succès" });
    }

    /// <summary>Valider un token (password reset ou confirmation email)</summary>
    [HttpPost("validate-token")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidateToken([FromBody] ValidateTokenDto request)
    {
        var isValid = await _authService.ValidateTokenAsync(request.Token);
        return Ok(new { valid = isValid });
    }

    /// <summary>DIAGNOSTIC: Check email confirmation status and account info</summary>
    [HttpGet("diagnostic/check-email/{email}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DiagnosticCheckEmail(string email)
    {
        try
        {
            var user = await _authService.GetUserByEmailAsync(email);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(new 
            { 
                exists = true,
                email = user.Email,
                nom = user.Nom,
                prenom = user.Prenom,
                actif = user.Actif,
                emailConfirmed = user.EmailConfirmed,
                hasPassword = !string.IsNullOrEmpty(user.MotDePasse),
                failedLoginAttempts = user.FailedLoginAttempts,
                accountLockedUntil = user.AccountLockedUntil,
                isLocked = user.AccountLockedUntil.HasValue && user.AccountLockedUntil > DateTime.UtcNow,
                lastLogin = user.LastLoginAt,
                dateCreation = user.DateCreation
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>DIAGNOSTIC: List all users (for testing)</summary>
    [HttpGet("diagnostic/list-users")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DiagnosticListUsers()
    {
        var users = await _authService.GetAllUsersForDiagnosticAsync();
        return Ok(users);
    }

    /// <summary>DIAGNOSTIC: Set password for user (for testing)</summary>
    [HttpPost("diagnostic/set-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DiagnosticSetPassword([FromQuery] string email, [FromQuery] string newPassword)
    {
        try
        {
            await _authService.SetPasswordForUserAsync(email, newPassword);
            return Ok(new { 
                message = $"Password set successfully for {email}",
                email = email,
                newPassword = newPassword,
                warning = "⚠️  This is a DEBUG endpoint - Remove in production!"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>DIAGNOSTIC: Unlock a locked account (for testing)</summary>
    [HttpPost("diagnostic/unlock-account/{email}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DiagnosticUnlockAccount(string email)
    {
        try
        {
            var user = await _context.Utilisateurs.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return NotFound(new { message = "User not found" });

            // Reset failed attempts and unlock
            user.FailedLoginAttempts = 0;
            user.AccountLockedUntil = null;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"[DIAGNOSTIC] Account unlocked manually: {email}");

            return Ok(new
            {
                message = "Account unlocked successfully",
                email = user.Email,
                failedLoginAttempts = user.FailedLoginAttempts,
                accountLockedUntil = user.AccountLockedUntil,
                status = "✅ Unlocked"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>DIAGNOSTIC: Test password verification (no login side effects)</summary>
    [HttpPost("diagnostic/test-login")]  
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DiagnosticTestPassword([FromBody] LoginRequestDto request)
    {
        try
        {
            var user = await _context.Utilisateurs.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return NotFound(new { message = "User not found" });

            bool passwordMatch = BCrypt.Net.BCrypt.Verify(request.Password, user.MotDePasse);

            return Ok(new
            {
                email = user.Email,
                passwordMatch = passwordMatch,
                actif = user.Actif,
                emailConfirmed = user.EmailConfirmed,
                failedAttempts = user.FailedLoginAttempts,
                isLocked = user.AccountLockedUntil.HasValue && user.AccountLockedUntil > DateTime.UtcNow,
                lockedUntil = user.AccountLockedUntil,
                canLogin = passwordMatch && user.Actif && user.EmailConfirmed && 
                          (!user.AccountLockedUntil.HasValue || user.AccountLockedUntil <= DateTime.UtcNow)
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ─── HELPER ────────────────────────────────────────────────────────────
    private long GetCurrentUserId()
    {
        var value = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? "0";
        return long.Parse(value);
    }
}
