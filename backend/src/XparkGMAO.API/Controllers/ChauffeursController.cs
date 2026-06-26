using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Interfaces.Repositories;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChauffeursController : ControllerBase
{
    private readonly IChauffeurRepository _chauffeurRepository;
    private readonly ILogger<ChauffeursController> _logger;

    public ChauffeursController(IChauffeurRepository chauffeurRepository, ILogger<ChauffeursController> logger)
    {
        _chauffeurRepository = chauffeurRepository;
        _logger = logger;
    }

    /// <summary>Obtenir tous les chauffeurs</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ChauffeurResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ChauffeurResponseDto>>> GetAll()
    {
        var chauffeurs = await _chauffeurRepository.GetAllAsync();
        var result = chauffeurs.Select(c => new ChauffeurResponseDto
        {
            IdUtilisateur = c.IdUtilisateur,
            Nom = c.Nom,
            Prenom = c.Prenom,
            Email = c.Email,
            Telephone = c.Telephone,
            NumeroPermis = c.NumeroPermis,
            CategoriePermis = c.CategoriePermis.ToString(),
            DateExpirationPermis = c.DateExpirationPermis,
            Disponibilite = c.Disponibilite.ToString(),
            Evaluation = c.Evaluation
        });
        return Ok(result);
    }

    /// <summary>Obtenir un chauffeur par ID</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(ChauffeurResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ChauffeurResponseDto>> GetById(long id)
    {
        var chauffeur = await _chauffeurRepository.GetByIdAsync(id);
        if (chauffeur == null) return NotFound(new { message = $"Chauffeur {id} introuvable" });

        var result = new ChauffeurResponseDto
        {
            IdUtilisateur = chauffeur.IdUtilisateur,
            Nom = chauffeur.Nom,
            Prenom = chauffeur.Prenom,
            Email = chauffeur.Email,
            Telephone = chauffeur.Telephone,
            NumeroPermis = chauffeur.NumeroPermis,
            CategoriePermis = chauffeur.CategoriePermis.ToString(),
            DateExpirationPermis = chauffeur.DateExpirationPermis,
            Disponibilite = chauffeur.Disponibilite.ToString(),
            Evaluation = chauffeur.Evaluation
        };
        return Ok(result);
    }

    /// <summary>Obtenir les chauffeurs disponibles</summary>
    [HttpGet("disponibles")]
    [ProducesResponseType(typeof(IEnumerable<ChauffeurResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ChauffeurResponseDto>>> GetDisponibles()
    {
        var chauffeurs = await _chauffeurRepository.GetDisponiblesAsync();
        var result = chauffeurs.Select(c => new ChauffeurResponseDto
        {
            IdUtilisateur = c.IdUtilisateur,
            Nom = c.Nom,
            Prenom = c.Prenom,
            Email = c.Email,
            Telephone = c.Telephone,
            NumeroPermis = c.NumeroPermis,
            CategoriePermis = c.CategoriePermis.ToString(),
            DateExpirationPermis = c.DateExpirationPermis,
            Disponibilite = c.Disponibilite.ToString(),
            Evaluation = c.Evaluation
        });
        return Ok(result);
    }
}
