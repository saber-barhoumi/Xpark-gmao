using Fleet.API.DTOs;

namespace Fleet.API.Services;

public interface IDocumentService
{
    Task<IEnumerable<DocumentDto>> GetByVehiculeAsync(long vehiculeId);
    Task<DocumentDto?> GetByIdAsync(long id);
    Task<DocumentDto> CreateAsync(CreateDocumentDto dto);
    Task<bool> DeleteAsync(long id);
}
