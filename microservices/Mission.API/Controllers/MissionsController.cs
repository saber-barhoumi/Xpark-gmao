using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mission.API.DTOs;
using Mission.API.Entities;
using Mission.API.Services;

namespace Mission.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MissionsController(IMissionService missionService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? statut)
    {
        if (!string.IsNullOrEmpty(statut) && Enum.TryParse<StatutMission>(statut, true, out var s))
            return Ok(await missionService.GetByStatutAsync(s));
        return Ok(await missionService.GetAllAsync());
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var mission = await missionService.GetByIdAsync(id);
        if (mission == null) return NotFound(new { message = "Mission introuvable" });
        return Ok(mission);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> Create([FromBody] CreateMissionDto dto)
    {
        try
        {
            var mission = await missionService.CreateMissionAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = mission.IdMission }, mission);
        }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:long}/close")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> Close(long id, [FromBody] CloseMissionDto dto)
    {
        try
        {
            var mission = await missionService.CloseMissionAsync(id, dto.KilometrageRetour);
            return Ok(mission);
        }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:long}/cancel")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> Cancel(long id)
    {
        var result = await missionService.CancelMissionAsync(id);
        if (!result) return NotFound(new { message = "Mission introuvable ou déjà terminée" });
        return Ok(new { message = "Mission annulée avec succès" });
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await missionService.DeleteAsync(id);
        if (!result) return NotFound(new { message = "Mission introuvable" });
        return Ok(new { message = "Mission supprimée avec succès" });
    }
}
