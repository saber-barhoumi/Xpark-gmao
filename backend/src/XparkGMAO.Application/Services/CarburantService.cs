using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.GestionFinance;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Application.Services;

public interface ICarburantService
{
    Task<List<CarburantResponseDto>> GetAllAsync(long? vehiculeId = null);
    Task<CarburantResponseDto> GetByIdAsync(long id);
    Task<CarburantResponseDto> CreateAsync(CreateCarburantDto dto);
    Task<bool> DeleteAsync(long id);
    Task<StatistiquesCarburantDto> GetStatsAsync(long? vehiculeId = null, DateTime? start = null, DateTime? end = null);
}

public class CarburantService : ICarburantService
{
    private readonly XparkDbContext _context;

    public CarburantService(XparkDbContext context)
    {
        _context = context;
    }

    public async Task<List<CarburantResponseDto>> GetAllAsync(long? vehiculeId = null)
    {
        var query = _context.Carburants
            .Include(c => c.Vehicule)
            .Include(c => c.Source)
            .AsQueryable();

        if (vehiculeId.HasValue)
            query = query.Where(c => c.VehiculeId == vehiculeId.Value);

        var list = await query.OrderByDescending(c => c.DateRemplissage).ToListAsync();
        return list.Select(c => MapToDto(c)).ToList();
    }

    public async Task<CarburantResponseDto> GetByIdAsync(long id)
    {
        var c = await _context.Carburants
            .Include(c => c.Vehicule)
            .Include(c => c.Source)
            .FirstOrDefaultAsync(x => x.IdCarburant == id)
            ?? throw new KeyNotFoundException("Entrée carburant non trouvée");

        return MapToDto(c);
    }

    public async Task<CarburantResponseDto> CreateAsync(CreateCarburantDto dto)
    {
        // Règle métier : véhicule actif et pas hors service
        var vehicule = await _context.Vehicules.FindAsync(dto.VehiculeId);
        if (vehicule == null)
            throw new KeyNotFoundException("Véhicule introuvable.");
        if (!vehicule.Actif)
            throw new InvalidOperationException("Impossible d'enregistrer un plein : ce véhicule est inactif.");
        if (vehicule.Statut == Core.Entities.GestionFlotte.StatutVehicule.HORS_SERVICE)
            throw new InvalidOperationException("Impossible d'enregistrer un plein : ce véhicule est hors service.");

        // Règle métier : le kilométrage ne peut pas diminuer
        var dernierPlein = await _context.Carburants
            .Where(c => c.VehiculeId == dto.VehiculeId)
            .OrderByDescending(c => c.DateRemplissage)
            .FirstOrDefaultAsync();

        if (dernierPlein != null && dto.Kilometrage < dernierPlein.Kilometrage)
            throw new InvalidOperationException(
                $"Le kilométrage ({dto.Kilometrage} km) ne peut pas être inférieur au dernier relevé ({dernierPlein.Kilometrage} km).");

        var c = new Carburant
        {
            DateRemplissage = DateTime.SpecifyKind(dto.DateRemplissage, DateTimeKind.Utc),
            Quantite = dto.Quantite,
            PrixUnitaire = dto.PrixUnitaire,
            MontantTotal = dto.MontantTotal ?? (dto.Quantite * dto.PrixUnitaire),
            Kilometrage = dto.Kilometrage,
            Station = dto.Station,
            NumeroBon = dto.NumeroBon,
            TypeCarburant = dto.TypeCarburant,
            VehiculeId = dto.VehiculeId,
            ChauffeurId = dto.ChauffeurId,
            SourceId = dto.SourceId,
            JustificatifUrl = dto.JustificatifUrl,
            DateCreation = DateTime.UtcNow
        };

        _context.Carburants.Add(c);
        await _context.SaveChangesAsync();
        return MapToDto(c);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var c = await _context.Carburants.FindAsync(id);
        if (c == null) return false;
        _context.Carburants.Remove(c);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<StatistiquesCarburantDto> GetStatsAsync(long? vehiculeId = null, DateTime? start = null, DateTime? end = null)
    {
        var query = _context.Carburants
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
            .Where(x => x.SourceId != null)
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

    private CarburantResponseDto MapToDto(Carburant c)
    {
        return new CarburantResponseDto
        {
            IdCarburant = c.IdCarburant,
            DateRemplissage = c.DateRemplissage,
            Quantite = c.Quantite,
            PrixUnitaire = c.PrixUnitaire,
            MontantTotal = c.MontantTotal,
            Kilometrage = c.Kilometrage,
            Station = c.Station,
            NumeroBon = c.NumeroBon,
            TypeCarburant = c.TypeCarburant,
            VehiculeId = c.VehiculeId,
            VehiculeImmatriculation = c.Vehicule?.Immatriculation,
            SourceId = c.SourceId,
            SourceNom = c.Source?.NomSource,
            SourceType = c.Source?.TypeSource.ToString(),
            JustificatifUrl = c.JustificatifUrl
        };
    }
}
