namespace XparkGMAO.Core.Interfaces.Repositories;

/// <summary>
/// Interface générique pour les repositories
/// </summary>
public interface IGenericRepository<T> where T : class
{
    Task<T?> GetByIdAsync(long id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(long id);
    Task<bool> ExistsAsync(long id);
    Task<int> CountAsync();
}
