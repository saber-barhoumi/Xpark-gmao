using AutoMapper;
using Fleet.API.Data;
using Fleet.API.DTOs;
using Fleet.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Fleet.API.Services;

public class DocumentService(FleetDbContext context, IMapper mapper) : IDocumentService
{
    public async Task<IEnumerable<DocumentDto>> GetByVehiculeAsync(long vehiculeId)
    {
        var list = await context.DocumentsAdministratifs
            .Where(d => d.VehiculeId == vehiculeId)
            .OrderByDescending(d => d.DateExpiration)
            .ToListAsync();
        return mapper.Map<IEnumerable<DocumentDto>>(list);
    }

    public async Task<DocumentDto?> GetByIdAsync(long id)
    {
        var d = await context.DocumentsAdministratifs.FindAsync(id);
        return d == null ? null : mapper.Map<DocumentDto>(d);
    }

    public async Task<DocumentDto> CreateAsync(CreateDocumentDto dto)
    {
        var document = new DocumentAdministratif
        {
            TypeDocument   = dto.TypeDocument,
            NumeroDocument = dto.NumeroDocument,
            DateEmission   = dto.DateEmission,
            DateExpiration = dto.DateExpiration,
            Autorite       = dto.Autorite,
            VehiculeId     = dto.VehiculeId,
            DateCreation   = DateTime.UtcNow
        };

        context.DocumentsAdministratifs.Add(document);
        await context.SaveChangesAsync();
        return mapper.Map<DocumentDto>(document);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var d = await context.DocumentsAdministratifs.FindAsync(id);
        if (d == null) return false;
        context.DocumentsAdministratifs.Remove(d);
        await context.SaveChangesAsync();
        return true;
    }
}
