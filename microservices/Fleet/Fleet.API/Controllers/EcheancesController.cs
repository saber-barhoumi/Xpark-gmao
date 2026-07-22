using Fleet.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleet.API.Controllers;

/// <summary>
/// Échéances de flotte (assurances, visites techniques, cartes grises…).
/// Alimente le calendrier métier du back-office : une seule requête HTTP au
/// lieu d'un appel « documents/vehicule/{id} » par véhicule.
/// </summary>
[ApiController]
[Route("api/echeances")]
[Authorize]
public class EcheancesController(IEcheanceService service) : ControllerBase
{
    /// <summary>GET /api/echeances?start=2026-01-01&amp;end=2026-12-31</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateTime? start, [FromQuery] DateTime? end)
        => Ok(await service.GetEcheancesAsync(start, end));
}
