using XparkGMAO.Core.Entities.Security;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Entities.GestionAdministrative;
namespace XparkGMAO.Core.DTOs.Request;

/// <summary>
/// DTO pour la connexion
/// </summary>
public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour l'inscription
/// </summary>
public class RegisterRequestDto
{
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public Role Role { get; set; } = Role.CLIENT;
}

/// <summary>
/// DTO pour la réinitialisation du mot de passe
/// </summary>
public class ResetPasswordDto
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour la création de mot de passe (première connexion)
/// </summary>
public class CreatePasswordDto
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour la connexion avec PIN
/// </summary>
public class LoginPinDto
{
    public string Email { get; set; } = string.Empty;
    public string Pin { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour déverrouiller la session
/// </summary>
public class UnlockSessionDto
{
    public long UserId { get; set; }
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour changer le mot de passe
/// </summary>
public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour la mise à jour du profil
/// </summary>
public class UpdateProfileDto
{
    public string? Nom { get; set; }
    public string? Prenom { get; set; }
    public string? Telephone { get; set; }
}

/// <summary>
/// DTO pour demander la réinitialisation du mot de passe
/// </summary>
public class RequestPasswordResetDto
{
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour définir un code PIN
/// </summary>
public class SetPinDto
{
    public string Pin { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour valider un token
/// </summary>
public class ValidateTokenDto
{
    public string Token { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour créer un véhicule
/// </summary>
public class CreateVehiculeDto
{
    public string Marque { get; set; } = string.Empty;
    public string Modele { get; set; } = string.Empty;
    public string NumeroChassis { get; set; } = string.Empty;
    public string Immatriculation { get; set; } = string.Empty;
    public int AnneeConstruction { get; set; }
    public TypeCarburant TypeCarburant { get; set; }
    public TypeVehicule TypeVehicule { get; set; }
    public double Kilometrage { get; set; }
    public string? Couleur { get; set; }
    public int NombrePlaces { get; set; }
    public double ConsommationMoyenne { get; set; }
    public DateTime DateAcquisition { get; set; }
    public double ValeurAcquisition { get; set; }
    public int PuissanceFiscale { get; set; }
    public DateTime? DateProchaineRevision { get; set; }

    public List<AssuranceDto> Assurances { get; set; } = new();
    public List<DocumentAdministratifDto> DocumentsAdministratifs { get; set; } = new();
}

/// <summary>
/// DTO pour mettre à jour un véhicule
/// </summary>
public class UpdateVehiculeDto
{
    public string? Marque { get; set; }
    public string? Modele { get; set; }
    public double? Kilometrage { get; set; }
    public StatutVehicule? Statut { get; set; }
    public string? Couleur { get; set; }
    public double? ConsommationMoyenne { get; set; }
    public int? PuissanceFiscale { get; set; }
    public DateTime? DateProchaineRevision { get; set; }

    public List<AssuranceDto> Assurances { get; set; } = new();
    public List<DocumentAdministratifDto> DocumentsAdministratifs { get; set; } = new();
}

/// <summary>
/// DTO pour créer une mission
/// </summary>
public class CreateMissionDto
{
    public DateTime DateDepart { get; set; }
    public DateTime? DateRetour { get; set; }
    public string Destination { get; set; } = string.Empty;
    public double KilometrageDepart { get; set; }
    public string ObjetMission { get; set; } = string.Empty;
    public long VehiculeId { get; set; }
    public long EmployeeId { get; set; }

    // Logistics Checklist
    public bool BonCarburantAccorde { get; set; }
    public string? NumeroBonCarburant { get; set; }
    public bool VerificationDocuments { get; set; }
    public bool CarteAutorouteRemise { get; set; }
}

public class CloseMissionDto
{
    public double KilometrageRetour { get; set; }
}

/// <summary>
/// DTO pour mettre à jour une mission
/// </summary>
public class UpdateMissionDto
{
    public DateTime? DateRetourEffectif { get; set; }
    public double? KilometrageRetour { get; set; }
    public string? Observations { get; set; }
}

/// <summary>
/// DTO pour créer une intervention
/// </summary>
public class CreateInterventionDto
{
    public DateTime DateIntervention { get; set; }
    public string TypeIntervention { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Cout { get; set; }
    public double KilometrageIntervention { get; set; }
    public long VehiculeId { get; set; }
    public long? TechnicienId { get; set; }
    public string? Prestataire { get; set; }
    public long? OrdreTravailId { get; set; }
    public int? DureeMinutes { get; set; }
    public string? TypePeriodicite { get; set; }
}

/// <summary>
/// DTO pour créer une réservation
/// </summary>
public class CreateReservationDto
{
    public long ClientId { get; set; }
    public long? VehiculeId { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
    public bool ChauffeurRequis { get; set; }
    public string? Destination { get; set; }
    public string? Observations { get; set; }
}

/// <summary>
/// DTO pour créer un devis
/// </summary>
public class CreateDevisDto
{
    public long ClientId { get; set; }
    public double MontantHT { get; set; }
    public double TauxTVA { get; set; } = 19.0;
    public string? Description { get; set; }
    public DateTime? DateValidite { get; set; }
}

/// <summary>
/// DTO pour calculer le prix d'un trajet
/// </summary>
public class CalculerPrixTrajetDto
{
    public string Origine { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public double Distance { get; set; }
    public string TypeVehicule { get; set; } = "BERLINE";
}

/// <summary>
/// DTO pour créer un client
/// </summary>
public class CreateClientDto
{
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string? NomSociete { get; set; }
    public string? SecteurActivite { get; set; }
    public string? Adresse { get; set; }
    public string? Ville { get; set; }
    public bool EstEntreprise { get; set; }
}

/// <summary>
/// DTO pour créer une pièce de rechange
/// </summary>
public class CreatePieceRechangeDto
{
    public string Reference { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Categorie { get; set; } = string.Empty;
    public int StockActuel { get; set; }
    public int StockMinimum { get; set; }
    public int StockMaximum { get; set; }
    public double PrixUnitaire { get; set; }
    public string? Fournisseur { get; set; }
    public string? ImageUrl { get; set; }
}

/// <summary>
/// DTO pour créer une facture
/// </summary>
public class CreateFactureDto
{
    public long? ClientId { get; set; }
    public long? MissionId { get; set; }
    public double MontantHT { get; set; }
    public double TauxTVA { get; set; } = 19.0;
    public DateTime? DateEcheance { get; set; }
    public string? Notes { get; set; }
}


/// <summary>
/// DTO pour la gestion des employés (RH)
/// </summary>
public class EmployeeDto
{
    public string Name { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string NumeroMatricule { get; set; } = string.Empty;
    public string Post { get; set; } = string.Empty; // Enum as string
    public string Service { get; set; } = string.Empty; // Enum as string
    public string Statut { get; set; } = "DISPONIBLE"; // Enum as string
    public string Telephone { get; set; } = string.Empty;
    public DateTime DateEmbauche { get; set; }

    // Specialized fields (optional)
    public string? NumeroPermis { get; set; }
    public string? CategoriePermis { get; set; }
    public DateTime? DateExpirationPermis { get; set; }
    public string? Specialty { get; set; }
    public string? Level { get; set; }
}

/// <summary>
/// DTO pour une assurance
/// </summary>
public class AssuranceDto
{
    public long? IdAssurance { get; set; }
    public string Compagnie { get; set; } = string.Empty;
    public string NumeroPolice { get; set; } = string.Empty;
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }
    public double Prime { get; set; }
    public string TypeAssurance { get; set; } = string.Empty;
    public string? ContactCompagnie { get; set; }
    public string? Observations { get; set; }
    public bool Actif { get; set; } = true;
}

/// <summary>
/// DTO pour un document administratif
/// </summary>
public class DocumentAdministratifDto
{
    public long? IdDocument { get; set; }
    public TypeDocument TypeDocument { get; set; }
    public string NumeroDocument { get; set; } = string.Empty;
    public DateTime DateEmission { get; set; }
    public DateTime DateExpiration { get; set; }
    public string? Autorite { get; set; }
    public string? FichierPath { get; set; }
    public string? Observations { get; set; }
}
