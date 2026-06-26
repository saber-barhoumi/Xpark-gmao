using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.GestionFinance;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Infrastructure.Repositories;

/// <summary>
/// Repository spécifique pour les factures
/// </summary>
public class FactureRepository : GenericRepository<Facture>, IFactureRepository
{
    public FactureRepository(XparkDbContext context) : base(context) { }

    public async Task<IEnumerable<Facture>> GetByClientAsync(long clientId)
    {
        return await _dbSet
            .Include(f => f.Client)
            .Where(f => f.ClientId == clientId)
            .OrderByDescending(f => f.DateEmission)
            .ToListAsync();
    }

    public async Task<IEnumerable<Facture>> GetImpayeesAsync()
    {
        return await _dbSet
            .Include(f => f.Client)
            .Where(f => f.Statut == StatutFacture.EMISE || f.Statut == StatutFacture.EN_RETARD)
            .OrderBy(f => f.DateEcheance)
            .ToListAsync();
    }

    public async Task<IEnumerable<Facture>> GetByStatutAsync(StatutFacture statut)
    {
        return await _dbSet
            .Include(f => f.Client)
            .Where(f => f.Statut == statut)
            .OrderByDescending(f => f.DateEmission)
            .ToListAsync();
    }

    public async Task<string> GenerateNumeroFactureAsync()
    {
        var count = await _dbSet.CountAsync();
        return $"FAC-{DateTime.UtcNow:yyyyMM}-{(count + 1):D4}";
    }
}
