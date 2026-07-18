using Alerts.Infrastructure.Data;
using Alerts.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Alerts.Infrastructure.Repositories;

public class AlerteRepository(AlertsDbContext context) : GenericRepository<Alerte>(context), IAlertRepository
{
    public async Task<IEnumerable<Alerte>> GetAllSortedAsync() =>
        await context.Alertes
            .OrderBy(a => a.Priorite).ThenByDescending(a => a.DateCreation)
            .ToListAsync();

    public async Task<IEnumerable<Alerte>> GetNonLuesAsync() =>
        await context.Alertes
            .Where(a => a.Statut == StatutAlerte.ACTIVE)
            .OrderBy(a => a.Priorite).ThenByDescending(a => a.DateCreation)
            .ToListAsync();

    public async Task<IEnumerable<Alerte>> GetByTypeAsync(TypeAlerte type) =>
        await context.Alertes
            .Where(a => a.TypeAlerte == type)
            .OrderByDescending(a => a.DateCreation)
            .ToListAsync();

    public async Task<int> CountNonLuesAsync() =>
        await context.Alertes.CountAsync(a => a.Statut == StatutAlerte.ACTIVE);
}
