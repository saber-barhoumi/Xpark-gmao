using Alerts.API.Entities;
using System.Linq.Expressions;

namespace Alerts.API.Repositories;

public interface IGenericRepository<T> where T : class
{
    Task<T?> GetByIdAsync(long id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task AddAsync(T entity);
    void Update(T entity);
    void Remove(T entity);
    Task<int> SaveChangesAsync();
}

public interface IAlertRepository : IGenericRepository<Alerte>
{
    Task<IEnumerable<Alerte>> GetAllSortedAsync();
    Task<IEnumerable<Alerte>> GetNonLuesAsync();
    Task<IEnumerable<Alerte>> GetByTypeAsync(TypeAlerte type);
    Task<int> CountNonLuesAsync();
}
