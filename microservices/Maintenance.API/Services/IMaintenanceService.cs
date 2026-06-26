using Maintenance.API.DTOs;
using Maintenance.API.Entities;

namespace Maintenance.API.Services;

public interface IMaintenanceService
{
    Task<PaginatedResponseDto<InterventionResponseDto>> GetAllAsync(int page = 1, int pageSize = 20);
    Task<InterventionResponseDto?> GetByIdAsync(long id);
    Task<IEnumerable<InterventionResponseDto>> GetByVehiculeAsync(long vehiculeId);
    Task<InterventionResponseDto> CreateAsync(CreateInterventionDto dto);
    Task<bool> UpdateStatutAsync(long id, StatutIntervention statut);
    Task<bool> DeleteAsync(long id);
}
