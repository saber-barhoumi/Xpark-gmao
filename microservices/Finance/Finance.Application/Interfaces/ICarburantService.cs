using Finance.Application.DTOs;

namespace Finance.Application.Interfaces;

public interface ICarburantService
{
    Task<IEnumerable<CarburantResponseDto>> GetAllAsync(long? vehiculeId = null);
    Task<CarburantResponseDto?> GetByIdAsync(long id);
    Task<CarburantResponseDto> CreateAsync(CreateCarburantDto dto);
    Task<bool> DeleteAsync(long id);
    Task<StatistiquesCarburantDto> GetStatsAsync(long? vehiculeId = null, DateTime? from = null, DateTime? to = null);
}
