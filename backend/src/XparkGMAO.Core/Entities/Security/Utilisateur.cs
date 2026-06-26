namespace XparkGMAO.Core.Entities.Security;

/// <summary>
/// Entité de base pour tous les utilisateurs du système
/// </summary>
public class Utilisateur
{
    public long IdUtilisateur { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string MotDePasse { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public bool Actif { get; set; } = true;
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    public Role Role { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public string? Photo { get; set; }

    // Email Confirmation
    public bool EmailConfirmed { get; set; } = false;
    public string? EmailConfirmationToken { get; set; }
    public DateTime? EmailConfirmationTokenExpiry { get; set; }

    // Password Reset
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiry { get; set; }

    // PIN
    public string? Pin { get; set; }
    public bool HasPin { get; set; } = false;

    // Session Lock
    public bool IsSessionLocked { get; set; } = false;
    public DateTime? SessionLockedAt { get; set; }

    // Login Tracking
    public DateTime? LastLoginAt { get; set; }
    public string? LastLoginIp { get; set; }

    // Account Lockout
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTime? AccountLockedUntil { get; set; }

    // Statut et Approbation RBAC
    public StatutUtilisateur Statut { get; set; } = StatutUtilisateur.EN_ATTENTE;
    public DateTime? DateApprobation { get; set; }
    public long? ApprouvePar { get; set; }
    public string? RaisonRejet { get; set; }
    public DateTime? DateModification { get; set; }

    // Sécurité additionnelle
    public int NiveauRole => (int)Role;
    public bool EstApprouve => Statut == StatutUtilisateur.ACTIF;
    public bool PeutSeConnecter => Actif && EmailConfirmed && EstApprouve;
}

/// <summary>
/// Statut d'activation de l'utilisateur
/// </summary>
public enum StatutUtilisateur
{
    EN_ATTENTE = 0,     // En attente d'approbation admin
    ACTIF = 1,          // Approuvé et actif
    SUSPENDU = 2,       // Suspendu temporairement
    DESACTIVE = 3       // Désactivé définitivement
}

/// <summary>
/// Rôles disponibles dans le système GMAO avec niveaux hiérarchiques
/// </summary>
public enum Role
{
    ADMIN = 6,          // Niveau le plus élevé
    ADMINISTRATEUR = 5,
    GESTIONNAIRE = 4,
    TECHNICIEN = 3,
    CHAUFFEUR = 2,
    CLIENT = 1          // Niveau le plus bas
}
