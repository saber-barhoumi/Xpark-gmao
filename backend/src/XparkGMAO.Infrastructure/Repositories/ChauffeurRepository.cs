using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Infrastructure.Repositories;

/// <summary>
/// Repository spécifique pour les chauffeurs
/// </summary>
public class ChauffeurRepository : GenericRepository<Chauffeur>, IChauffeurRepository
{
    public ChauffeurRepository(XparkDbContext context) : base(context) { }

    public async Task<IEnumerable<Chauffeur>> GetDisponiblesAsync()
    {
        return await _dbSet
            .Where(c => c.Disponibilite == StatutChauffeur.DISPONIBLE && c.Actif)
            .OrderBy(c => c.Nom)
            .ToListAsync();
    }

    public async Task<Chauffeur?> GetByEmailAsync(string email)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.Email == email);
    }

    public async Task<IEnumerable<Chauffeur>> GetByStatutAsync(StatutChauffeur statut)
    {
        return await _dbSet
            .Where(c => c.Disponibilite == statut)
            .ToListAsync();
    }

    public async Task<Chauffeur?> GetWithMissionsAsync(long id)
    {
        return await _dbSet
            .Include(c => c.Missions)
            .FirstOrDefaultAsync(c => c.IdUtilisateur == id);
    }
}
