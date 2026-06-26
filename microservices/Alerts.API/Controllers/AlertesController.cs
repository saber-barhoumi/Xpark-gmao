using Alerts.API.DTOs;
using Alerts.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alerts.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlertesController(IAlertService service, ILogger<AlertesController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var alertes = await service.GetAllAsync();
        return Ok(alertes);
    }

    [HttpGet("non-lues")]
    [HttpGet("unread")]          // frontend alias
    public async Task<IActionResult> GetNonLues()
    {
        var alertes = await service.GetNonLuesAsync();
        return Ok(alertes);
    }

    [HttpGet("count")]
    [HttpGet("count-unread")]    // frontend alias
    public async Task<IActionResult> CountNonLues()
    {
        var count = await service.CountNonLuesAsync();
        return Ok(new { count });
    }

    [HttpGet("type/{type}")]
    public async Task<IActionResult> GetByType(string type)
    {
        var alertes = await service.GetByTypeAsync(type);
        return Ok(alertes);
    }

    [HttpPatch("{id:long}/lire")]
    [HttpPut("{id:long}/mark-as-read")]    // frontend alias
    public async Task<IActionResult> MarquerLue(long id)
    {
        var result = await service.MarquerLueAsync(id);
        if (!result) return NotFound(new { message = $"Alerte {id} introuvable" });
        return Ok(new { message = "Alerte marquée comme lue" });
    }

    [HttpPatch("lire-toutes")]
    [HttpPut("mark-all-read")]    // frontend alias
    public async Task<IActionResult> MarquerToutesLues()
    {
        await service.MarquerToutesLuesAsync();
        return Ok(new { message = "Toutes les alertes ont été marquées comme lues" });
    }

    [HttpPatch("{id:long}/traiter")]
    [HttpPost("{id:long}/traitee")]   // frontend alias
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> MarquerTraitee(long id)
    {
        var result = await service.MarquerTraiteeAsync(id);
        if (!result) return NotFound(new { message = $"Alerte {id} introuvable" });
        return Ok(new { message = "Alerte marquée comme traitée" });
    }

    [HttpPost("generer")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> GenererAlertes()
    {
        await service.GenerateAlertesAutomatiquesAsync();
        return Ok(new { message = "Alertes générées automatiquement" });
    }

    [HttpPost("daily-checks")]
    [HttpPost("run-checks")]   // frontend alias
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> RunDailyChecks()
    {
        await service.RunDailyChecksAsync();
        return Ok(new { message = "Vérifications quotidiennes effectuées" });
    }
}
