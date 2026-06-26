using XparkGMAO.Core.Entities.GestionFlotte;

namespace XparkGMAO.Core.Entities.GestionMaintenance;

/// <summary>
/// Type d'intervention de maintenance
/// </summary>
public enum TypeIntervention
{
    PREVENTIVE,
    CURATIVE
}

/// <summary>
/// Statut d'une intervention
/// </summary>
public enum StatutIntervention
{
    EN_ATTENTE = 0,
    PLANIFIEE = 1,
    EN_COURS = 2,
    TERMINEE = 3,
    ANNULEE = 4
}

/// <summary>
/// Priorité d'un ordre de travail ou d'une intervention
/// </summary>
public enum PrioriteOrdreTravail
{
    BASSE = 0,
    MOYENNE = 1,
    HAUTE = 2,
    URGENT = 3
}

/// <summary>
/// Statut d'un ordre de travail
/// </summary>
public enum StatutOrdreTravail
{
    PLANIFIE = 0,
    EN_COURS = 1,
    TERMINE = 2,
    ANNULE = 3
}

/// <summary>
/// Entité représentant une intervention de maintenance
/// </summary>
public class Intervention
{
    public long IdIntervention { get; set; }
    public DateTime DateIntervention { get; set; }
    public DateTime? DateFinIntervention { get; set; }
    public TypeIntervention TypeIntervention { get; set; }
    public string Description { get; set; } = string.Empty;
    public double Cout { get; set; }
    public double? CoutMainOeuvre { get; set; }
    public double? CoutPieces { get; set; }
    public StatutIntervention Statut { get; set; } = StatutIntervention.PLANIFIEE;
    public double KilometrageIntervention { get; set; }
    public string? Observations { get; set; }
    public string? Prestataire { get; set; }
    public int? DureeMinutes { get; set; }
    public string? TypePeriodicite { get; set; } // "km" ou "mois"
    public long VehiculeId { get; set; }
    public long? TechnicienId { get; set; }
    public long? OrdreTravailId { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Vehicule Vehicule { get; set; } = null!;
    public OrdreTravail? OrdreTravail { get; set; }
    public ICollection<InterventionPiece> InterventionPieces { get; set; } = new List<InterventionPiece>();
}

/// <summary>
/// Table de liaison entre Intervention et PieceRechange
/// </summary>
public class InterventionPiece
{
    public long IdInterventionPiece { get; set; }
    public long InterventionId { get; set; }
    public long PieceId { get; set; }
    public int Quantite { get; set; }
    public double PrixUnitaire { get; set; }

    // Navigation properties
    public Intervention Intervention { get; set; } = null!;
    public PieceRechange Piece { get; set; } = null!;
}
