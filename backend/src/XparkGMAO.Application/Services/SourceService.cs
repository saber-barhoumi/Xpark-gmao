using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.GestionFinance;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Application.Services;

public interface ISourceService
{
    Task<List<SourceResponseDto>> GetAllAsync();
    Task<SourceResponseDto> GetByIdAsync(long id);
    Task<SourceResponseDto> CreateAsync(CreateSourceDto dto);
    Task<SourceResponseDto> UpdateAsync(long id, UpdateSourceDto dto);
    Task<bool> DeleteAsync(long id);
    Task<List<SourceResponseDto>> GetByTypeAsync(TypeSource typeSource);
    Task<List<SourceResponseDto>> GetActivesAsync();
}

public class SourceService : ISourceService
{
    private readonly XparkDbContext _context;

    public SourceService(XparkDbContext context)
    {
        _context = context;
    }

    public async Task<List<SourceResponseDto>> GetAllAsync()
    {
        var sources = await _context.Sources
            .Include(s => s.ConsommationsCarburant)
            .OrderByDescending(s => s.DateCreation)
            .ToListAsync();

        return sources.Select(MapToDto).ToList();
    }

    public async Task<SourceResponseDto> GetByIdAsync(long id)
    {
        var source = await _context.Sources
            .Include(s => s.ConsommationsCarburant)
            .FirstOrDefaultAsync(s => s.IdSource == id)
            ?? throw new KeyNotFoundException($"Source avec ID {id} non trouvée");

        return MapToDto(source);
    }

    public async Task<SourceResponseDto> CreateAsync(CreateSourceDto dto)
    {
        // Vérification des doublons sur le nom + type
        var doublon = await _context.Sources
            .AnyAsync(s => s.NomSource == dto.NomSource && s.TypeSource == dto.TypeSource && s.Actif);
        if (doublon)
            throw new InvalidOperationException($"Une source '{dto.NomSource}' de type '{dto.TypeSource}' existe déjà.");

        var source = new Source
        {
            NomSource = dto.NomSource,
            TypeSource = dto.TypeSource,
            Adresse = dto.Adresse,
            Ville = dto.Ville,
            Longitude = dto.Longitude,
            Latitude = dto.Latitude,
            PrixMoyen = dto.PrixMoyen,
            RemiseFiotte = dto.RemiseFiotte,
            CodeCarte = dto.CodeCarte,
            Actif = true,
            DateCreation = DateTime.UtcNow
        };

        _context.Sources.Add(source);
        await _context.SaveChangesAsync();
        return MapToDto(source);
    }

    public async Task<SourceResponseDto> UpdateAsync(long id, UpdateSourceDto dto)
    {
        var source = await _context.Sources.FindAsync(id)
            ?? throw new KeyNotFoundException($"Source avec ID {id} non trouvée");

        // Audit : capturer les anciennes valeurs avant modification
        var oldValues = System.Text.Json.JsonSerializer.Serialize(new
        {
            source.NomSource, source.Adresse, source.Ville,
            source.Longitude, source.Latitude, source.PrixMoyen,
            source.RemiseFiotte, source.CodeCarte, source.Actif
        });

        if (!string.IsNullOrEmpty(dto.NomSource)) source.NomSource = dto.NomSource;
        if (!string.IsNullOrEmpty(dto.Adresse)) source.Adresse = dto.Adresse;
        if (!string.IsNullOrEmpty(dto.Ville)) source.Ville = dto.Ville;
        if (dto.Longitude.HasValue) source.Longitude = dto.Longitude;
        if (dto.Latitude.HasValue) source.Latitude = dto.Latitude;
        if (dto.PrixMoyen.HasValue) source.PrixMoyen = dto.PrixMoyen;
        if (dto.RemiseFiotte.HasValue) source.RemiseFiotte = dto.RemiseFiotte;
        if (dto.CodeCarte != null) source.CodeCarte = dto.CodeCarte;
        if (dto.Actif.HasValue) source.Actif = dto.Actif.Value;

        // Audit : capturer les nouvelles valeurs
        var newValues = System.Text.Json.JsonSerializer.Serialize(new
        {
            source.NomSource, source.Adresse, source.Ville,
            source.Longitude, source.Latitude, source.PrixMoyen,
            source.RemiseFiotte, source.CodeCarte, source.Actif
        });

        _context.AuditLogs.Add(new Core.Entities.GestionMaintenance.AuditLog
        {
            EntityName = "Source",
            EntityId = id,
            Action = "UPDATE",
            OldValues = oldValues,
            NewValues = newValues,
            DateAction = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        // Reload with navigation for accurate NombreConsommations
        await _context.Entry(source).Collection(s => s.ConsommationsCarburant).LoadAsync();
        return MapToDto(source);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var source = await _context.Sources.FindAsync(id);
        if (source == null) return false;

        _context.Sources.Remove(source);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<SourceResponseDto>> GetByTypeAsync(TypeSource typeSource)
    {
        var sources = await _context.Sources
            .Include(s => s.ConsommationsCarburant)
            .Where(s => s.TypeSource == typeSource)
            .ToListAsync();

        return sources.Select(MapToDto).ToList();
    }

    public async Task<List<SourceResponseDto>> GetActivesAsync()
    {
        var sources = await _context.Sources
            .Include(s => s.ConsommationsCarburant)
            .Where(s => s.Actif)
            .OrderBy(s => s.NomSource)
            .ToListAsync();

        return sources.Select(MapToDto).ToList();
    }

    private static SourceResponseDto MapToDto(Source source) => new()
    {
        IdSource = source.IdSource,
        NomSource = source.NomSource,
        TypeSource = source.TypeSource.ToString(),
        Adresse = source.Adresse,
        Ville = source.Ville,
        Longitude = source.Longitude,
        Latitude = source.Latitude,
        PrixMoyen = source.PrixMoyen,
        RemiseFiotte = source.RemiseFiotte,
        CodeCarte = source.CodeCarte,
        Actif = source.Actif,
        DateCreation = source.DateCreation,
        NombreConsommations = source.ConsommationsCarburant?.Count ?? 0
    };
}
