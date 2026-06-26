using AutoMapper;
using Fleet.API.Data;
using Fleet.API.DTOs;
using Fleet.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Fleet.API.Services;

public class AssuranceService(FleetDbContext context, IMapper mapper) : IAssuranceService
{
    public async Task<IEnumerable<AssuranceDto>> GetByVehiculeAsync(long vehiculeId)
    {
        var list = await context.Assurances
            .Where(a => a.VehiculeId == vehiculeId && a.Actif)
            .OrderByDescending(a => a.DateFin)
            .ToListAsync();
        return mapper.Map<IEnumerable<AssuranceDto>>(list);
    }

    public async Task<AssuranceDto?> GetByIdAsync(long id)
    {
        var a = await context.Assurances.FindAsync(id);
        return a == null ? null : mapper.Map<AssuranceDto>(a);
    }

    public async Task<AssuranceDto> CreateAsync(CreateAssuranceDto dto)
    {
        if (await context.Assurances.AnyAsync(a => a.NumeroPolice == dto.NumeroPolice))
            throw new InvalidOperationException($"Une assurance avec le numéro de police '{dto.NumeroPolice}' existe déjà.");

        var assurance = new Assurance
        {
            Compagnie        = dto.Compagnie,
            NumeroPolice     = dto.NumeroPolice,
            DateDebut        = dto.DateDebut,
            DateFin          = dto.DateFin,
            Prime            = dto.Prime,
            TypeAssurance    = dto.TypeAssurance,
            ContactCompagnie = dto.ContactCompagnie,
            VehiculeId       = dto.VehiculeId,
            Actif            = true,
            DateCreation     = DateTime.UtcNow
        };

        context.Assurances.Add(assurance);
        await context.SaveChangesAsync();
        return mapper.Map<AssuranceDto>(assurance);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var a = await context.Assurances.FindAsync(id);
        if (a == null) return false;
        a.Actif = false;
        await context.SaveChangesAsync();
        return true;
    }
}
