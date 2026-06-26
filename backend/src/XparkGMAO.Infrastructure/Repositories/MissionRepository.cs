using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.GestionOperations;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Infrastructure.Repositories;

/// <summary>
/// Repository spécifique pour les missions
/// </summary>
public class MissionRepository : GenericRepository<Mission>, IMissionRepository
{
    public MissionRepository(XparkDbContext context) : base(context) { }

    public Task<IEnumerable<Mission>> GetByClientAsync(long clientId)
    {
        // Client association removed from Mission entity as per new requirement
        return Task.FromResult(Enumerable.Empty<Mission>());
    }

    public async Task<IEnumerable<Mission>> GetByVehiculeAsync(long vehiculeId)
    {
        var result = await _dbSet
            .Include(m => m.Employee)
            .Where(m => m.VehiculeId == vehiculeId)
            .OrderByDescending(m => m.DateDepart)
            .ToListAsync();
        return result;
    }

    public async Task<IEnumerable<Mission>> GetByDateRangeAsync(DateTime debut, DateTime fin)
    {
        var result = await _dbSet
            .Include(m => m.Vehicule)
            .Include(m => m.Employee)
            .Where(m => m.DateDepart >= debut && m.DateDepart <= fin)
            .OrderByDescending(m => m.DateDepart)
            .ToListAsync();
        return result;
    }

    public async Task<IEnumerable<Mission>> GetByStatutAsync(StatutMission statut)
    {
        var result = await _dbSet
            .Include(m => m.Vehicule)
            .Include(m => m.Employee)
            .Where(m => m.Statut == statut)
            .ToListAsync();
        return result;
    }

    public async Task<Mission?> GetWithDetailsAsync(long id)
    {
        return await _dbSet
            .Include(m => m.Vehicule)
            .Include(m => m.Employee)
            .FirstOrDefaultAsync(m => m.IdMission == id);
    }

    public async Task<IEnumerable<Mission>> GetPaginatedAsync(int page, int pageSize)
    {
        var result = await _dbSet
            .Include(m => m.Vehicule)
            .Include(m => m.Employee)
            .OrderByDescending(m => m.DateDepart)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return result;
    }

    public Task<string> GenerateReferenceAsync()
    {
        return Task.FromResult($"MSN-{DateTime.UtcNow:yyyyMMddHHmmss}");
    }
}
