using AutoMapper;
using Fleet.API.Data;
using Fleet.API.DTOs;
using Fleet.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Fleet.API.Services;

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
}
