using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Application.Services;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/sources")]
[Authorize]
public class SourcesController : ControllerBase
{
    private readonly ISourceService _sourceService;
    private readonly ILogger<SourcesController> _logger;
    private readonly XparkDbContext _context;

    public SourcesController(ISourceService sourceService, ILogger<SourcesController> logger, XparkDbContext context)
    {
        _sourceService = sourceService;
        _logger = logger;
        _context = context;
    }

    /// <summary>Récupérer toutes les sources</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var sources = await _sourceService.GetAllAsync();
        return Ok(sources);
    }

    /// <summary>Récupérer les sources actives uniquement (pour dropdowns)</summary>
    [HttpGet("actives")]
    public async Task<IActionResult> GetActives()
    {
        var sources = await _sourceService.GetActivesAsync();
        return Ok(sources);
    }

    /// <summary>Récupérer une source par ID</summary>
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        try
        {
            var source = await _sourceService.GetByIdAsync(id);
            return Ok(source);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>Filtrer par type</summary>
    [HttpGet("type/{typeSource}")]
    public async Task<IActionResult> GetByType(TypeSource typeSource)
    {
        var sources = await _sourceService.GetByTypeAsync(typeSource);
        return Ok(sources);
    }

    /// <summary>Créer une nouvelle source</summary>
    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Create([FromBody] CreateSourceDto dto)
    {
        try
        {
            var source = await _sourceService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = source.IdSource }, source);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>Modifier une source</summary>
    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateSourceDto dto)
    {
        try
        {
            var source = await _sourceService.UpdateAsync(id, dto);
            return Ok(source);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>Supprimer une source</summary>
    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await _sourceService.DeleteAsync(id);
        if (!result) return NotFound(new { message = "Source non trouvée" });
        return NoContent();
    }

    /// <summary>Historique d'audit d'une source</summary>
    [HttpGet("{id:long}/audit")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> GetAudit(long id)
    {
        var logs = await _context.AuditLogs
            .Where(a => a.EntityName == "Source" && a.EntityId == id)
            .OrderByDescending(a => a.DateAction)
            .Select(a => new
            {
                a.Id,
                a.Action,
                a.OldValues,
                a.NewValues,
                a.UtilisateurNom,
                a.DateAction
            })
            .ToListAsync();

        return Ok(logs);
    }
}
