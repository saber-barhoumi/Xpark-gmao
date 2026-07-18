using Maintenance.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Maintenance.Infrastructure.Repositories;

public class GenericRepository<T>(MaintenanceDbContext context) : IGenericRepository<T> where T : class
{
    protected readonly MaintenanceDbContext _context = context;
    protected readonly DbSet<T> _dbSet = context.Set<T>();

    public virtual async Task<T?> GetByIdAsync(long id) => await _dbSet.FindAsync(id);
    public virtual async Task<IEnumerable<T>> GetAllAsync() => await _dbSet.ToListAsync();

    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public virtual async Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }

    public virtual async Task DeleteAsync(long id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null) { _dbSet.Remove(entity); await _context.SaveChangesAsync(); }
    }

    public virtual async Task<bool> ExistsAsync(long id) => await _dbSet.FindAsync(id) != null;
}
