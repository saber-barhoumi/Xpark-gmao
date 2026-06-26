using IAM.API.DTOs;
using IAM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Shared.Common;
using XparkGMAO.Shared.Enums;

namespace IAM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/employees")]
public class EmployeesController(IEmployeeService employeeService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<EmployeeDto>>>> GetAll(
        [FromQuery] string? statut = null,
        [FromQuery] string? post   = null)
    {
        var all = await employeeService.GetAllAsync();
        if (!string.IsNullOrEmpty(statut))
            all = all.Where(e => string.Equals(e.Statut, statut, StringComparison.OrdinalIgnoreCase)).ToList();
        if (!string.IsNullOrEmpty(post))
            all = all.Where(e => string.Equals(e.Post, post, StringComparison.OrdinalIgnoreCase)).ToList();
        return Ok(ApiResponse<List<EmployeeDto>>.Ok(all));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<EmployeeDto>>> GetById(long id) =>
        Ok(ApiResponse<EmployeeDto>.Ok(await employeeService.GetByIdAsync(id)));

    [HttpGet("by-post/{post}")]
    public async Task<ActionResult<ApiResponse<List<EmployeeDto>>>> GetByPost(PostEmployee post) =>
        Ok(ApiResponse<List<EmployeeDto>>.Ok(await employeeService.GetByPostAsync(post)));

    [HttpGet("by-statut/{statut}")]
    public async Task<ActionResult<ApiResponse<List<EmployeeDto>>>> GetByStatut(StatutEmployee statut) =>
        Ok(ApiResponse<List<EmployeeDto>>.Ok(await employeeService.GetByStatutAsync(statut)));

    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<EmployeeDto>>> Create([FromBody] CreateEmployeeDto dto)
    {
        var result = await employeeService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.IdEmployee },
            ApiResponse<EmployeeDto>.Ok(result, "Employé créé."));
    }

    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<EmployeeDto>>> Update(long id, [FromBody] UpdateEmployeeDto dto) =>
        Ok(ApiResponse<EmployeeDto>.Ok(await employeeService.UpdateAsync(id, dto)));

    [Authorize(Roles = "ADMIN,ADMINISTRATEUR")]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(long id)
    {
        await employeeService.DeleteAsync(id);
        return Ok(ApiResponse<string>.Ok("Employé supprimé."));
    }
}
