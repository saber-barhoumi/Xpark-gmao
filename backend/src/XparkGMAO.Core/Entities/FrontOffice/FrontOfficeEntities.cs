using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionFlotte;

namespace XparkGMAO.Core.Entities.FrontOffice;

/// <summary>
/// Type de demande de service
/// </summary>
public enum TypeDemandeService
{
    TRANSPORT,
    LOCATION,
    MAINTENANCE,
    AUTRE
}

/// <summary>
/// Statut d'une demande de service
/// </summary>
public enum StatutDemande
{
    EN_ATTENTE,
    EN_COURS,
    TRAITEE,
    REFUSEE,
    ANNULEE
}

/// <summary>
/// Statut d'une réservation
/// </summary>
public enum StatutReservation
{
    EN_ATTENTE,
    CONFIRMEE,
    EN_COURS,
    TERMINEE,
    ANNULEE
}

/// <summary>
/// Statut d'un devis
/// </summary>
public enum StatutDevis
{
    BROUILLON,
    ENVOYE,
    ACCEPTE,
    REFUSE,
    EXPIRE
}

/// <summary>
/// Type de notification
/// </summary>
public enum TypeNotification
{
    RESERVATION,
    DEVIS,
    FACTURE,
    ALERTE,
    INFORMATION,
    PROMOTION
}

/// <summary>
/// Entité représentant une demande de service client
/// </summary>
public class DemandeService
{
    public long IdDemande { get; set; }
    public long ClientId { get; set; }
    public TypeDemandeService TypeDemande { get; set; }
    public string Description { get; set; } = string.Empty;
    public StatutDemande Statut { get; set; } = StatutDemande.EN_ATTENTE;
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    public DateTime? DateTraitement { get; set; }
    public string? Reponse { get; set; }

    // Navigation properties
    public Client Client { get; set; } = null!;
}

/// <summary>
/// Entité représentant une réservation de véhicule
/// </summary>
public class Reservation
{
    public long IdReservation { get; set; }
    public long ClientId { get; set; }
    public long? VehiculeId { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
    public bool ChauffeurRequis { get; set; }
    public StatutReservation Statut { get; set; } = StatutReservation.EN_ATTENTE;
    public double? PrixTotal { get; set; }
    public string? Destination { get; set; }
    public string? Observations { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Client Client { get; set; } = null!;
    public Vehicule? Vehicule { get; set; }
}

/// <summary>
/// Entité représentant un devis commercial
/// </summary>
public class Devis
{
    public long IdDevis { get; set; }
    public string NumeroDevis { get; set; } = string.Empty;
    public long ClientId { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    public DateTime? DateValidite { get; set; }
    public double MontantHT { get; set; }
    public double MontantTVA { get; set; }
    public double MontantTTC { get; set; }
    public StatutDevis Statut { get; set; } = StatutDevis.BROUILLON;
    public string? Description { get; set; }
    public string? Conditions { get; set; }

    // Navigation properties
    public Client Client { get; set; } = null!;
}

/// <summary>
/// Entité représentant une notification client
/// </summary>
public class NotificationClient
{
    public long IdNotification { get; set; }
    public long ClientId { get; set; }
    public string Message { get; set; } = string.Empty;
    public TypeNotification Type { get; set; }
    public DateTime DateEnvoi { get; set; } = DateTime.UtcNow;
    public bool Lue { get; set; } = false;
    public DateTime? DateLecture { get; set; }

    // Navigation properties
    public Client Client { get; set; } = null!;
}
