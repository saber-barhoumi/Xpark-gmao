using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.DTOs.Request;

namespace XparkGMAO.Application.Services;

public interface IEmployeeService
{
    Task<IEnumerable<Employee>> GetAllAsync();
    Task<Employee?> GetByIdAsync(long id);
    Task<IEnumerable<Employee>> GetByPostAsync(PostEmployee post);
    Task<IEnumerable<Employee>> GetByStatutAsync(StatutEmployee statut);
    Task<IEnumerable<Employee>> GetByFiltersAsync(PostEmployee? post, StatutEmployee? statut);
    Task<Employee> CreateAsync(EmployeeDto dto);
    Task UpdateAsync(long id, EmployeeDto dto);
    Task DeactivateAsync(long id);
}
