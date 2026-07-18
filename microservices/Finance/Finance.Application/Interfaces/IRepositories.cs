using Finance.Domain.Entities;
using System.Linq.Expressions;

namespace Finance.Application.Interfaces;

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

public interface IFactureRepository : IGenericRepository<Facture>
{
    Task<IEnumerable<Facture>> GetByClientAsync(long clientId);
    Task<IEnumerable<Facture>> GetImpayeesAsync();
    Task<string> GenerateNumeroFactureAsync();
    Task<(IEnumerable<Facture> Items, int Total)> GetPaginatedAsync(int page, int pageSize, string? statut = null);
}
