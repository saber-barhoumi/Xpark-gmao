using IAM.API.Data;
using IAM.API.DTOs;
using IAM.API.Entities;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Shared.Enums;
using XparkGMAO.Shared.Events;

namespace IAM.API.Services;

public class AuthService(
    IamDbContext     db,
    IJwtService      jwt,
    IEmailService    email,
    IPublishEndpoint bus,
    IConfiguration   config) : IAuthService
{
    private readonly int _refreshDays = int.Parse(config["Jwt:RefreshTokenExpiryDays"] ?? "7");

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto, string ipAddress)
    {
        var emailLower = dto.Email.ToLower();
        var user = await db.Utilisateurs
            .FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.MotDePasse))
        {
            if (user is not null)
            {
                user.FailedLoginAttempts++;
                if (user.FailedLoginAttempts >= 5)
                    user.AccountLockedUntil = DateTime.UtcNow.AddMinutes(15);
                await db.SaveChangesAsync();
            }
            throw new UnauthorizedAccessException("Email ou mot de passe incorrect.");
        }

        if (user.AccountLockedUntil.HasValue && user.AccountLockedUntil > DateTime.UtcNow)
            throw new UnauthorizedAccessException("Compte temporairement bloqué. Réessayez plus tard.");

        if (!user.EmailConfirmed)
            return new AuthResponseDto("", "", user.Email, user.Role.ToString(), user.Statut.ToString(),
                user.Nom, user.Prenom, user.IdUtilisateur, DateTime.UtcNow,
                RequiresEmailConfirmation: true,
                Message: "Veuillez confirmer votre email.");

        if (user.Statut == StatutUtilisateur.EN_ATTENTE)
            return new AuthResponseDto("", "", user.Email, user.Role.ToString(), user.Statut.ToString(),
                user.Nom, user.Prenom, user.IdUtilisateur, DateTime.UtcNow,
                RequiresAdminApproval: true,
                Message: "Votre compte attend l'approbation d'un administrateur.");

        if (user.Statut == StatutUtilisateur.SUSPENDU || user.Statut == StatutUtilisateur.DESACTIVE)
            throw new UnauthorizedAccessException("Compte suspendu ou désactivé.");

        user.FailedLoginAttempts = 0;
        user.AccountLockedUntil  = null;
        user.LastLoginAt         = DateTime.UtcNow;
        user.LastLoginIp         = ipAddress;
        user.RefreshToken        = jwt.GenerateRefreshToken();
        user.RefreshTokenExpiry  = DateTime.UtcNow.AddDays(_refreshDays);
        await db.SaveChangesAsync();

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
    {
        if (dto.Password != dto.ConfirmPassword)
            throw new ArgumentException("Les mots de passe ne correspondent pas.");

        var exists = await db.Utilisateurs.AnyAsync(u => u.Email == dto.Email.ToLower());
        if (exists) throw new InvalidOperationException("Email déjà utilisé.");

        var user = new Utilisateur
        {
            Nom              = dto.Nom,
            Prenom           = dto.Prenom,
            Email            = dto.Email.ToLower(),
            MotDePasse       = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Telephone        = dto.Telephone,
            Role             = dto.Role,
            Statut           = dto.Role == Role.CLIENT ? StatutUtilisateur.EN_ATTENTE : StatutUtilisateur.EN_ATTENTE,
            EmailConfirmationToken       = Guid.NewGuid().ToString("N"),
            EmailConfirmationTokenExpiry = DateTime.UtcNow.AddHours(24),
        };

        db.Utilisateurs.Add(user);
        await db.SaveChangesAsync();

        await email.SendEmailConfirmationAsync(user.Email, user.EmailConfirmationToken!);
        await bus.Publish(new UserRegisteredEvent(user.IdUtilisateur, user.Email, user.Nom, user.Prenom, user.Role.ToString()));

        return new AuthResponseDto("", "", user.Email, user.Role.ToString(), user.Statut.ToString(),
            user.Nom, user.Prenom, user.IdUtilisateur, DateTime.UtcNow,
            RequiresEmailConfirmation: true,
            Message: "Compte créé. Veuillez confirmer votre email.");
    }

    public async Task LogoutAsync(long userId)
    {
        var user = await db.Utilisateurs.FindAsync(userId);
        if (user is not null)
        {
            user.RefreshToken       = null;
            user.RefreshTokenExpiry = null;
            await db.SaveChangesAsync();
        }
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var user = await db.Utilisateurs.FirstOrDefaultAsync(u =>
            u.RefreshToken == refreshToken && u.RefreshTokenExpiry > DateTime.UtcNow);

        if (user is null) throw new UnauthorizedAccessException("Refresh token invalide ou expiré.");

        user.RefreshToken       = jwt.GenerateRefreshToken();
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_refreshDays);
        await db.SaveChangesAsync();

        return BuildAuthResponse(user);
    }

    public async Task ConfirmEmailAsync(ConfirmEmailDto dto)
    {
        var emailLower = dto.Email.ToLower();
        var user = await db.Utilisateurs.FirstOrDefaultAsync(u =>
            u.Email.ToLower() == emailLower &&
            u.EmailConfirmationToken == dto.Token &&
            u.EmailConfirmationTokenExpiry > DateTime.UtcNow);

        if (user is null) throw new ArgumentException("Token de confirmation invalide ou expiré.");

        user.EmailConfirmed               = true;
        user.EmailConfirmationToken       = null;
        user.EmailConfirmationTokenExpiry = null;

        // Auto-approve clients, others need admin
        if (user.Role == Role.CLIENT) user.Statut = StatutUtilisateur.ACTIF;

        await db.SaveChangesAsync();
    }

    public async Task RecoverPasswordAsync(RecoverPasswordDto dto)
    {
        var emailLower = dto.Email.ToLower();
        var user = await db.Utilisateurs.FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower);
        if (user is null) return; // silent – security best practice

        user.PasswordResetToken       = Guid.NewGuid().ToString("N");
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        await db.SaveChangesAsync();

        await email.SendPasswordResetAsync(user.Email, user.PasswordResetToken!);
    }

    public async Task ResetPasswordAsync(ResetPasswordDto dto)
    {
        if (dto.NewPassword != dto.ConfirmPassword)
            throw new ArgumentException("Les mots de passe ne correspondent pas.");

        var emailLower2 = dto.Email.ToLower();
        var user = await db.Utilisateurs.FirstOrDefaultAsync(u =>
            u.Email.ToLower() == emailLower2 &&
            u.PasswordResetToken == dto.Token &&
            u.PasswordResetTokenExpiry > DateTime.UtcNow);

        if (user is null) throw new ArgumentException("Token de réinitialisation invalide ou expiré.");

        user.MotDePasse             = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.PasswordResetToken     = null;
        user.PasswordResetTokenExpiry = null;
        await db.SaveChangesAsync();
    }

    public async Task SetPinAsync(long userId, SetPinDto dto)
    {
        var user = await db.Utilisateurs.FindAsync(userId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        if (dto.Pin.Length != 4 || !dto.Pin.All(char.IsDigit))
            throw new ArgumentException("Le PIN doit être 4 chiffres.");

        user.Pin    = BCrypt.Net.BCrypt.HashPassword(dto.Pin);
        user.HasPin = true;
        await db.SaveChangesAsync();
    }

    public async Task<AuthResponseDto> LoginPinAsync(LoginPinDto dto)
    {
        var emailLower = dto.Email.ToLower();
        var user = await db.Utilisateurs.FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower);

        if (user is null || !user.HasPin || !BCrypt.Net.BCrypt.Verify(dto.Pin, user.Pin))
            throw new UnauthorizedAccessException("Email ou PIN incorrect.");

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> UnlockSessionAsync(long userId, UnlockSessionDto dto)
    {
        var user = await db.Utilisateurs.FindAsync(userId)
            ?? throw new KeyNotFoundException("Utilisateur introuvable.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.MotDePasse))
            throw new UnauthorizedAccessException("Mot de passe incorrect.");

        user.IsSessionLocked = false;
        user.SessionLockedAt  = null;
        await db.SaveChangesAsync();

        return BuildAuthResponse(user);
    }

    private AuthResponseDto BuildAuthResponse(Utilisateur user)
    {
        var token        = jwt.GenerateToken(user);
        var refreshToken = user.RefreshToken ?? jwt.GenerateRefreshToken();
        return new AuthResponseDto(
            Token:          token,
            RefreshToken:   refreshToken,
            Email:          user.Email,
            Role:           user.Role.ToString(),
            Statut:         user.Statut.ToString(),
            Nom:            user.Nom,
            Prenom:         user.Prenom,
            IdUtilisateur:  user.IdUtilisateur,
            Expiration:     DateTime.UtcNow.AddMinutes(60),
            PhotoUrl:       user.Photo
        );
    }
}
