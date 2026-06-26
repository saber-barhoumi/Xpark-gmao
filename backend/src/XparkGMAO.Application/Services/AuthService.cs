using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using XparkGMAO.Core.DTOs;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.Security;
using XparkGMAO.Core.Interfaces.Services;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Application.Services;

/// <summary>
/// Service d'authentification et gestion des tokens JWT - Version complète
/// </summary>
public class AuthService : IAuthService
{
    private readonly XparkDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;

    public AuthService(XparkDbContext context, IConfiguration configuration, IEmailService emailService)
    {
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
    }

    // ─── 1. LOGIN ────────────────────────────────────────────────────────────
    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Utilisateurs
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
            throw new UnauthorizedAccessException("Email ou mot de passe incorrect");

        // Vérifier si l'email est confirmé
        if (!user.EmailConfirmed)
            throw new UnauthorizedAccessException("Veuillez confirmer votre adresse email. Vérifiez votre boîte mail.");

        // Vérifier si compte verrouillé
        if (user.AccountLockedUntil.HasValue && user.AccountLockedUntil > DateTime.UtcNow)
            throw new UnauthorizedAccessException($"Compte verrouillé jusqu'à {user.AccountLockedUntil.Value:HH:mm}");

        // Vérifier mot de passe
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.MotDePasse))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
                user.AccountLockedUntil = DateTime.UtcNow.AddMinutes(15);
            await _context.SaveChangesAsync();
            throw new UnauthorizedAccessException("Email ou mot de passe incorrect");
        }

        if (!user.Actif)
            throw new UnauthorizedAccessException("Compte désactivé. Contactez l'administrateur.");

        // CRITIQUE : Vérifier approbation pour rôles sensibles
        if (user.Statut != StatutUtilisateur.ACTIF)
        {
            var message = user.Statut switch
            {
                StatutUtilisateur.EN_ATTENTE => 
                    "Votre compte est en attente d'approbation par un administrateur. " +
                    "Vous recevrez un email une fois votre compte activé.",
                StatutUtilisateur.SUSPENDU => 
                    "Votre compte a été suspendu. Contactez un administrateur.",
                StatutUtilisateur.DESACTIVE => 
                    "Votre compte a été désactivé. Contactez un administrateur.",
                _ => "Votre compte n'est pas actif."
            };
            throw new UnauthorizedAccessException(message);
        }

        // Réinitialiser tentatives échouées
        user.FailedLoginAttempts = 0;
        user.AccountLockedUntil = null;
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return BuildAuthResponse(user);
    }

    /// <summary>
    /// Inscrit un nouvel utilisateur ou ré-inscrit un compte précédemment rejeté.
    /// </summary>
    /// <param name="dto">Données d'inscription</param>
    /// <returns>Résultat de l'opération avec statut</returns>
    public async Task<AuthResultDto> RegisterAsync(RegisterDto dto)
    {
        try
        {
            // 1. Rechercher un utilisateur existant par email (case-insensitive)
            var existingUser = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());

            if (existingUser != null)
            {
                // 3. Si l'utilisateur est trouvé -> vérifier Statut
                switch (existingUser.Statut)
                {
                    case StatutUtilisateur.EN_ATTENTE:
                        return new AuthResultDto { Success = false, Message = "Un compte en attente existe déjà pour cet email." };

                    case StatutUtilisateur.ACTIF:
                        return new AuthResultDto { Success = false, Message = "Un compte actif existe déjà pour cet email." };

                    case StatutUtilisateur.DESACTIVE:
                        // Statut == 3 (Rejeté) -> UPDATE
                        existingUser.Nom = dto.Nom;
                        existingUser.Prenom = dto.Prenom;
                        existingUser.MotDePasse = BCrypt.Net.BCrypt.HashPassword(dto.MotDePasse);
                        
                        existingUser.Statut = StatutUtilisateur.EN_ATTENTE;
                        existingUser.DateApprobation = null;
                        existingUser.ApprouvePar = null;
                        existingUser.RaisonRejet = null;
                        existingUser.DateModification = DateTime.UtcNow;

                        // Notifications et Reset Confirmation
                        existingUser.EmailConfirmed = false; 
                        var reToken = GenerateRandomToken();
                        existingUser.EmailConfirmationToken = reToken;
                        existingUser.EmailConfirmationTokenExpiry = DateTime.UtcNow.AddHours(24);

                        await _context.SaveChangesAsync();

                        // Envois asynchrones
                        await _emailService.SendConfirmationEmailAsync(existingUser.Email, reToken);
                        await NotifierAdminsNouvelleInscription(existingUser);

                        return new AuthResultDto 
                        { 
                            Success = true, 
                            Message = "Votre demande a été soumise à nouveau. Elle est en attente d'approbation.",
                            NewStatut = (int)StatutUtilisateur.EN_ATTENTE
                        };

                    default:
                        return new AuthResultDto { Success = false, Message = "Un compte avec cet email existe déjà." };
                }
            }

            // 2. Si l'utilisateur n'est PAS trouvé -> INSERT normal
            var token = GenerateRandomToken();
            var user = new Utilisateur
            {
                Nom = dto.Nom,
                Prenom = dto.Prenom,
                Email = dto.Email.ToLower(),
                MotDePasse = BCrypt.Net.BCrypt.HashPassword(dto.MotDePasse),
                DateCreation = DateTime.UtcNow,
                Statut = StatutUtilisateur.EN_ATTENTE,
                EmailConfirmed = false,
                Actif = true,
                EmailConfirmationToken = token,
                EmailConfirmationTokenExpiry = DateTime.UtcNow.AddHours(24),
                Role = Role.CLIENT // Rôle par défaut pour l'inscription publique
            };

            _context.Utilisateurs.Add(user);
            await _context.SaveChangesAsync();

            // Envois asynchrones
            await _emailService.SendConfirmationEmailAsync(user.Email, token);
            await NotifierAdminsNouvelleInscription(user);

            return new AuthResultDto 
            { 
                Success = true, 
                Message = "Votre compte a été créé. Il est en attente d'approbation par un administrateur.",
                NewStatut = (int)StatutUtilisateur.EN_ATTENTE
            };
        }
        catch (Exception ex)
        {
            throw new Exception("Erreur interne lors de l'inscription", ex);
        }
    }

    // ─── 3. LOGOUT ───────────────────────────────────────────────────────────
    public async Task<bool> LogoutAsync(long userId)
    {
        var user = await _context.Utilisateurs.FindAsync(userId);
        if (user == null) return false;

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        await _context.SaveChangesAsync();
        return true;
    }

    // ─── 4. REQUEST PASSWORD RESET ───────────────────────────────────────────
    public async Task<bool> RequestPasswordResetAsync(string email)
    {
        var user = await _context.Utilisateurs
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null) return true; // Ne pas révéler si l'email existe

        user.PasswordResetToken = GenerateRandomToken();
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        await _context.SaveChangesAsync();

        // Envoyer email avec lien de reset
        await _emailService.SendPasswordResetEmailAsync(user.Email, user.PasswordResetToken);

        return true;
    }

    // ─── 5. RESET PASSWORD ───────────────────────────────────────────────────
    public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
    {
        if (dto.NewPassword != dto.ConfirmPassword)
            throw new ArgumentException("Les mots de passe ne correspondent pas");

        var user = await _context.Utilisateurs
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.PasswordResetToken == dto.Token);

        if (user == null)
            throw new ArgumentException("Token invalide ou expiré");

        if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
            throw new ArgumentException("Token expiré");

        user.MotDePasse = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        user.FailedLoginAttempts = 0;
        user.AccountLockedUntil = null;

        await _context.SaveChangesAsync();
        return true;
    }

    // ─── 6. CREATE PASSWORD (première connexion ou réinitialisation) ─────────────
    public async Task<bool> CreatePasswordAsync(CreatePasswordDto dto)
    {
        if (dto.Password != dto.ConfirmPassword)
            throw new ArgumentException("Les mots de passe ne correspondent pas");

        var user = await _context.Utilisateurs
            .FirstOrDefaultAsync(u => u.Email == dto.Email && 
                (u.EmailConfirmationToken == dto.Token || u.PasswordResetToken == dto.Token));

        if (user == null)
            throw new ArgumentException("Token invalide");

        if (user.EmailConfirmationToken == dto.Token && user.EmailConfirmationTokenExpiry.HasValue && user.EmailConfirmationTokenExpiry < DateTime.UtcNow)
            throw new ArgumentException("Token de confirmation expiré");

        if (user.PasswordResetToken == dto.Token && user.PasswordResetTokenExpiry.HasValue && user.PasswordResetTokenExpiry < DateTime.UtcNow)
            throw new ArgumentException("Token de réinitialisation expiré");

        user.MotDePasse = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        
        // Nettoyer le champ correspondant au token utilisé
        if (user.EmailConfirmationToken == dto.Token)
        {
            user.EmailConfirmed = true;
            user.EmailConfirmationToken = null;
            user.EmailConfirmationTokenExpiry = null;
        }
        else if (user.PasswordResetToken == dto.Token)
        {
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;
            user.FailedLoginAttempts = 0;
            user.AccountLockedUntil = null;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    // ─── 7. CONFIRM EMAIL ────────────────────────────────────────────────────
    public async Task<bool> ConfirmEmailAsync(string email, string token)
    {
        var user = await _context.Utilisateurs
            .FirstOrDefaultAsync(u => u.Email == email && u.EmailConfirmationToken == token);

        if (user == null)
            throw new ArgumentException("Token de confirmation invalide");

        if (user.EmailConfirmationTokenExpiry.HasValue && user.EmailConfirmationTokenExpiry < DateTime.UtcNow)
            throw new ArgumentException("Token de confirmation expiré");

        user.EmailConfirmed = true;
        user.EmailConfirmationToken = null;
        user.EmailConfirmationTokenExpiry = null;

        await _context.SaveChangesAsync();
        return true;
    }

    // ─── 8. RESEND CONFIRMATION EMAIL ────────────────────────────────────────
    public async Task<bool> ResendConfirmationEmailAsync(string email)
    {
        var user = await _context.Utilisateurs
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null || user.EmailConfirmed) return true;

        user.EmailConfirmationToken = GenerateRandomToken();
        user.EmailConfirmationTokenExpiry = DateTime.UtcNow.AddHours(24);
        await _context.SaveChangesAsync();

        // Envoyer email de confirmation
        await _emailService.SendConfirmationEmailAsync(user.Email, user.EmailConfirmationToken);

        return true;
    }

    // ─── 9. LOGIN WITH PIN ───────────────────────────────────────────────────
    public async Task<AuthResponseDto> LoginWithPinAsync(LoginPinDto request)
    {
        var user = await _context.Utilisateurs
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.HasPin);

        if (user == null || user.Pin == null || !BCrypt.Net.BCrypt.Verify(request.Pin, user.Pin))
            throw new UnauthorizedAccessException("Email ou PIN incorrect");

        if (!user.Actif)
            throw new UnauthorizedAccessException("Compte désactivé");

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return BuildAuthResponse(user);
    }

    // ─── 10. SET PIN ─────────────────────────────────────────────────────────
    public async Task<bool> SetPinAsync(long userId, string pin)
    {
        var user = await _context.Utilisateurs.FindAsync(userId);
        if (user == null) return false;

        user.Pin = BCrypt.Net.BCrypt.HashPassword(pin);
        user.HasPin = true;
        await _context.SaveChangesAsync();
        return true;
    }

    // ─── 11. LOCK SESSION ────────────────────────────────────────────────────
    public async Task<bool> LockSessionAsync(long userId)
    {
        var user = await _context.Utilisateurs.FindAsync(userId);
        if (user == null) return false;

        user.IsSessionLocked = true;
        user.SessionLockedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    // ─── 12. UNLOCK SESSION ──────────────────────────────────────────────────
    public async Task<AuthResponseDto> UnlockSessionAsync(UnlockSessionDto request)
    {
        var user = await _context.Utilisateurs.FindAsync(request.UserId);

        if (user == null || !user.IsSessionLocked)
            throw new UnauthorizedAccessException("Session non verrouillée");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.MotDePasse))
            throw new UnauthorizedAccessException("Mot de passe incorrect");

        user.IsSessionLocked = false;
        user.SessionLockedAt = null;
        await _context.SaveChangesAsync();

        return BuildAuthResponse(user);
    }

    // ─── 13. CHANGE PASSWORD ─────────────────────────────────────────────────
    public async Task<bool> ChangePasswordAsync(long userId, ChangePasswordDto dto)
    {
        if (dto.NewPassword != dto.ConfirmPassword)
            throw new ArgumentException("Les nouveaux mots de passe ne correspondent pas");

        var user = await _context.Utilisateurs.FindAsync(userId);
        if (user == null) return false;

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.MotDePasse))
            throw new ArgumentException("Mot de passe actuel incorrect");

        user.MotDePasse = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();
        return true;
    }

    // ─── 14. GET USER PROFILE ────────────────────────────────────────────────
    public async Task<UserProfileDto> GetUserProfileAsync(long userId)
    {
        var user = await _context.Utilisateurs.FindAsync(userId);
        if (user == null) throw new KeyNotFoundException("Utilisateur non trouvé");

        return new UserProfileDto
        {
            IdUtilisateur = user.IdUtilisateur,
            Nom = user.Nom,
            Prenom = user.Prenom,
            Email = user.Email,
            Telephone = user.Telephone,
            Role = user.Role.ToString(),
            Actif = user.Actif,
            EmailConfirmed = user.EmailConfirmed,
            HasPin = user.HasPin,
            DateCreation = user.DateCreation
        };
    }

    // ─── 15. UPDATE USER PROFILE ─────────────────────────────────────────────
    public async Task<bool> UpdateUserProfileAsync(long userId, UpdateProfileDto dto)
    {
        var user = await _context.Utilisateurs.FindAsync(userId);
        if (user == null) return false;

        if (dto.Nom != null) user.Nom = dto.Nom;
        if (dto.Prenom != null) user.Prenom = dto.Prenom;
        if (dto.Telephone != null) user.Telephone = dto.Telephone;

        await _context.SaveChangesAsync();
        return true;
    }

    // ─── 16. GENERATE EMAIL CONFIRMATION TOKEN ───────────────────────────────
    public async Task<string> GenerateEmailConfirmationTokenAsync(long userId)
    {
        var user = await _context.Utilisateurs.FindAsync(userId);
        if (user == null) throw new KeyNotFoundException("Utilisateur non trouvé");

        var token = GenerateRandomToken();
        user.EmailConfirmationToken = token;
        user.EmailConfirmationTokenExpiry = DateTime.UtcNow.AddHours(24);
        await _context.SaveChangesAsync();
        return token;
    }

    // ─── 17. GENERATE PASSWORD RESET TOKEN ───────────────────────────────────
    public async Task<string> GeneratePasswordResetTokenAsync(string email)
    {
        var user = await _context.Utilisateurs
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null) throw new KeyNotFoundException("Utilisateur non trouvé");

        var token = GenerateRandomToken();
        user.PasswordResetToken = token;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        await _context.SaveChangesAsync();
        return token;
    }

    // ─── 18. VALIDATE TOKEN ──────────────────────────────────────────────────
    public async Task<bool> ValidateTokenAsync(string token)
    {
        var user = await _context.Utilisateurs
            .FirstOrDefaultAsync(u =>
                (u.EmailConfirmationToken == token && u.EmailConfirmationTokenExpiry > DateTime.UtcNow) ||
                (u.PasswordResetToken == token && u.PasswordResetTokenExpiry > DateTime.UtcNow));
        return user != null;
    }

    // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────
    private AuthResponseDto BuildAuthResponse(Utilisateur user)
    {
        var token = GenerateJwtToken(user);
        var expiration = DateTime.UtcNow.AddMinutes(
            Convert.ToDouble(_configuration["JwtSettings:ExpirationMinutes"] ?? "60"));

        return new AuthResponseDto
        {
            Token = token,
            RefreshToken = string.Empty,
            Email = user.Email,
            Role = user.Role.ToString(),
            Statut = user.Statut.ToString(),
            Nom = user.Nom,
            Prenom = user.Prenom,
            IdUtilisateur = user.IdUtilisateur,
            PhotoUrl = user.Photo,
            Expiration = expiration
        };
    }

    private string GenerateJwtToken(Utilisateur user)
    {
        var secret = _configuration["JwtSettings:Secret"]
            ?? throw new InvalidOperationException("JWT Secret not configured");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.IdUtilisateur.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(ClaimTypes.Name, $"{user.Prenom} {user.Nom}"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            
            // Claims personnalisés pour validation
            new Claim("role_level", user.NiveauRole.ToString()),
            new Claim("statut", user.Statut.ToString()),
            new Claim("email_verified", user.EmailConfirmed.ToString().ToLower()),
            new Claim("account_approved", user.EstApprouve.ToString().ToLower()),
            
            // Signature de sécurité
            new Claim("role_signature", GenerateRoleSignature(user.IdUtilisateur, user.Role))
        };

        var expirationMinutes = Convert.ToDouble(_configuration["JwtSettings:ExpirationMinutes"] ?? "60");

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRandomToken()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[32];
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    }

    // ─── DIAGNOSTIC ──────────────────────────────────────────────────────────
    public async Task<Utilisateur?> GetUserByEmailAsync(string email)
    {
        return await _context.Utilisateurs.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<IEnumerable<object>> GetAllUsersForDiagnosticAsync()
    {
        return await _context.Utilisateurs
            .Select(u => new
            {
                u.IdUtilisateur,
                u.Email,
                u.Prenom,
                u.Nom,
                u.EmailConfirmed,
                TokenExpiry = u.EmailConfirmationTokenExpiry,
                u.Actif
            })
            .ToListAsync();
    }

    public async Task<bool> SetPasswordForUserAsync(string email, string newPassword)
    {
        var user = await _context.Utilisateurs.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
            throw new ArgumentException($"User with email {email} not found");

        user.MotDePasse = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _context.SaveChangesAsync();
        return true;
    }

    private string GenerateRoleSignature(long userId, Role role)
    {
        var secret = _configuration["JwtSettings:Secret"] ?? "default_secret_for_tests";
        var data = $"{userId}:{role}:{secret}";
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(data));
        return Convert.ToBase64String(hash).Substring(0, 16);
    }

    private bool VerifyRoleSignature(long userId, Role role, string signature)
    {
        var expectedSignature = GenerateRoleSignature(userId, role);
        return signature == expectedSignature;
    }

    private async Task NotifierAdminsNouvelleInscription(Utilisateur user)
    {
        var admins = await _context.Utilisateurs
            .Where(u => u.Role == Role.ADMIN && u.Actif && u.EmailConfirmed)
            .ToListAsync();

        foreach (var admin in admins)
        {
            await _emailService.SendNewUserNotificationAsync(
                admin.Email,
                $"{admin.Prenom} {admin.Nom}",
                $"{user.Prenom} {user.Nom}",
                user.Email,
                user.Role.ToString()
            );
        }
    }
}
