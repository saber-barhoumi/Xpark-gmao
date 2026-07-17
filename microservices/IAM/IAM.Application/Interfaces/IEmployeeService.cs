using IAM.Application.DTOs;
using XparkGMAO.Shared.Enums;

namespace IAM.Application.Interfaces;

public interface IEmployeeService
{
    Task<List<EmployeeDto>> GetAllAsync();
    Task<EmployeeDto>       GetByIdAsync(long id);
    Task<EmployeeDto>       CreateAsync(CreateEmployeeDto dto);
    Task<EmployeeDto>       UpdateAsync(long id, UpdateEmployeeDto dto);
    Task                    DeleteAsync(long id);
    Task<List<EmployeeDto>> GetByPostAsync(PostEmployee post);
    Task<List<EmployeeDto>> GetByStatutAsync(StatutEmployee statut);
}
