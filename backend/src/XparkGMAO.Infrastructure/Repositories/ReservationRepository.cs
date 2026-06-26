using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.FrontOffice;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Infrastructure.Repositories;

/// <summary>
/// Repository spécifique pour les réservations
/// </summary>
public class ReservationRepository : GenericRepository<Reservation>, IReservationRepository
{
    public ReservationRepository(XparkDbContext context) : base(context) { }

    public async Task<IEnumerable<Reservation>> GetByClientAsync(long clientId)
    {
        return await _dbSet
            .Include(r => r.Vehicule)
            .Where(r => r.ClientId == clientId)
            .OrderByDescending(r => r.DateDebut)
            .ToListAsync();
    }

    public async Task<IEnumerable<Reservation>> GetByStatutAsync(StatutReservation statut)
    {
        return await _dbSet
            .Include(r => r.Client)
            .Include(r => r.Vehicule)
            .Where(r => r.Statut == statut)
            .OrderByDescending(r => r.DateDebut)
            .ToListAsync();
    }

    public async Task<IEnumerable<Reservation>> GetByDateRangeAsync(DateTime debut, DateTime fin)
    {
        return await _dbSet
            .Include(r => r.Client)
            .Include(r => r.Vehicule)
            .Where(r => r.DateDebut >= debut && r.DateDebut <= fin)
            .OrderBy(r => r.DateDebut)
            .ToListAsync();
    }
}

/// <summary>
/// Repository spécifique pour les devis
/// </summary>
public class DevisRepository : GenericRepository<Devis>, IDevisRepository
{
    public DevisRepository(XparkDbContext context) : base(context) { }

    public async Task<IEnumerable<Devis>> GetByClientAsync(long clientId)
    {
        return await _dbSet
            .Include(d => d.Client)
            .Where(d => d.ClientId == clientId)
            .OrderByDescending(d => d.DateCreation)
            .ToListAsync();
    }

    public async Task<IEnumerable<Devis>> GetByStatutAsync(StatutDevis statut)
    {
        return await _dbSet
            .Include(d => d.Client)
            .Where(d => d.Statut == statut)
            .OrderByDescending(d => d.DateCreation)
            .ToListAsync();
    }

    public async Task<string> GenerateNumeroDevisAsync()
    {
        var count = await _dbSet.CountAsync();
        return $"DEV-{DateTime.UtcNow:yyyyMM}-{(count + 1):D4}";
    }
}
