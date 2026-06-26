using Fleet.API.DTOs;

namespace Fleet.API.Services;

public interface IVehiculeService
{
    Task<object> GetAllAsync(int page, int pageSize);
    Task<VehiculeDto?> GetByIdAsync(long id);
    Task<VehiculeDto?> GetByImmatriculationAsync(string immatriculation);
    Task<object?> GetLatestInfoAsync(long id);
    Task<IEnumerable<VehiculeDto>> GetDisponiblesAsync();
    Task<VehiculeDto> CreateAsync(CreateVehiculeDto dto);
    Task<VehiculeDto?> UpdateAsync(long id, UpdateVehiculeDto dto);
    Task<bool> DeleteAsync(long id);
}
