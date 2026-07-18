using AutoMapper;
using Fleet.Infrastructure.Data;
using Fleet.Application.DTOs;
using Fleet.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Infrastructure.Services;

public class CarburantService(FleetDbContext context, IMapper mapper) : ICarburantService
{
    public async Task<IEnumerable<CarburantDto>> GetByVehiculeAsync(long? vehiculeId = null)
    {
        var query = context.Carburants.AsQueryable();
        if (vehiculeId.HasValue) query = query.Where(c => c.VehiculeId == vehiculeId.Value);
        var list = await query.OrderByDescending(c => c.DateRemplissage).ToListAsync();
        return mapper.Map<IEnumerable<CarburantDto>>(list);
    }

    public async Task<CarburantDto?> GetByIdAsync(long id)
    {
        var c = await context.Carburants.FindAsync(id);
        return c == null ? null : mapper.Map<CarburantDto>(c);
    }

    public async Task<CarburantDto> CreateAsync(CreateCarburantDto dto)
    {
        var carburant = new Carburant
        {
            DateRemplissage = dto.DateRemplissage,
            Quantite        = dto.Quantite,
            PrixUnitaire    = dto.PrixUnitaire,
            MontantTotal    = dto.Quantite * dto.PrixUnitaire,
            Kilometrage     = dto.Kilometrage,
            Station         = dto.Station,
            NumeroBon       = dto.NumeroBon,
            TypeCarburant   = dto.TypeCarburant,
            VehiculeId      = dto.VehiculeId,
            ChauffeurId     = dto.ChauffeurId,
            SourceId        = dto.SourceId,
            DateCreation    = DateTime.UtcNow
        };

        context.Carburants.Add(carburant);
        await context.SaveChangesAsync();
        return mapper.Map<CarburantDto>(carburant);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var c = await context.Carburants.FindAsync(id);
        if (c == null) return false;
        context.Carburants.Remove(c);
        await context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Statistiques carburant — porté à l'identique du monolithe (le dashboard
    /// et la page Consommation Carburant consomment ce contrat).
    /// </summary>
    public async Task<StatistiquesCarburantDto> GetStatsAsync(long? vehiculeId = null, DateTime? start = null, DateTime? end = null)
    {
        var query = context.Carburants
            .Include(c => c.Source)
            .Include(c => c.Vehicule)
            .AsQueryable();

        if (vehiculeId.HasValue) query = query.Where(c => c.VehiculeId == vehiculeId.Value);
        if (start.HasValue) query = query.Where(c => c.DateRemplissage >= DateTime.SpecifyKind(start.Value, DateTimeKind.Utc));
        if (end.HasValue) query = query.Where(c => c.DateRemplissage <= DateTime.SpecifyKind(end.Value, DateTimeKind.Utc));

        var data = await query.ToListAsync();

        var stats = new StatistiquesCarburantDto
        {
            NombrePleins = data.Count,
            LitresTotaux = data.Sum(x => x.Quantite),
            CoutTotal = data.Sum(x => x.MontantTotal),
            KilometrageTotal = data.Count > 1 ? data.Max(x => x.Kilometrage) - data.Min(x => x.Kilometrage) : 0
        };

        if (stats.KilometrageTotal > 0)
            stats.ConsommationMoyenne = (stats.LitresTotaux / stats.KilometrageTotal) * 100;

        stats.RepartitionParSource = data
            .Where(x => x.SourceId != null && x.Source != null)
            .GroupBy(x => x.Source!)
            .Select(g => new CoutParSourceDto
            {
                NomSource = g.Key.NomSource,
                TypeSource = g.Key.TypeSource.ToString(),
                CoutTotal = g.Sum(x => x.MontantTotal),
                NombrePleins = g.Count(),
                PrixMoyen = g.Average(x => x.PrixUnitaire)
            })
            .OrderByDescending(x => x.CoutTotal)
            .ToList();

        stats.EvolutionMensuelle = data
            .GroupBy(x => x.DateRemplissage.ToString("yyyy-MM"))
            .Select(g => new EvolutionMensuelleDto
            {
                Mois = g.Key,
                CoutTotal = g.Sum(x => x.MontantTotal),
                LitresTotaux = g.Sum(x => x.Quantite)
            })
            .OrderBy(x => x.Mois)
            .ToList();

        stats.TopVehiculesParCout = data
            .GroupBy(x => x.Vehicule?.Immatriculation ?? "Inconnu")
            .Select(g => new CoutParVehiculeDto
            {
                VehiculeImmatriculation = g.Key,
                CoutTotal = g.Sum(x => x.MontantTotal),
                KilometrageTotal = g.Count() > 1 ? g.Max(x => x.Kilometrage) - g.Min(x => x.Kilometrage) : 0
            })
            .OrderByDescending(x => x.CoutTotal)
            .Take(5)
            .ToList();

        return stats;
    }
}
