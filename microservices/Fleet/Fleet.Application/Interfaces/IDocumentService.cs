using Fleet.Application.DTOs;

namespace Fleet.Application.Interfaces;

public interface IDocumentService
{
    Task<IEnumerable<DocumentDto>> GetByVehiculeAsync(long vehiculeId);
    Task<DocumentDto?> GetByIdAsync(long id);
    Task<DocumentDto> CreateAsync(CreateDocumentDto dto);
    Task<bool> DeleteAsync(long id);
}
