using Maintenance.Application.DTOs;
using Maintenance.Domain.Entities;

namespace Maintenance.Application.Interfaces;

public interface IMaintenanceService
{
    Task<PaginatedResponseDto<InterventionResponseDto>> GetAllAsync(int page = 1, int pageSize = 20);
    Task<InterventionResponseDto?> GetByIdAsync(long id);
    Task<IEnumerable<InterventionResponseDto>> GetByVehiculeAsync(long vehiculeId);
    Task<InterventionResponseDto> CreateAsync(CreateInterventionDto dto);
    Task<bool> UpdateStatutAsync(long id, StatutIntervention statut);
    Task<bool> DeleteAsync(long id);
}
