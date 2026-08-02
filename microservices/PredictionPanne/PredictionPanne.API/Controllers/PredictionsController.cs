using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PredictionPanne.Application.Interfaces;

namespace PredictionPanne.API.Controllers;

/// <summary>
/// Prédiction de pannes — aide à la décision de maintenance préventive.
///
/// RBAC (rôles réels du système : CLIENT, CHAUFFEUR, TECHNICIEN, GESTIONNAIRE,
/// ADMINISTRATEUR, ADMIN) :
///   • LECTURE  → ADMIN, ADMINISTRATEUR, GESTIONNAIRE, TECHNICIEN
///     le technicien est inclus : c'est lui qui exécute la maintenance prédite.
///   • ÉCRITURE (recalcul) → ADMIN, ADMINISTRATEUR, GESTIONNAIRE
///     le recalcul réécrit les prédictions du jour : c'est un acte de pilotage.
///   • CLIENT et CHAUFFEUR n'ont aucun accès (données internes d'exploitation).
/// </summary>
[ApiController]
[Route("api/predictions")]
[Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE,TECHNICIEN")]
public class PredictionsController(IPredictionService service) : ControllerBase
{
    /// <summary>KPIs, répartitions et classement des véhicules à risque.</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
        => Ok(await service.GetDashboardAsync());

    /// <summary>Santé de tout le parc, du plus dégradé au plus sain.</summary>
    [HttpGet("sante")]
    public async Task<IActionResult> GetSanteFlotte()
        => Ok(await service.GetSanteFlotteAsync());

    /// <summary>Santé détaillée d'un véhicule.</summary>
    [HttpGet("sante/{vehiculeId:long}")]
    public async Task<IActionResult> GetSanteVehicule(long vehiculeId)
    {
        var sante = await service.GetSanteVehiculeAsync(vehiculeId);
        return sante == null
            ? NotFound(new { message = $"Véhicule {vehiculeId} introuvable" })
            : Ok(sante);
    }

    /// <summary>Historique des prédictions d'un véhicule.</summary>
    [HttpGet("historique/{vehiculeId:long}")]
    public async Task<IActionResult> GetHistorique(long vehiculeId, [FromQuery] int limite = 50)
        => Ok(await service.GetHistoriqueAsync(vehiculeId, limite));

    /// <summary>Historique des prédictions de tout le parc (écran d'historique).</summary>
    [HttpGet("historique")]
    public async Task<IActionResult> GetHistoriqueGlobal([FromQuery] int limite = 500)
        => Ok(await service.GetHistoriqueGlobalAsync(limite));

    /// <summary>Supprime une entrée de l'historique des prédictions.</summary>
    [HttpDelete("historique/{id:long}")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> SupprimerPrediction(long id)
        => await service.SupprimerAsync(id)
            ? NoContent()
            : NotFound(new { message = $"Prédiction {id} introuvable" });

    /// <summary>
    /// Supprime plusieurs entrées. Corps vide ou liste vide = purge complète
    /// de l'historique (les prédictions sont recalculables à tout moment).
    /// </summary>
    [HttpPost("historique/supprimer")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> SupprimerLot([FromBody] SupprimerPredictionsRequest? req)
    {
        var n = await service.SupprimerLotAsync(req?.Ids ?? []);
        return Ok(new { supprimes = n });
    }

    /// <summary>Ids à supprimer ; liste vide ou absente = tout l'historique.</summary>
    public record SupprimerPredictionsRequest(List<long>? Ids);

    /// <summary>Relance le moteur sur tout le parc (idempotent dans la journée).</summary>
    [HttpPost("recalculer")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> Recalculer()
        => Ok(await service.RecalculerAsync());
}
