using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Application.Services;
using XparkGMAO.Core.DTOs.Request;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/carburants")]
[Authorize]
public class CarburantsController : ControllerBase
{
    private readonly ICarburantService _carburantService;
    private readonly ILogger<CarburantsController> _logger;

    public CarburantsController(ICarburantService carburantService, ILogger<CarburantsController> logger)
    {
        _carburantService = carburantService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] long? vehiculeId)
    {
        var result = await _carburantService.GetAllAsync(vehiculeId);
        return Ok(result);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        try
        {
            var result = await _carburantService.GetByIdAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> Create([FromBody] CreateCarburantDto dto)
    {
        try
        {
            var result = await _carburantService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.IdCarburant }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await _carburantService.DeleteAsync(id);
        if (!result) return NotFound(new { message = "Enregistrement non trouvé" });
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] long? vehiculeId, [FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var result = await _carburantService.GetStatsAsync(vehiculeId, start, end);
        return Ok(result);
    }
}
