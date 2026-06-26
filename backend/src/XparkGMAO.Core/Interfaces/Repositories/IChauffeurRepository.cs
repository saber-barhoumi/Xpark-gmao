using XparkGMAO.Core.Entities.GestionFlotte;

namespace XparkGMAO.Core.Interfaces.Repositories;

/// <summary>
/// Interface repository pour les chauffeurs
/// </summary>
public interface IChauffeurRepository : IGenericRepository<Chauffeur>
{
    Task<IEnumerable<Chauffeur>> GetDisponiblesAsync();
    Task<Chauffeur?> GetByEmailAsync(string email);
    Task<IEnumerable<Chauffeur>> GetByStatutAsync(StatutChauffeur statut);
    Task<Chauffeur?> GetWithMissionsAsync(long id);
}
