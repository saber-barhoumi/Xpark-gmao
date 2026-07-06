using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mission.API.DTOs;
using Mission.API.Entities;
using Mission.API.Services;

namespace Mission.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MissionsController(
    IMissionService missionService,
    IOptimizationService optimizationService) : ControllerBase
{
    private long CurrentUserId => long.Parse(User.FindFirst("userId")!.Value);

    [HttpGet]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE,CHAUFFEUR,TECHNICIEN")]  // staff — les clients passent par /my
    public async Task<IActionResult> GetAll([FromQuery] string? statut)
    {
        if (!string.IsNullOrEmpty(statut) && Enum.TryParse<StatutMission>(statut, true, out var s))
            return Ok(await missionService.GetByStatutAsync(s));
        return Ok(await missionService.GetAllAsync());
    }

    // ── Portail client (frontoffice) ──────────────────────────────────────────

    /// <summary>Missions du client connecté (portail frontoffice).</summary>
    [HttpGet("my")]
    public async Task<IActionResult> GetMyMissions()
        => Ok(await missionService.GetByClientAsync(CurrentUserId));

    /// <summary>Demande de réservation client → mission EN_ATTENTE, affectée
    /// ensuite par l'admin ou OptimisateurFlotteIA.</summary>
    [HttpPost("client-request")]
    public async Task<IActionResult> CreateClientRequest([FromBody] ClientMissionRequestDto dto)
    {
        try
        {
            var mission = await missionService.CreateClientRequestAsync(CurrentUserId, dto);
            return CreatedAtAction(nameof(GetById), new { id = mission.IdMission }, mission);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("{id:long}")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE,CHAUFFEUR,TECHNICIEN")]
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

    /// <summary>
    /// Triggers an OptimisateurFlotteIA run over RabbitMQ (FICHE §2.3):
    /// publishes xpark.missions.ready-for-optimization and returns the batchId
    /// the frontend polls via GET /api/missions/optimize/{batchId}.
    /// </summary>
    [HttpPost("optimize")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> RequestOptimization([FromBody] OptimizeRequestDto dto)
    {
        try
        {
            var batchId = await optimizationService.RequestOptimizationAsync(dto);
            return Accepted(new { batchId, status = "PENDING" });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex)
        {
            return StatusCode(503, new { message = $"Bus d'événements indisponible: {ex.Message}" });
        }
    }

    /// <summary>Returns the generated plan once received on xpark.optimization.plan-generated.</summary>
    [HttpGet("optimize/{batchId}")]
    public IActionResult GetOptimizationPlan(string batchId)
    {
        var plan = optimizationService.GetPlan(batchId);
        if (plan == null) return Accepted(new { batchId, status = "PENDING" });
        return Content(plan, "application/json");
    }

    /// <summary>Applies an OptimisateurFlotteIA assignment to a mission EN_ATTENTE.</summary>
    [HttpPut("{id:long}/assign")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> Assign(long id, [FromBody] AssignMissionDto dto)
    {
        try
        {
            var mission = await missionService.AssignMissionAsync(id, dto);
            return Ok(mission);
        }
        catch (KeyNotFoundException ex)      { return NotFound(new { message = ex.Message }); }
        catch (Exception ex)                 { return BadRequest(new { message = ex.Message }); }
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
