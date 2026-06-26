using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.GestionMaintenance;

/// <summary>
/// Entité représentant un ordre de travail
/// </summary>
public class OrdreTravail
{
    public long IdOrdreTravail { get; set; }
    public string Reference { get; set; } = string.Empty;
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    public DateTime? DateDebut { get; set; }
    public DateTime? DateFin { get; set; }
    public string Description { get; set; } = string.Empty;
    public StatutOrdreTravail Statut { get; set; } = StatutOrdreTravail.PLANIFIE;
    public PrioriteOrdreTravail Priorite { get; set; } = PrioriteOrdreTravail.MOYENNE;
    public double? CoutReel { get; set; }
    public string? Observations { get; set; }

    /// <summary>Motif obligatoire en cas d'annulation</summary>
    public string? MotifAnnulation { get; set; }

    /// <summary>Validé par un responsable avant exécution (null = pas encore validé)</summary>
    public long? ValideParId { get; set; }
    public Utilisateur? ValidePar { get; set; }
    public DateTime? DateValidation { get; set; }

    // Relations
    public long VehiculeId { get; set; }
    public Vehicule Vehicule { get; set; } = null!;

    public long? TechnicienId { get; set; }
    public Utilisateur? Technicien { get; set; }

    public ICollection<Intervention> Interventions { get; set; } = new List<Intervention>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public ICollection<Commentaire> Commentaires { get; set; } = new List<Commentaire>();
    public ICollection<HistoriqueStatutOT> HistoriqueStatuts { get; set; } = new List<HistoriqueStatutOT>();

    // Propriétés calculées
    public double CoutEstime => Interventions.Sum(i => i.Cout);
    public int NombreInterventions => Interventions.Count;
}
