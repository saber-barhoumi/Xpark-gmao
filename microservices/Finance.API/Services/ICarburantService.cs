using Finance.API.DTOs;

namespace Finance.API.Services;

public interface ICarburantService
{
    Task<IEnumerable<CarburantResponseDto>> GetAllAsync(long? vehiculeId = null);
    Task<CarburantResponseDto?> GetByIdAsync(long id);
    Task<CarburantResponseDto> CreateAsync(CreateCarburantDto dto);
    Task<bool> DeleteAsync(long id);
    Task<StatistiquesCarburantDto> GetStatsAsync(long? vehiculeId = null, DateTime? from = null, DateTime? to = null);
}
