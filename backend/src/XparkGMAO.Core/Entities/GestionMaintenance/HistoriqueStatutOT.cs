using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.GestionMaintenance;

/// <summary>
/// Historique des changements de statut d'un ordre de travail
/// </summary>
public class HistoriqueStatutOT
{
    public long Id { get; set; }

    public long OrdreTravailId { get; set; }
    public OrdreTravail OrdreTravail { get; set; } = null!;

    public string AncienStatut { get; set; } = string.Empty;
    public string NouveauStatut { get; set; } = string.Empty;

    /// <summary>Commentaire optionnel (motif d'annulation, raison du changement)</summary>
    public string? Commentaire { get; set; }

    public long? UtilisateurId { get; set; }
    public Utilisateur? Utilisateur { get; set; }

    public DateTime DateChangement { get; set; } = DateTime.UtcNow;
}
