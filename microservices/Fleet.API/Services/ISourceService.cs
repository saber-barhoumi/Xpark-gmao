using Fleet.API.DTOs;

namespace Fleet.API.Services;

public interface ISourceService
{
    Task<IEnumerable<SourceDto>> GetAllAsync();
    Task<IEnumerable<SourceDto>> GetActivesAsync();
    Task<IEnumerable<SourceDto>> GetByTypeAsync(string type);
    Task<SourceDto?> GetByIdAsync(long id);
    Task<SourceDto> CreateAsync(CreateSourceDto dto);
    Task<SourceDto?> UpdateAsync(long id, UpdateSourceDto dto);
    Task<bool> DeleteAsync(long id);
}
