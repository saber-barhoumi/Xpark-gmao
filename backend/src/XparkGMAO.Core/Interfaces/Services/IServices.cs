using XparkGMAO.Core.DTOs;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Entities.GestionMaintenance;
using XparkGMAO.Core.Entities.GestionOperations;
using XparkGMAO.Core.Entities.GestionFinance;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionAlertes;
using XparkGMAO.Core.Entities.FrontOffice;
using XparkGMAO.Core.Entities.IntelligenceArtificielle;
using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Interfaces.Services;

/// <summary>
/// Interface du service d'authentification
/// </summary>
public interface IAuthService
{
    // Authentification de base
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<AuthResultDto> RegisterAsync(RegisterDto request);
    Task<bool> LogoutAsync(long userId);

    // Réinitialisation de mot de passe
    Task<bool> RequestPasswordResetAsync(string email);
    Task<bool> ResetPasswordAsync(ResetPasswordDto dto);

    // Création de mot de passe (première connexion)
    Task<bool> CreatePasswordAsync(CreatePasswordDto dto);

    // Confirmation email
    Task<bool> ConfirmEmailAsync(string email, string token);
    Task<bool> ResendConfirmationEmailAsync(string email);

    // Connexion PIN
    Task<AuthResponseDto> LoginWithPinAsync(LoginPinDto request);
    Task<bool> SetPinAsync(long userId, string pin);

    // Verrouillage de session
    Task<bool> LockSessionAsync(long userId);
    Task<AuthResponseDto> UnlockSessionAsync(UnlockSessionDto request);

    // Gestion du compte
    Task<bool> ChangePasswordAsync(long userId, ChangePasswordDto dto);
    Task<UserProfileDto> GetUserProfileAsync(long userId);
    Task<bool> UpdateUserProfileAsync(long userId, UpdateProfileDto dto);

    // Tokens
    Task<string> GenerateEmailConfirmationTokenAsync(long userId);
    Task<string> GeneratePasswordResetTokenAsync(string email);
    Task<bool> ValidateTokenAsync(string token);
    
    // Diagnostic
    Task<Utilisateur?> GetUserByEmailAsync(string email);
    Task<IEnumerable<object>> GetAllUsersForDiagnosticAsync();
    Task<bool> SetPasswordForUserAsync(string email, string newPassword);
}

/// <summary>
/// Interface du service de gestion des véhicules
/// </summary>
public interface IVehiculeService
{
    Task<PaginatedResponseDto<VehiculeResponseDto>> GetAllAsync(int page = 1, int pageSize = 10);
    Task<VehiculeResponseDto?> GetByIdAsync(long id);
    Task<VehiculeResponseDto?> GetByImmatriculationAsync(string immatriculation);
    Task<IEnumerable<VehiculeResponseDto>> GetDisponiblesAsync();
    Task<VehiculeResponseDto> CreateAsync(CreateVehiculeDto dto);
    Task<VehiculeResponseDto?> UpdateAsync(long id, UpdateVehiculeDto dto);
    Task<bool> DeleteAsync(long id);
    Task<bool> UpdateStatutAsync(long id, StatutVehicule statut);
    Task<VehiculeLatestInfoDto?> GetLatestInfoAsync(long id);
}

/// <summary>
/// Interface du service de gestion des missions
/// </summary>
public interface IMissionService
{
    Task<IEnumerable<MissionResponseDto>> GetAllAsync();
    Task<MissionResponseDto?> GetByIdAsync(long id);
    Task<IEnumerable<MissionResponseDto>> GetByStatutAsync(StatutMission statut);
    Task<MissionResponseDto> CreateMissionAsync(CreateMissionDto dto);
    Task<MissionResponseDto> CloseMissionAsync(long missionId, double kilometrageRetour);
    Task<bool> CancelMissionAsync(long id);
    Task<bool> DeleteAsync(long id);
}

/// <summary>
/// Interface du service de maintenance
/// </summary>
public interface IMaintenanceService
{
    Task<PaginatedResponseDto<InterventionResponseDto>> GetAllAsync(int page = 1, int pageSize = 10);
    Task<InterventionResponseDto?> GetByIdAsync(long id);
    Task<IEnumerable<InterventionResponseDto>> GetByVehiculeAsync(long vehiculeId);
    Task<InterventionResponseDto> CreateAsync(CreateInterventionDto dto);
    Task<bool> UpdateStatutAsync(long id, StatutIntervention statut);
    Task<bool> DeleteAsync(long id);
    Task<IEnumerable<PieceRechange>> GetStockFaibleAsync();
    Task<bool> AjouterStockAsync(long pieceId, int quantite);
}

/// <summary>
/// Interface du service de facturation
/// </summary>
public interface IFacturationService
{
    Task<PaginatedResponseDto<FactureResponseDto>> GetAllAsync(int page = 1, int pageSize = 10);
    Task<FactureResponseDto?> GetByIdAsync(long id);
    Task<IEnumerable<FactureResponseDto>> GetByClientAsync(long clientId);
    Task<IEnumerable<FactureResponseDto>> GetImpayeesAsync();
    Task<FactureResponseDto> CreateAsync(CreateFactureDto dto);
    Task<bool> MarquerPayeeAsync(long id, string modePaiement);
    Task<bool> AnnulerAsync(long id);
}

/// <summary>
/// Interface du service client
/// </summary>
public interface IClientService
{
    Task<PaginatedResponseDto<ClientResponseDto>> GetAllAsync(int page = 1, int pageSize = 10);
    Task<ClientResponseDto?> GetByIdAsync(long id);
    Task<ClientResponseDto> CreateAsync(CreateClientDto dto);
    Task<ClientResponseDto?> UpdateAsync(long id, CreateClientDto dto);
    Task<bool> DeleteAsync(long id);
}

/// <summary>
/// Interface du service d'alertes
/// </summary>
public interface IAlertService
{
    Task<IEnumerable<AlerteResponseDto>> GetAllAsync();
    Task<IEnumerable<AlerteResponseDto>> GetActivesAsync();
    Task<IEnumerable<AlerteResponseDto>> GetByTypeAsync(TypeAlerte type);
    Task<int> CountUnreadAsync();
    Task<bool> MarquerLueAsync(long id);
    Task MarquerToutesLuesAsync();
    Task<bool> MarquerTraiteeAsync(long id);
    Task GenerateAlertesAutomatiquesAsync();
    Task CreateAlertAsync(long? vehiculeId, TypeAlerte type, string message);
}

/// <summary>
/// Service de vérification quotidienne des alertes (Documents, Assurances, Stock, etc.)
/// </summary>
public interface IDailyAlertCheckerService
{
    Task RunAllChecksAsync();
    Task CheckVehicleDocumentsAsync();
    Task CheckStockPiecesAsync();
    Task CheckOverdueOTsAsync();
    Task CheckUpcomingInterventionsAsync();
    Task CheckEmployeeDocumentsAsync();
    Task CheckEquipmentAlertsAsync();
    Task CheckMissionAlertsAsync();
}

/// <summary>
/// Interface du service de calcul de prix IA
/// </summary>
public interface IPrixCalculatorService
{
    Task<TrajetCalculeResponseDto> CalculerPrixAsync(CalculerPrixTrajetDto dto);
}

/// <summary>
/// Interface du service de prédiction de pannes
/// </summary>
public interface IPredictionService
{
    Task<PredictionPanne> PredirePanneAsync(long vehiculeId);
    Task<IEnumerable<PredictionPanne>> GetPredictionsVehiculeAsync(long vehiculeId);
}
