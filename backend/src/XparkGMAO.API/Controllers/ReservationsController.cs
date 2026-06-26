using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Application.Services;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly ReservationService _reservationService;
    private readonly ILogger<ReservationsController> _logger;

    public ReservationsController(ReservationService reservationService, ILogger<ReservationsController> logger)
    {
        _reservationService = reservationService;
        _logger = logger;
    }

    /// <summary>Obtenir toutes les réservations</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ReservationResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ReservationResponseDto>>> GetAll()
    {
        var reservations = await _reservationService.GetAllAsync();
        return Ok(reservations);
    }

    /// <summary>Obtenir une réservation par ID</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(ReservationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReservationResponseDto>> GetById(long id)
    {
        var reservation = await _reservationService.GetByIdAsync(id);
        if (reservation == null) return NotFound(new { message = $"Réservation {id} introuvable" });
        return Ok(reservation);
    }

    /// <summary>Obtenir les réservations d'un client</summary>
    [HttpGet("client/{clientId:long}")]
    [ProducesResponseType(typeof(IEnumerable<ReservationResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ReservationResponseDto>>> GetByClient(long clientId)
    {
        var reservations = await _reservationService.GetByClientAsync(clientId);
        return Ok(reservations);
    }

    /// <summary>Créer une nouvelle réservation</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ReservationResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ReservationResponseDto>> Create([FromBody] CreateReservationDto dto)
    {
        var reservation = await _reservationService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = reservation.IdReservation }, reservation);
    }

    /// <summary>Confirmer une réservation</summary>
    [HttpPost("{id:long}/confirmer")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Confirmer(long id)
    {
        var result = await _reservationService.ConfirmerAsync(id);
        if (!result) return NotFound(new { message = $"Réservation {id} introuvable" });
        return NoContent();
    }

    /// <summary>Annuler une réservation</summary>
    [HttpPost("{id:long}/annuler")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Annuler(long id)
    {
        var result = await _reservationService.AnnulerAsync(id);
        if (!result) return NotFound(new { message = $"Réservation {id} introuvable" });
        return NoContent();
    }

    /// <summary>Supprimer une réservation</summary>
    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await _reservationService.DeleteAsync(id);
        if (!result) return NotFound(new { message = $"Réservation {id} introuvable" });
        return NoContent();
    }
}
