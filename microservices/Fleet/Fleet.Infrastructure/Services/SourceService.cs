using AutoMapper;
using Fleet.Infrastructure.Data;
using Fleet.Application.DTOs;
using Fleet.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Infrastructure.Services;

public class SourceService(FleetDbContext context, IMapper mapper) : ISourceService
{
    public async Task<IEnumerable<SourceDto>> GetAllAsync()
    {
        var sources = await context.Sources.OrderBy(s => s.NomSource).ToListAsync();
        return await WithCounts(sources);
    }

    public async Task<IEnumerable<SourceDto>> GetActivesAsync()
    {
        var sources = await context.Sources.Where(s => s.Actif).OrderBy(s => s.NomSource).ToListAsync();
        return await WithCounts(sources);
    }

    public async Task<IEnumerable<SourceDto>> GetByTypeAsync(string type)
    {
        if (!Enum.TryParse<XparkGMAO.Shared.Enums.TypeSource>(type, true, out var typeEnum))
            return Enumerable.Empty<SourceDto>();
        var sources = await context.Sources.Where(s => s.TypeSource == typeEnum).OrderBy(s => s.NomSource).ToListAsync();
        return await WithCounts(sources);
    }

    public async Task<SourceDto?> GetByIdAsync(long id)
    {
        var s = await context.Sources.FindAsync(id);
        if (s == null) return null;
        var dto = mapper.Map<SourceDto>(s);
        dto.NombreConsommations = await context.Carburants.CountAsync(c => c.SourceId == id);
        return dto;
    }

    public async Task<SourceDto> CreateAsync(CreateSourceDto dto)
    {
        var source = new Source
        {
            NomSource    = dto.NomSource,
            TypeSource   = dto.TypeSource,
            Adresse      = dto.Adresse,
            Ville        = dto.Ville,
            Longitude    = dto.Longitude,
            Latitude     = dto.Latitude,
            PrixMoyen    = dto.PrixMoyen,
            RemiseFiotte = dto.RemiseFiotte,
            CodeCarte    = dto.CodeCarte,
            Actif        = true,
            DateCreation = DateTime.UtcNow
        };
        context.Sources.Add(source);
        await context.SaveChangesAsync();
        return mapper.Map<SourceDto>(source);
    }

    public async Task<SourceDto?> UpdateAsync(long id, UpdateSourceDto dto)
    {
        var source = await context.Sources.FindAsync(id);
        if (source == null) return null;

        if (dto.NomSource != null) source.NomSource = dto.NomSource;
        if (dto.TypeSource != null && Enum.TryParse<XparkGMAO.Shared.Enums.TypeSource>(dto.TypeSource, true, out var t))
            source.TypeSource = t;
        if (dto.Adresse     != null) source.Adresse     = dto.Adresse;
        if (dto.Ville       != null) source.Ville       = dto.Ville;
        if (dto.Longitude.HasValue)  source.Longitude   = dto.Longitude;
        if (dto.Latitude.HasValue)   source.Latitude    = dto.Latitude;
        if (dto.PrixMoyen.HasValue)  source.PrixMoyen   = dto.PrixMoyen;
        if (dto.RemiseFiotte.HasValue) source.RemiseFiotte = dto.RemiseFiotte;
        if (dto.CodeCarte   != null) source.CodeCarte   = dto.CodeCarte;
        if (dto.Actif.HasValue)      source.Actif       = dto.Actif.Value;

        await context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var s = await context.Sources.FindAsync(id);
        if (s == null) return false;
        s.Actif = false;
        await context.SaveChangesAsync();
        return true;
    }

    private async Task<IEnumerable<SourceDto>> WithCounts(IEnumerable<Source> sources)
    {
        var ids = sources.Select(s => s.IdSource).ToList();
        var counts = await context.Carburants
            .Where(c => c.SourceId != null && ids.Contains(c.SourceId!.Value))
            .GroupBy(c => c.SourceId!.Value)
            .Select(g => new { SourceId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.SourceId, x => x.Count);

        return sources.Select(s =>
        {
            var dto = mapper.Map<SourceDto>(s);
            dto.NombreConsommations = counts.GetValueOrDefault(s.IdSource, 0);
            return dto;
        });
    }
}
