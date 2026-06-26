using XparkGMAO.Core.Entities.Security;
using XparkGMAO.Core.Entities.GestionEquipements;
using XparkGMAO.Core.Entities.GestionOperations;

namespace XparkGMAO.Core.Entities.GestionAlertes;

/// <summary>
/// Type d'alerte dans le système
/// </summary>
public enum TypeAlerte
{
    ASSURANCE,
    VISITE_TECHNIQUE,
    VIGNETTE,
    PERMIS_CONDUIRE,
    MAINTENANCE,
    MAINTENANCE_DUE,
    STOCK_FAIBLE,
    STOCK_RUPTURE,
    CARBURANT,
    DOCUMENT_EXPIRE,
    VEHICULE_VIGNETTE_PROCHE,
    VEHICULE_VIGNETTE_EXPIREE,
    VEHICULE_ASSURANCE_EXPIREE,
    VEHICULE_ASSURANCE_PROCHE,
    VEHICULE_VISITE_TECHNIQUE_EXPIREE,
    VEHICULE_VISITE_TECHNIQUE_PROCHE,
    VEHICULE_BESOIN_MAINTENANCE,
    OT_EN_RETARD,
    INTERVENTION_UPCOMING,
    EMPLOYE_PERMIS_EXPIRE,

    // ── Équipements ──
    EQUIPEMENT_HORS_SERVICE,
    EQUIPEMENT_A_REMPLACER,
    GARANTIE_EXPIRANTE,
    GARANTIE_EXPIREE,
    CONTRAT_EXPIRANT,
    ROTATION_FAIBLE,

    // ── Missions ──
    MISSION_EN_RETARD,
    MISSION_SANS_EQUIPEMENTS
}

/// <summary>
/// Priorité d'une alerte
/// </summary>
public enum Priorite
{
    BASSE,
    MOYENNE,
    HAUTE,
    CRITIQUE
}

/// <summary>
/// Statut d'une alerte
/// </summary>
public enum StatutAlerte
{
    ACTIVE,
    LUE,
    TRAITEE,
    IGNOREE
}

/// <summary>
/// Entité représentant une alerte proactive
/// </summary>
public class Alerte
{
    public long IdAlerte { get; set; }
    public TypeAlerte TypeAlerte { get; set; }
    private DateTime _dateAlerte = DateTime.UtcNow;
    public DateTime DateAlerte { get => _dateAlerte; set => _dateAlerte = DateTime.SpecifyKind(value, DateTimeKind.Utc); }
    private DateTime? _dateEcheance;
    public DateTime? DateEcheance { get => _dateEcheance; set => _dateEcheance = value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : null; }
    public string Message { get; set; } = string.Empty;
    public Priorite Priorite { get; set; }
    public StatutAlerte Statut { get; set; } = StatutAlerte.ACTIVE;
    public long? UtilisateurId { get; set; }
    public long? VehiculeId { get; set; }
    public long? ChauffeurId { get; set; }
    public long? EquipementId { get; set; }
    public long? MissionId { get; set; }
    public string? EntiteReference { get; set; }
    public long? EntiteReferenceId { get; set; }

    // Navigation properties
    public Utilisateur? Utilisateur { get; set; }
    public Equipement? Equipement { get; set; }
    public Mission? Mission { get; set; }
}
