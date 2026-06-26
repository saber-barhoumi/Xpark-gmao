using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Core.Entities.FrontOffice;
using XparkGMAO.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DevisController : ControllerBase
{
    private readonly IDevisRepository _devisRepository;
    private readonly ILogger<DevisController> _logger;

    public DevisController(IDevisRepository devisRepository, ILogger<DevisController> logger)
    {
        _devisRepository = devisRepository;
        _logger = logger;
    }

    /// <summary>Obtenir tous les devis</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var devis = await _devisRepository.GetAllAsync();
        return Ok(devis);
    }

    /// <summary>Obtenir un devis par ID</summary>
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var devis = await _devisRepository.GetByIdAsync(id);
        if (devis == null) return NotFound(new { message = $"Devis {id} introuvable" });
        return Ok(devis);
    }

    /// <summary>Obtenir les devis d'un client</summary>
    [HttpGet("client/{clientId:long}")]
    public async Task<IActionResult> GetByClient(long clientId)
    {
        var devis = await _devisRepository.GetByClientAsync(clientId);
        return Ok(devis);
    }

    /// <summary>Créer un nouveau devis</summary>
    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Create([FromBody] CreateDevisDto dto)
    {
        var montantTVA = dto.MontantHT * (dto.TauxTVA / 100);
        var devis = new Devis
        {
            NumeroDevis = await _devisRepository.GenerateNumeroDevisAsync(),
            ClientId = dto.ClientId,
            MontantHT = dto.MontantHT,
            MontantTVA = montantTVA,
            MontantTTC = dto.MontantHT + montantTVA,
            Description = dto.Description,
            DateValidite = dto.DateValidite,
            Statut = StatutDevis.BROUILLON,
            DateCreation = DateTime.UtcNow
        };

        var created = await _devisRepository.AddAsync(devis);
        return CreatedAtAction(nameof(GetById), new { id = created.IdDevis }, created);
    }

    /// <summary>Envoyer un devis au client</summary>
    [HttpPost("{id:long}/envoyer")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Envoyer(long id)
    {
        var devis = await _devisRepository.GetByIdAsync(id);
        if (devis == null) return NotFound(new { message = $"Devis {id} introuvable" });

        devis.Statut = StatutDevis.ENVOYE;
        await _devisRepository.UpdateAsync(devis);
        return NoContent();
    }

    /// <summary>Accepter un devis</summary>
    [HttpPost("{id:long}/accepter")]
    public async Task<IActionResult> Accepter(long id)
    {
        var devis = await _devisRepository.GetByIdAsync(id);
        if (devis == null) return NotFound(new { message = $"Devis {id} introuvable" });

        devis.Statut = StatutDevis.ACCEPTE;
        await _devisRepository.UpdateAsync(devis);
        return NoContent();
    }

    /// <summary>Refuser un devis</summary>
    [HttpPost("{id:long}/refuser")]
    public async Task<IActionResult> Refuser(long id)
    {
        var devis = await _devisRepository.GetByIdAsync(id);
        if (devis == null) return NotFound(new { message = $"Devis {id} introuvable" });

        devis.Statut = StatutDevis.REFUSE;
        await _devisRepository.UpdateAsync(devis);
        return NoContent();
    }
}
