using Finance.API.Data;
using Finance.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Finance.API.Repositories;

public class FactureRepository(FinanceDbContext context) : GenericRepository<Facture>(context), IFactureRepository
{
    public async Task<IEnumerable<Facture>> GetByClientAsync(long clientId) =>
        await context.Factures
            .Where(f => f.ClientId == clientId)
            .OrderByDescending(f => f.DateFacture)
            .ToListAsync();

    public async Task<IEnumerable<Facture>> GetImpayeesAsync() =>
        await context.Factures
            .Where(f => f.Statut == StatutFacture.EN_ATTENTE || f.Statut == StatutFacture.EN_RETARD)
            .OrderBy(f => f.DateEcheance)
            .ToListAsync();

    public async Task<string> GenerateNumeroFactureAsync()
    {
        var now   = DateTime.UtcNow;
        var count = await context.Factures.CountAsync(f =>
            f.DateFacture.Year == now.Year && f.DateFacture.Month == now.Month);
        return $"FAC-{now:yyyyMM}-{(count + 1):D4}";
    }

    public async Task<(IEnumerable<Facture> Items, int Total)> GetPaginatedAsync(int page, int pageSize, string? statut = null)
    {
        var query = context.Factures.AsQueryable();
        if (!string.IsNullOrEmpty(statut) && Enum.TryParse<StatutFacture>(statut, true, out var s))
            query = query.Where(f => f.Statut == s);
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(f => f.DateFacture)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();
        return (items, total);
    }
}
