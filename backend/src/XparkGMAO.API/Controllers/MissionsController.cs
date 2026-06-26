using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Interfaces.Services;
using XparkGMAO.Core.Entities.GestionOperations;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MissionsController : ControllerBase
{
    private readonly IMissionService _missionService;

    public MissionsController(IMissionService missionService)
    {
        _missionService = missionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? statut)
    {
        if (!string.IsNullOrEmpty(statut) && Enum.TryParse<StatutMission>(statut, true, out var statutEnum))
        {
            var filtered = await _missionService.GetByStatutAsync(statutEnum);
            return Ok(filtered);
        }

        var all = await _missionService.GetAllAsync();
        return Ok(all);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var mission = await _missionService.GetByIdAsync(id);
        if (mission == null) return NotFound(new { message = "Mission introuvable" });
        return Ok(mission);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> Create([FromBody] CreateMissionDto dto)
    {
        try
        {
            var mission = await _missionService.CreateMissionAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = mission.IdMission }, mission);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}/close")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> Close(long id, [FromBody] CloseMissionDto dto)
    {
        try
        {
            var mission = await _missionService.CloseMissionAsync(id, dto.KilometrageRetour);
            return Ok(mission);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}/cancel")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> Cancel(long id)
    {
        var result = await _missionService.CancelMissionAsync(id);
        if (!result) return NotFound(new { message = "Mission introuvable ou déjà terminée" });
        return Ok(new { message = "Mission annulée avec succès" });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await _missionService.DeleteAsync(id);
        if (!result) return NotFound(new { message = "Mission introuvable" });
        return Ok(new { message = "Mission supprimée avec succès" });
    }
}
