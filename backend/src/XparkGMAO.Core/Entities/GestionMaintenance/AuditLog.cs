namespace XparkGMAO.Core.Entities.GestionMaintenance;

/// <summary>
/// Journal d'audit pour tracer les modifications sur les entités critiques
/// </summary>
public class AuditLog
{
    public long Id { get; set; }

    /// <summary>Nom de l'entité modifiée (Source, OrdreTravail, Vehicule, etc.)</summary>
    public string EntityName { get; set; } = string.Empty;

    /// <summary>ID de l'entité modifiée</summary>
    public long EntityId { get; set; }

    /// <summary>Type d'action : CREATE, UPDATE, DELETE, STATUS_CHANGE</summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>Valeurs avant modification (JSON)</summary>
    public string? OldValues { get; set; }

    /// <summary>Valeurs après modification (JSON)</summary>
    public string? NewValues { get; set; }

    /// <summary>ID de l'utilisateur qui a effectué la modification</summary>
    public long? UtilisateurId { get; set; }

    /// <summary>Nom de l'utilisateur (snapshot)</summary>
    public string? UtilisateurNom { get; set; }

    public DateTime DateAction { get; set; } = DateTime.UtcNow;
}
