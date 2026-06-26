using Maintenance.API.Entities;

namespace Maintenance.API.Repositories;

public interface IGenericRepository<T> where T : class
{
    Task<T?> GetByIdAsync(long id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(long id);
    Task<bool> ExistsAsync(long id);
}

public interface IInterventionRepository : IGenericRepository<Intervention>
{
    Task<Intervention?> GetWithDetailsAsync(long id);
    Task<IEnumerable<Intervention>> GetByVehiculeAsync(long vehiculeId);
    Task<Intervention?> GetConflictForTechnicienAsync(long technicienId, DateTime date);
}
