using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.API.Controllers;

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

    /// <summary>Obtenir tous les véhicules (paginé)</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponseDto<VehiculeResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponseDto<VehiculeResponseDto>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var vehicules = await _vehiculeService.GetAllAsync(page, pageSize);
        return Ok(vehicules);
    }

    /// <summary>Obtenir un véhicule par ID</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(VehiculeResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehiculeResponseDto>> GetById(long id)
    {
        var vehicule = await _vehiculeService.GetByIdAsync(id);
        if (vehicule == null) return NotFound(new { message = $"Véhicule {id} introuvable" });
        return Ok(vehicule);
    }

    /// <summary>Obtenir un véhicule par immatriculation</summary>
    [HttpGet("immatriculation/{immatriculation}")]
    [ProducesResponseType(typeof(VehiculeResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehiculeResponseDto>> GetByImmatriculation(string immatriculation)
    {
        var vehicule = await _vehiculeService.GetByImmatriculationAsync(immatriculation);
        if (vehicule == null) return NotFound(new { message = $"Véhicule {immatriculation} introuvable" });
        return Ok(vehicule);
    }

    /// <summary>Obtenir les dernières infos d'un véhicule (kilométrage, carburant)</summary>
    [HttpGet("{id:long}/latest-info")]
    [ProducesResponseType(typeof(VehiculeLatestInfoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehiculeLatestInfoDto>> GetLatestInfo(long id)
    {
        var info = await _vehiculeService.GetLatestInfoAsync(id);
        if (info == null) return NotFound(new { message = $"Véhicule {id} introuvable" });
        return Ok(info);
    }

    /// <summary>Obtenir les véhicules disponibles</summary>
    [HttpGet("disponibles")]
    [ProducesResponseType(typeof(IEnumerable<VehiculeResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<VehiculeResponseDto>>> GetDisponibles()
    {
        var vehicules = await _vehiculeService.GetDisponiblesAsync();
        return Ok(vehicules);
    }

    /// <summary>Créer un nouveau véhicule</summary>
    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    [ProducesResponseType(typeof(VehiculeResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<VehiculeResponseDto>> Create([FromBody] CreateVehiculeDto dto)
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

    /// <summary>Mettre à jour un véhicule</summary>
    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    [ProducesResponseType(typeof(VehiculeResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehiculeResponseDto>> Update(long id, [FromBody] UpdateVehiculeDto dto)
    {
        var vehicule = await _vehiculeService.UpdateAsync(id, dto);
        if (vehicule == null) return NotFound(new { message = $"Véhicule {id} introuvable" });
        return Ok(vehicule);
    }

    /// <summary>Mettre à jour le statut d'un véhicule</summary>
    [HttpPatch("{id:long}/statut")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatut(long id, [FromBody] StatutVehicule statut)
    {
        var result = await _vehiculeService.UpdateStatutAsync(id, statut);
        if (!result) return NotFound(new { message = $"Véhicule {id} introuvable" });
        return NoContent();
    }

    /// <summary>Supprimer un véhicule</summary>
    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await _vehiculeService.DeleteAsync(id);
        if (!result) return NotFound(new { message = $"Véhicule {id} introuvable" });
        return NoContent();
    }
}
