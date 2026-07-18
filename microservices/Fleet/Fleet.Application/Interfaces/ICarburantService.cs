using Fleet.Application.DTOs;

namespace Fleet.Application.Interfaces;

public interface ICarburantService
{
    Task<IEnumerable<CarburantDto>> GetByVehiculeAsync(long? vehiculeId = null);
    Task<CarburantDto?> GetByIdAsync(long id);
    Task<CarburantDto> CreateAsync(CreateCarburantDto dto);
    Task<bool> DeleteAsync(long id);
    Task<StatistiquesCarburantDto> GetStatsAsync(long? vehiculeId = null, DateTime? start = null, DateTime? end = null);
}
