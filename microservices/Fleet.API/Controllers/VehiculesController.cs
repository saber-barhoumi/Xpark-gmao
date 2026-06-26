using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Fleet.API.DTOs;
using Fleet.API.Services;

namespace Fleet.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehiculesController : ControllerBase
{
    private readonly IVehiculeService _vehiculeService;
    private readonly ILogger<VehiculesController> _logger;

    public VehiculesController(IVehiculeService vehiculeService, ILogger<VehiculesController> logger)
    {
        _vehiculeService = vehiculeService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var vehicules = await _vehiculeService.GetAllAsync(page, pageSize);
        return Ok(vehicules);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var vehicule = await _vehiculeService.GetByIdAsync(id);
        if (vehicule == null) return NotFound(new { message = $"Véhicule {id} introuvable" });
        return Ok(vehicule);
    }

    [HttpGet("immatriculation/{immatriculation}")]
    public async Task<IActionResult> GetByImmatriculation(string immatriculation)
    {
        var vehicule = await _vehiculeService.GetByImmatriculationAsync(immatriculation);
        if (vehicule == null) return NotFound(new { message = $"Véhicule {immatriculation} introuvable" });
        return Ok(vehicule);
    }

    [HttpGet("{id:long}/latest-info")]
    public async Task<IActionResult> GetLatestInfo(long id)
    {
        var info = await _vehiculeService.GetLatestInfoAsync(id);
        if (info == null) return NotFound(new { message = $"Véhicule {id} introuvable" });
        return Ok(info);
    }

    [HttpGet("disponibles")]
    public async Task<IActionResult> GetDisponibles()
    {
        var vehicules = await _vehiculeService.GetDisponiblesAsync();
        return Ok(vehicules);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Create([FromBody] CreateVehiculeDto dto)
    {
        try
        {
            var vehicule = await _vehiculeService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = vehicule.IdVehicule }, vehicule);
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

    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateVehiculeDto dto)
    {
        var updated = await _vehiculeService.UpdateAsync(id, dto);
        if (updated == null) return NotFound(new { message = $"Véhicule {id} introuvable" });
        return Ok(updated);
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await _vehiculeService.DeleteAsync(id);
        if (!result) return NotFound(new { message = $"Véhicule {id} introuvable" });
        return NoContent();
    }
}
