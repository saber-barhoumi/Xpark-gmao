using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.GestionMaintenance;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Infrastructure.Repositories;

/// <summary>
/// Repository spécifique pour les interventions de maintenance
/// </summary>
public class InterventionRepository : GenericRepository<Intervention>, IInterventionRepository
{
    public InterventionRepository(XparkDbContext context) : base(context) { }

    public async Task<IEnumerable<Intervention>> GetByVehiculeAsync(long vehiculeId)
    {
        return await _dbSet
            .Include(i => i.InterventionPieces)
                .ThenInclude(ip => ip.Piece)
            .Where(i => i.VehiculeId == vehiculeId)
            .OrderByDescending(i => i.DateIntervention)
            .ToListAsync();
    }

    public async Task<IEnumerable<Intervention>> GetByTypeAsync(TypeIntervention type)
    {
        return await _dbSet
            .Include(i => i.Vehicule)
            .Where(i => i.TypeIntervention == type)
            .OrderByDescending(i => i.DateIntervention)
            .ToListAsync();
    }

    public async Task<IEnumerable<Intervention>> GetByStatutAsync(StatutIntervention statut)
    {
        return await _dbSet
            .Include(i => i.Vehicule)
            .Where(i => i.Statut == statut)
            .OrderByDescending(i => i.DateIntervention)
            .ToListAsync();
    }

    public async Task<IEnumerable<Intervention>> GetByDateRangeAsync(DateTime debut, DateTime fin)
    {
        return await _dbSet
            .Include(i => i.Vehicule)
            .Where(i => i.DateIntervention >= debut && i.DateIntervention <= fin)
            .OrderByDescending(i => i.DateIntervention)
            .ToListAsync();
    }

    public async Task<Intervention?> GetWithDetailsAsync(long id)
    {
        return await _dbSet
            .Include(i => i.Vehicule)
            .Include(i => i.InterventionPieces)
                .ThenInclude(ip => ip.Piece)
            .FirstOrDefaultAsync(i => i.IdIntervention == id);
    }

    public async Task<IEnumerable<Intervention>> GetPlanifieesAsync()
    {
        return await _dbSet
            .Include(i => i.Vehicule)
            .Where(i => i.Statut == StatutIntervention.PLANIFIEE)
            .OrderBy(i => i.DateIntervention)
            .ToListAsync();
    }

    public async Task<Intervention?> GetConflictForTechnicienAsync(long technicienId, DateTime date)
    {
        return await _dbSet
            .Where(i => i.TechnicienId == technicienId
                && i.DateIntervention.Date == date.Date
                && (i.Statut == StatutIntervention.PLANIFIEE || i.Statut == StatutIntervention.EN_COURS))
            .FirstOrDefaultAsync();
    }
}
