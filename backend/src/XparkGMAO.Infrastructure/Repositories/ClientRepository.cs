using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Infrastructure.Repositories;

/// <summary>
/// Repository spécifique pour les clients
/// </summary>
public class ClientRepository : GenericRepository<Client>, IClientRepository
{
    public ClientRepository(XparkDbContext context) : base(context) { }

    public async Task<Client?> GetByEmailAsync(string email)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.Email == email);
    }

    public async Task<IEnumerable<Client>> GetEntreprisesAsync()
    {
        return await _dbSet
            .Where(c => c.EstEntreprise && c.Actif)
            .OrderBy(c => c.NomSociete)
            .ToListAsync();
    }

    public async Task<Client?> GetWithHistoriqueAsync(long id)
    {
        return await _dbSet
            .Include(c => c.Missions)
            .Include(c => c.Factures)
            .Include(c => c.Reservations)
            .Include(c => c.Devis)
            .FirstOrDefaultAsync(c => c.IdUtilisateur == id);
    }
}
