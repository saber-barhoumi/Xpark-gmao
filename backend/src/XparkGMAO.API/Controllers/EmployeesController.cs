using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Application.Services;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.Entities.GestionAdministrative;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _service;

    public EmployeesController(IEmployeeService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? post, [FromQuery] string? statut)
    {
        PostEmployee? postEnum = null;
        if (!string.IsNullOrEmpty(post) && Enum.TryParse<PostEmployee>(post, true, out var p))
            postEnum = p;

        StatutEmployee? statutEnum = null;
        if (!string.IsNullOrEmpty(statut) && Enum.TryParse<StatutEmployee>(statut, true, out var s))
            statutEnum = s;

        if (postEnum.HasValue || statutEnum.HasValue)
        {
            var filtered = await _service.GetByFiltersAsync(postEnum, statutEnum);
            return Ok(filtered);
        }

        var all = await _service.GetAllAsync();
        return Ok(all);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var employee = await _service.GetByIdAsync(id);
        if (employee == null) return NotFound(new { message = "Employé introuvable" });
        return Ok(employee);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN, ADMINISTRATEUR, GESTIONNAIRE")]
    public async Task<IActionResult> Create([FromBody] EmployeeDto dto)
    {
        try
        {
            var employee = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = employee.IdEmployee }, employee);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN, ADMINISTRATEUR, GESTIONNAIRE")]
    public async Task<IActionResult> Update(long id, [FromBody] EmployeeDto dto)
    {
        try
        {
            await _service.UpdateAsync(id, dto);
            return Ok(new { message = "Employé mis à jour avec succès" });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN, ADMINISTRATEUR, GESTIONNAIRE")]
    public async Task<IActionResult> Delete(long id)
    {
        await _service.DeactivateAsync(id);
        return Ok(new { message = "Employé désactivé avec succès" });
    }
}
