using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.GestionAlertes;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Infrastructure.Repositories;

/// <summary>
/// Repository spécifique pour les alertes
/// </summary>
public class AlerteRepository : GenericRepository<Alerte>, IAlertRepository
{
    public AlerteRepository(XparkDbContext context) : base(context) { }

    public async Task<IEnumerable<Alerte>> GetAllSortedAsync()
    {
        return await _dbSet
            .Include(a => a.Equipement)
            .Include(a => a.Mission)
            .OrderByDescending(a => a.DateAlerte)
            .ToListAsync();
    }

    public async Task<IEnumerable<Alerte>> GetActivesAsync()
    {
        return await _dbSet
            .Include(a => a.Utilisateur)
            .Include(a => a.Equipement)
            .Include(a => a.Mission)
            .Where(a => a.Statut == StatutAlerte.ACTIVE)
            .OrderByDescending(a => a.Priorite)
            .ThenByDescending(a => a.DateAlerte)
            .ToListAsync();
    }

    public async Task<IEnumerable<Alerte>> GetByTypeAsync(TypeAlerte type)
    {
        return await _dbSet
            .Where(a => a.TypeAlerte == type)
            .OrderByDescending(a => a.DateAlerte)
            .ToListAsync();
    }

    public async Task<IEnumerable<Alerte>> GetByPrioriteAsync(Priorite priorite)
    {
        return await _dbSet
            .Where(a => a.Priorite == priorite && a.Statut == StatutAlerte.ACTIVE)
            .OrderByDescending(a => a.DateAlerte)
            .ToListAsync();
    }

    public async Task<IEnumerable<Alerte>> GetByVehiculeAsync(long vehiculeId)
    {
        return await _dbSet
            .Where(a => a.VehiculeId == vehiculeId)
            .OrderByDescending(a => a.DateAlerte)
            .ToListAsync();
    }

    public async Task<int> CountByStatutAsync(StatutAlerte statut)
    {
        return await _dbSet.CountAsync(a => a.Statut == statut);
    }
}
