using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Infrastructure.Repositories;

/// <summary>
/// Repository spécifique pour les véhicules
/// </summary>
public class VehiculeRepository : GenericRepository<Vehicule>, IVehiculeRepository
{
    public VehiculeRepository(XparkDbContext context) : base(context) { }

    public override async Task<IEnumerable<Vehicule>> GetAllAsync()
    {
        return await _dbSet
            .Where(v => v.Actif)
            .ToListAsync();
    }

    public override async Task DeleteAsync(long id)
    {
        var vehicule = await GetByIdAsync(id);
        if (vehicule != null)
        {
            vehicule.Actif = false;
            vehicule.Statut = StatutVehicule.HORS_SERVICE; // Marquer comme hors service ou inactif
            _dbSet.Update(vehicule);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<Vehicule?> GetByImmatriculationAsync(string immatriculation)
    {
        return await _dbSet
            .Include(v => v.Interventions)
            .Include(v => v.Missions)
            .Include(v => v.Assurances)
            .FirstOrDefaultAsync(v => v.Immatriculation == immatriculation && v.Actif);
    }

    public async Task<IEnumerable<Vehicule>> GetDisponiblesAsync()
    {
        return await _dbSet
            .Where(v => v.Statut == StatutVehicule.DISPONIBLE && v.Actif)
            .ToListAsync();
    }

    public async Task<IEnumerable<Vehicule>> GetByStatutAsync(StatutVehicule statut)
    {
        return await _dbSet
            .Where(v => v.Statut == statut && v.Actif)
            .ToListAsync();
    }

    public async Task<Vehicule?> GetWithDetailsAsync(long id)
    {
        return await _dbSet
            .Include(v => v.Interventions)
            .Include(v => v.Missions)
            .Include(v => v.Assurances)
            .Include(v => v.Carburants)
            .FirstOrDefaultAsync(v => v.IdVehicule == id && v.Actif);
    }

    public async Task<IEnumerable<Vehicule>> GetPaginatedAsync(int page, int pageSize)
    {
        return await _dbSet
            .Where(v => v.Actif)
            .OrderBy(v => v.Marque)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<IEnumerable<Vehicule>> GetByTypeAsync(TypeVehicule type)
    {
        return await _dbSet
            .Where(v => v.TypeVehicule == type && v.Actif)
            .ToListAsync();
    }
}
