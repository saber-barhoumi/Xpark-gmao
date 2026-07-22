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

    /// <summary>Relance le moteur sur tout le parc (idempotent dans la journée).</summary>
    [HttpPost("recalculer")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> Recalculer()
        => Ok(await service.RecalculerAsync());
}
