using Finance.API.DTOs;
using Finance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Finance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FacturesController(IFacturationService service, ILogger<FacturesController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? statut = null)
    {
        var result = await service.GetAllAsync(page, pageSize, statut);
        return Ok(result);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var facture = await service.GetByIdAsync(id);
        if (facture == null) return NotFound(new { message = $"Facture {id} introuvable" });
        return Ok(facture);
    }

    [HttpGet("client/{clientId:long}")]
    public async Task<IActionResult> GetByClient(long clientId)
    {
        var factures = await service.GetByClientAsync(clientId);
        return Ok(factures);
    }

    [HttpGet("impayees")]
    public async Task<IActionResult> GetImpayees()
    {
        var factures = await service.GetImpayeesAsync();
        return Ok(factures);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Create([FromBody] CreateFactureDto dto)
    {
        try
        {
            var facture = await service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = facture.IdFacture }, facture);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPatch("{id:long}/payer")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> MarquerPayee(long id, [FromBody] MarquerPayeeRequest? req = null)
    {
        try
        {
            var result = await service.MarquerPayeeAsync(id, req?.MethodePaiement);
            if (!result) return NotFound(new { message = $"Facture {id} introuvable" });
            return Ok(new { message = "Facture marquée comme payée", datePaiement = DateTime.UtcNow });
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPatch("{id:long}/annuler")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Annuler(long id, [FromBody] AnnulerFactureRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Motif))
            return BadRequest(new { message = "Le motif d'annulation est obligatoire." });
        try
        {
            var result = await service.AnnulerAsync(id, req.Motif);
            if (!result) return NotFound(new { message = $"Facture {id} introuvable" });
            return Ok(new { message = "Facture annulée" });
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
}
