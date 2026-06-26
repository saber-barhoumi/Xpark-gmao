using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly IClientService _clientService;
    private readonly ILogger<ClientsController> _logger;

    public ClientsController(IClientService clientService, ILogger<ClientsController> logger)
    {
        _clientService = clientService;
        _logger = logger;
    }

    /// <summary>Obtenir tous les clients (paginé)</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponseDto<ClientResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponseDto<ClientResponseDto>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var clients = await _clientService.GetAllAsync(page, pageSize);
        return Ok(clients);
    }

    /// <summary>Obtenir un client par ID</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(ClientResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClientResponseDto>> GetById(long id)
    {
        var client = await _clientService.GetByIdAsync(id);
        if (client == null) return NotFound(new { message = $"Client {id} introuvable" });
        return Ok(client);
    }

    /// <summary>Créer un nouveau client</summary>
    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    [ProducesResponseType(typeof(ClientResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ClientResponseDto>> Create([FromBody] CreateClientDto dto)
    {
        try
        {
            var client = await _clientService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = client.IdUtilisateur }, client);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Mettre à jour un client</summary>
    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    [ProducesResponseType(typeof(ClientResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClientResponseDto>> Update(long id, [FromBody] CreateClientDto dto)
    {
        var client = await _clientService.UpdateAsync(id, dto);
        if (client == null) return NotFound(new { message = $"Client {id} introuvable" });
        return Ok(client);
    }

    /// <summary>Supprimer un client</summary>
    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await _clientService.DeleteAsync(id);
        if (!result) return NotFound(new { message = $"Client {id} introuvable" });
        return NoContent();
    }
}
