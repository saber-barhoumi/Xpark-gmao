using Fleet.API.DTOs;
using Fleet.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleet.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CarburantsController(ICarburantService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] long? vehiculeId = null)
        => Ok(await service.GetByVehiculeAsync(vehiculeId));

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var c = await service.GetByIdAsync(id);
        return c == null ? NotFound(new { message = $"Carburant {id} introuvable" }) : Ok(c);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,CHAUFFEUR")]
    public async Task<IActionResult> Create([FromBody] CreateCarburantDto dto)
    {
        var c = await service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = c.IdCarburant }, c);
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await service.DeleteAsync(id);
        return result ? NoContent() : NotFound(new { message = $"Carburant {id} introuvable" });
    }
}
