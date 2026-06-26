using Fleet.API.DTOs;
using Fleet.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleet.API.Controllers;

[ApiController]
[Route("api/assurances")]
[Authorize]
public class AssurancesController(IAssuranceService service) : ControllerBase
{
    [HttpGet("vehicule/{vehiculeId:long}")]
    public async Task<IActionResult> GetByVehicule(long vehiculeId)
        => Ok(await service.GetByVehiculeAsync(vehiculeId));

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var a = await service.GetByIdAsync(id);
        return a == null ? NotFound(new { message = $"Assurance {id} introuvable" }) : Ok(a);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Create([FromBody] CreateAssuranceDto dto)
    {
        try
        {
            var a = await service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = a.IdAssurance }, a);
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await service.DeleteAsync(id);
        return result ? NoContent() : NotFound(new { message = $"Assurance {id} introuvable" });
    }
}
