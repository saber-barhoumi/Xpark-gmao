using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FacturesController : ControllerBase
{
    private readonly IFacturationService _facturationService;
    private readonly ILogger<FacturesController> _logger;

    public FacturesController(IFacturationService facturationService, ILogger<FacturesController> logger)
    {
        _facturationService = facturationService;
        _logger = logger;
    }

    /// <summary>Obtenir toutes les factures (paginé)</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponseDto<FactureResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponseDto<FactureResponseDto>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var factures = await _facturationService.GetAllAsync(page, pageSize);
        return Ok(factures);
    }

    /// <summary>Obtenir une facture par ID</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(FactureResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FactureResponseDto>> GetById(long id)
    {
        var facture = await _facturationService.GetByIdAsync(id);
        if (facture == null) return NotFound(new { message = $"Facture {id} introuvable" });
        return Ok(facture);
    }

    /// <summary>Obtenir les factures d'un client</summary>
    [HttpGet("client/{clientId:long}")]
    [ProducesResponseType(typeof(IEnumerable<FactureResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<FactureResponseDto>>> GetByClient(long clientId)
    {
        var factures = await _facturationService.GetByClientAsync(clientId);
        return Ok(factures);
    }

    /// <summary>Obtenir les factures impayées</summary>
    [HttpGet("impayees")]
    [ProducesResponseType(typeof(IEnumerable<FactureResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<FactureResponseDto>>> GetImpayees()
    {
        var factures = await _facturationService.GetImpayeesAsync();
        return Ok(factures);
    }

    /// <summary>Créer une nouvelle facture</summary>
    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    [ProducesResponseType(typeof(FactureResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FactureResponseDto>> Create([FromBody] CreateFactureDto dto)
    {
        var facture = await _facturationService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = facture.IdFacture }, facture);
    }

    /// <summary>Marquer une facture comme payée</summary>
    [HttpPost("{id:long}/payer")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarquerPayee(long id, [FromBody] string modePaiement)
    {
        var result = await _facturationService.MarquerPayeeAsync(id, modePaiement);
        if (!result) return NotFound(new { message = $"Facture {id} introuvable" });
        return NoContent();
    }

    /// <summary>Annuler une facture</summary>
    [HttpPost("{id:long}/annuler")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Annuler(long id)
    {
        var result = await _facturationService.AnnulerAsync(id);
        if (!result) return NotFound(new { message = $"Facture {id} introuvable" });
        return NoContent();
    }
}
