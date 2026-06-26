using XparkGMAO.Core.Entities.GestionMaintenance;
using XparkGMAO.Core.Entities.GestionFinance;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionAlertes;
using XparkGMAO.Core.Entities.FrontOffice;

namespace XparkGMAO.Core.Interfaces.Repositories;

/// <summary>
/// Interface repository pour les interventions
/// </summary>
public interface IInterventionRepository : IGenericRepository<Intervention>
{
    Task<IEnumerable<Intervention>> GetByVehiculeAsync(long vehiculeId);
    Task<IEnumerable<Intervention>> GetByTypeAsync(TypeIntervention type);
    Task<IEnumerable<Intervention>> GetByStatutAsync(StatutIntervention statut);
    Task<IEnumerable<Intervention>> GetByDateRangeAsync(DateTime debut, DateTime fin);
    Task<Intervention?> GetWithDetailsAsync(long id);
    /// <summary>Vérifie si un technicien a déjà une intervention active à la date donnée</summary>
    Task<Intervention?> GetConflictForTechnicienAsync(long technicienId, DateTime date);
}

/// <summary>
/// Interface repository pour les factures
/// </summary>
public interface IFactureRepository : IGenericRepository<Facture>
{
    Task<IEnumerable<Facture>> GetByClientAsync(long clientId);
    Task<IEnumerable<Facture>> GetImpayeesAsync();
    Task<IEnumerable<Facture>> GetByStatutAsync(StatutFacture statut);
    Task<string> GenerateNumeroFactureAsync();
}

/// <summary>
/// Interface repository pour les clients
/// </summary>
public interface IClientRepository : IGenericRepository<Client>
{
    Task<Client?> GetByEmailAsync(string email);
    Task<IEnumerable<Client>> GetEntreprisesAsync();
    Task<Client?> GetWithHistoriqueAsync(long id);
}

/// <summary>
/// Interface repository pour les alertes
/// </summary>
public interface IAlertRepository : IGenericRepository<Alerte>
{
    Task<IEnumerable<Alerte>> GetAllSortedAsync();
    Task<IEnumerable<Alerte>> GetActivesAsync();
    Task<IEnumerable<Alerte>> GetByTypeAsync(TypeAlerte type);
    Task<IEnumerable<Alerte>> GetByPrioriteAsync(Priorite priorite);
    Task<IEnumerable<Alerte>> GetByVehiculeAsync(long vehiculeId);
    Task<int> CountByStatutAsync(StatutAlerte statut);
}

/// <summary>
/// Interface repository pour les réservations
/// </summary>
public interface IReservationRepository : IGenericRepository<Reservation>
{
    Task<IEnumerable<Reservation>> GetByClientAsync(long clientId);
    Task<IEnumerable<Reservation>> GetByStatutAsync(StatutReservation statut);
    Task<IEnumerable<Reservation>> GetByDateRangeAsync(DateTime debut, DateTime fin);
}

/// <summary>
/// Interface repository pour les devis
/// </summary>
public interface IDevisRepository : IGenericRepository<Devis>
{
    Task<IEnumerable<Devis>> GetByClientAsync(long clientId);
    Task<IEnumerable<Devis>> GetByStatutAsync(StatutDevis statut);
    Task<string> GenerateNumeroDevisAsync();
}
