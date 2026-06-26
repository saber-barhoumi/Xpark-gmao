using Fleet.API.DTOs;

namespace Fleet.API.Services;

public interface ICarburantService
{
    Task<IEnumerable<CarburantDto>> GetByVehiculeAsync(long? vehiculeId = null);
    Task<CarburantDto?> GetByIdAsync(long id);
    Task<CarburantDto> CreateAsync(CreateCarburantDto dto);
    Task<bool> DeleteAsync(long id);
}
