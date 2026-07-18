using Maintenance.Infrastructure.Data;
using Maintenance.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Maintenance.Infrastructure.Repositories;

public class InterventionRepository(MaintenanceDbContext context)
    : GenericRepository<Intervention>(context), IInterventionRepository
{
    public async Task<Intervention?> GetWithDetailsAsync(long id)
        => await _dbSet
            .Include(i => i.InterventionPieces).ThenInclude(ip => ip.Piece)
            .FirstOrDefaultAsync(i => i.IdIntervention == id);

    public async Task<IEnumerable<Intervention>> GetByVehiculeAsync(long vehiculeId)
        => await _dbSet
            .Include(i => i.InterventionPieces).ThenInclude(ip => ip.Piece)
            .Where(i => i.VehiculeId == vehiculeId)
            .OrderByDescending(i => i.DateIntervention)
            .ToListAsync();

    public async Task<Intervention?> GetConflictForTechnicienAsync(long technicienId, DateTime date)
        => await _dbSet
            .Where(i => i.TechnicienId == technicienId
                && i.DateIntervention.Date == date.Date
                && (i.Statut == StatutIntervention.PLANIFIEE || i.Statut == StatutIntervention.EN_COURS))
            .FirstOrDefaultAsync();
}
