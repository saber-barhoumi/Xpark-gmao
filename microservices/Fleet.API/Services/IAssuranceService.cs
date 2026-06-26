using Fleet.API.DTOs;

namespace Fleet.API.Services;

public interface IAssuranceService
{
    Task<IEnumerable<AssuranceDto>> GetByVehiculeAsync(long vehiculeId);
    Task<AssuranceDto?> GetByIdAsync(long id);
    Task<AssuranceDto> CreateAsync(CreateAssuranceDto dto);
    Task<bool> DeleteAsync(long id);
}
