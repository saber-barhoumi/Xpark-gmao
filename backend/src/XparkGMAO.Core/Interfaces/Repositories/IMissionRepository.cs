using XparkGMAO.Core.Entities.GestionOperations;

namespace XparkGMAO.Core.Interfaces.Repositories;

/// <summary>
/// Interface repository pour les missions
/// </summary>
public interface IMissionRepository : IGenericRepository<Mission>
{
    Task<IEnumerable<Mission>> GetByClientAsync(long clientId);
    Task<IEnumerable<Mission>> GetByVehiculeAsync(long vehiculeId);
    Task<IEnumerable<Mission>> GetByDateRangeAsync(DateTime debut, DateTime fin);
    Task<IEnumerable<Mission>> GetByStatutAsync(StatutMission statut);
    Task<Mission?> GetWithDetailsAsync(long id);
    Task<IEnumerable<Mission>> GetPaginatedAsync(int page, int pageSize);
    Task<string> GenerateReferenceAsync();
}
