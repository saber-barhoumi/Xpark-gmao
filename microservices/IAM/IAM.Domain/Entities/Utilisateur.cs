using XparkGMAO.Shared.Enums;

namespace IAM.Domain.Entities;

public class Utilisateur
{
    public long   IdUtilisateur   { get; set; }
    public string Nom             { get; set; } = string.Empty;
    public string Prenom          { get; set; } = string.Empty;
    public string Email           { get; set; } = string.Empty;
    public string MotDePasse      { get; set; } = string.Empty;
    public string Telephone       { get; set; } = string.Empty;
    public bool   Actif           { get; set; } = true;
    public DateTime DateCreation  { get; set; } = DateTime.UtcNow;
    public Role   Role            { get; set; } = Role.CLIENT;
    public string? Photo          { get; set; }

    // Email confirmation
    public bool      EmailConfirmed               { get; set; } = false;
    public string?   EmailConfirmationToken       { get; set; }
    public DateTime? EmailConfirmationTokenExpiry { get; set; }

    // Password reset
    public string?   PasswordResetToken       { get; set; }
    public DateTime? PasswordResetTokenExpiry { get; set; }

    // PIN
    public string? Pin    { get; set; }
    public bool    HasPin { get; set; } = false;

    // Session
    public bool      IsSessionLocked { get; set; } = false;
    public DateTime? SessionLockedAt { get; set; }

    // Refresh token
    public string?   RefreshToken       { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    // Login tracking
    public DateTime? LastLoginAt        { get; set; }
    public string?   LastLoginIp        { get; set; }
    public int       FailedLoginAttempts { get; set; } = 0;
    public DateTime? AccountLockedUntil { get; set; }

    // RBAC
    public StatutUtilisateur Statut          { get; set; } = StatutUtilisateur.EN_ATTENTE;
    public DateTime?         DateApprobation { get; set; }
    public long?             ApprouvePar     { get; set; }
    public string?           RaisonRejet     { get; set; }
    public DateTime?         DateModification { get; set; }
}
