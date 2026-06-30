using XparkGMAO.Core.Entities.Security;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Entities.GestionMaintenance;
using XparkGMAO.Core.Entities.GestionOperations;
using XparkGMAO.Core.Entities.GestionFinance;

namespace XparkGMAO.Core.DTOs.Response;

/// <summary>
/// DTO de réponse pour l'authentification
/// </summary>
public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Statut { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public long IdUtilisateur { get; set; }
    public DateTime Expiration { get; set; }
    public bool RequiresEmailConfirmation { get; set; } = false;
    public bool RequiresAdminApproval { get; set; } = false;
    /// <summary>Indique une ré-inscription d'un compte précédemment rejeté</summary>
    public bool IsReRegistration { get; set; } = false;
    public string? Message { get; set; }
    public string? PhotoUrl { get; set; }
}

/// <summary>
/// DTO de réponse pour le profil utilisateur
/// </summary>
public class UserProfileDto
{
    public long IdUtilisateur { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool Actif { get; set; }
    public bool EmailConfirmed { get; set; }
    public bool HasPin { get; set; }
    public DateTime DateCreation { get; set; }
}

/// <summary>
/// DTO de réponse générique pour les opérations de succès
/// </summary>
public class SuccessResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// DTO de réponse pour un véhicule
/// </summary>
public class VehiculeResponseDto
{
    public long IdVehicule { get; set; }
    public string Marque { get; set; } = string.Empty;
    public string Modele { get; set; } = string.Empty;
    public string Immatriculation { get; set; } = string.Empty;
    public string TypeVehicule { get; set; } = string.Empty;
    public string TypeCarburant { get; set; } = string.Empty;
    public double Kilometrage { get; set; }
    public string Statut { get; set; } = string.Empty;
    public int AnneeConstruction { get; set; }
    public string? Couleur { get; set; }
    public int NombrePlaces { get; set; }
    public double ConsommationMoyenne { get; set; }
    public DateTime DateAcquisition { get; set; }
    public int PuissanceFiscale { get; set; }
    public DateTime? DateProchaineRevision { get; set; }
}

/// <summary>
/// DTO de réponse pour une mission
/// </summary>
public class MissionResponseDto
{
    public long IdMission { get; set; }
    public DateTime DateDepart { get; set; }
    public DateTime? DateRetour { get; set; }
    public string Destination { get; set; } = string.Empty;
    public string Statut { get; set; } = string.Empty;
    public double KilometrageDepart { get; set; }
    public double KilometrageRetour { get; set; }
    public string ObjetMission { get; set; } = string.Empty;
    public double CoutTotal { get; set; }
    public double Distance => KilometrageRetour > 0 ? KilometrageRetour - KilometrageDepart : 0;
    public string? VehiculeImmatriculation { get; set; }
    public string? ChauffeurNom { get; set; }

    // Logistics Checklist
    public bool BonCarburantAccorde { get; set; }
    public string? NumeroBonCarburant { get; set; }
    public bool VerificationDocuments { get; set; }
    public bool CarteAutorouteRemise { get; set; }

    // AI estimation
    public string? VilleDepart { get; set; }
    public string? VilleArrivee { get; set; }
    public double DistanceEstimee { get; set; }
    public double CoutEstime { get; set; }
}

/// <summary>
/// DTO de réponse pour une intervention
/// </summary>
public class InterventionResponseDto
{
    public long IdIntervention { get; set; }
    public DateTime DateIntervention { get; set; }
    public string TypeIntervention { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Cout { get; set; }
    public string Statut { get; set; } = string.Empty;
    public string? VehiculeImmatriculation { get; set; }
    public string? TechnicienNom { get; set; }
}

/// <summary>
/// DTO de réponse pour une facture
/// </summary>
public class FactureResponseDto
{
    public long IdFacture { get; set; }
    public string NumeroFacture { get; set; } = string.Empty;
    public DateTime DateEmission { get; set; }
    public double MontantHT { get; set; }
    public double MontantTVA { get; set; }
    public double MontantTTC { get; set; }
    public string Statut { get; set; } = string.Empty;
    public string? ClientNom { get; set; }
}

/// <summary>
/// DTO de réponse paginée générique
/// </summary>
public class PaginatedResponseDto<T>
{
    public IEnumerable<T> Data { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}

/// <summary>
/// DTO de réponse pour un chauffeur
/// </summary>
public class ChauffeurResponseDto
{
    public long IdUtilisateur { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string NumeroPermis { get; set; } = string.Empty;
    public string CategoriePermis { get; set; } = string.Empty;
    public DateTime DateExpirationPermis { get; set; }
    public string Disponibilite { get; set; } = string.Empty;
    public double Evaluation { get; set; }
}

/// <summary>
/// DTO de réponse pour un client
/// </summary>
public class ClientResponseDto
{
    public long IdUtilisateur { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string? NomSociete { get; set; }
    public string? Ville { get; set; }
    public bool EstEntreprise { get; set; }
}

/// <summary>
/// DTO de réponse pour le dashboard
/// </summary>
public class DashboardResponseDto
{
    public int TotalVehicules { get; set; }
    public int VehiculesActifs { get; set; }
    public int VehiculesEnMaintenance { get; set; }
    public int TotalMissions { get; set; }
    public int MissionsEnCours { get; set; }
    public int TotalChauffeurs { get; set; }
    public int ChauffeursDisponibles { get; set; }
    public double ChiffreAffaireMois { get; set; }
    public int AlertesActives { get; set; }
    public int StockFaible { get; set; }
}

/// <summary>
/// DTO de réponse pour une alerte
/// </summary>
public class AlerteResponseDto
{
    public long IdAlerte { get; set; }
    public string TypeAlerte { get; set; } = string.Empty;
    public DateTime DateAlerte { get; set; }
    public DateTime? DateEcheance { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Priorite { get; set; } = string.Empty;
    public string Statut { get; set; } = string.Empty;
    public long? VehiculeId { get; set; }
    public long? EquipementId { get; set; }
    public string? NomEquipement { get; set; }
    public long? MissionId { get; set; }
    public string? ReferenceMission { get; set; }
    public string? EntiteReference { get; set; }
}

/// <summary>
/// DTO de réponse pour un trajet calculé par IA
/// </summary>
public class TrajetCalculeResponseDto
{
    public string Origine { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public double Distance { get; set; }
    public double PrixEstime { get; set; }
    public double CoutCarburant { get; set; }
    public double ConfianceIA { get; set; }
    public DateTime DateCalcul { get; set; }
}

/// <summary>
/// DTO de réponse pour une réservation
/// </summary>
public class ReservationResponseDto
{
    public long IdReservation { get; set; }
    public long ClientId { get; set; }
    public string? ClientNom { get; set; }
    public long? VehiculeId { get; set; }
    public string? VehiculeImmatriculation { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
    public bool ChauffeurRequis { get; set; }
    public string Statut { get; set; } = string.Empty;
    public double? PrixTotal { get; set; }
    public string? Destination { get; set; }
    public string? Observations { get; set; }
    public DateTime DateCreation { get; set; }
}

