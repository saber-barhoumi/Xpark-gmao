using Mission.Domain.Entities;
using MissionEntity = Mission.Domain.Entities.Mission;

namespace Mission.Application.Interfaces;

public interface IGenericRepository<T> where T : class
{
    Task<T?> GetByIdAsync(long id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(long id);
    Task<bool> ExistsAsync(long id);
}

public interface IMissionRepository : IGenericRepository<MissionEntity>
{
    Task<MissionEntity?> GetWithDetailsAsync(long id);
    Task<IEnumerable<MissionEntity>> GetByStatutAsync(StatutMission statut);
}
