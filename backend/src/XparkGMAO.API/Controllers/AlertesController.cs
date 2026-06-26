using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.GestionAlertes;
using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlertesController : ControllerBase
{
    private readonly IAlertService _alerteService;
    private readonly ILogger<AlertesController> _logger;

    public AlertesController(IAlertService alerteService, ILogger<AlertesController> logger)
    {
        _alerteService = alerteService;
        _logger = logger;
    }

    /// <summary>Obtenir toutes les alertes triées par date DESC</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AlerteResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AlerteResponseDto>>> GetAll()
    {
        var alertes = await _alerteService.GetAllAsync();
        return Ok(alertes);
    }

    /// <summary>Obtenir les alertes non lues (ACTIVE)</summary>
    [HttpGet("unread")]
    [ProducesResponseType(typeof(IEnumerable<AlerteResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AlerteResponseDto>>> GetUnread()
    {
        var alertes = await _alerteService.GetActivesAsync();
        return Ok(alertes);
    }

    /// <summary>Compter les alertes non lues</summary>
    [HttpGet("count-unread")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> CountUnread()
    {
        var count = await _alerteService.CountUnreadAsync();
        return Ok(new { count });
    }

    /// <summary>Obtenir les alertes par type</summary>
    [HttpGet("type/{type}")]
    [ProducesResponseType(typeof(IEnumerable<AlerteResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AlerteResponseDto>>> GetByType(TypeAlerte type)
    {
        var alertes = await _alerteService.GetByTypeAsync(type);
        return Ok(alertes);
    }

    /// <summary>Marquer une alerte comme lue</summary>
    [HttpPut("{id:long}/mark-as-read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(long id)
    {
        var result = await _alerteService.MarquerLueAsync(id);
        if (!result) return NotFound(new { message = $"Alerte {id} introuvable" });
        return NoContent();
    }

    /// <summary>Marquer toutes les alertes comme lues</summary>
    [HttpPut("mark-all-read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _alerteService.MarquerToutesLuesAsync();
        return NoContent();
    }

    /// <summary>Marquer une alerte comme traitée (legacy endpoint)</summary>
    [HttpPost("{id:long}/lue")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarquerLue(long id)
    {
        var result = await _alerteService.MarquerLueAsync(id);
        if (!result) return NotFound(new { message = $"Alerte {id} introuvable" });
        return NoContent();
    }

    /// <summary>Marquer une alerte comme traitée</summary>
    [HttpPost("{id:long}/traitee")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarquerTraitee(long id)
    {
        var result = await _alerteService.MarquerTraiteeAsync(id);
        if (!result) return NotFound(new { message = $"Alerte {id} introuvable" });
        return NoContent();
    }

    /// <summary>Générer les alertes automatiques</summary>
    [HttpPost("generer")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GenererAlertes()
    {
        await _alerteService.GenerateAlertesAutomatiquesAsync();
        return Ok(new { message = "Alertes générées avec succès" });
    }

    /// <summary>Déclenche manuellement les vérifications quotidiennes complexes (Assurances, Visites, etc.)</summary>
    [HttpPost("run-checks")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> RunDailyChecks([FromServices] IDailyAlertCheckerService checkerService)
    {
        await checkerService.RunAllChecksAsync();
        return Ok(new { message = "Vérifications quotidiennes exécutées avec succès." });
    }
}
