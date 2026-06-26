using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Entities.GestionOperations;
using XparkGMAO.Core.Entities.GestionFinance;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly XparkDbContext _context;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(XparkDbContext context, ILogger<DashboardController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>Obtenir les statistiques du tableau de bord</summary>
    [HttpGet]
    [ProducesResponseType(typeof(DashboardResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardResponseDto>> GetDashboard()
    {
        var now = DateTime.UtcNow;
        var debutMois = new DateTime(now.Year, now.Month, 1);

        var totalVehicules = await _context.Vehicules.CountAsync(v => v.Actif);
        var vehiculesActifs = await _context.Vehicules.CountAsync(v => v.Statut == StatutVehicule.DISPONIBLE);
        var vehiculesEnMaintenance = await _context.Vehicules.CountAsync(v => v.Statut == StatutVehicule.EN_MAINTENANCE);

        var totalMissions = await _context.Missions.CountAsync();
        var missionsEnCours = await _context.Missions.CountAsync(m => m.Statut == StatutMission.EN_COURS);

        var totalChauffeurs = await _context.Chauffeurs.CountAsync(c => c.Actif);
        var chauffeursDisponibles = await _context.Chauffeurs.CountAsync(c => c.Disponibilite == StatutChauffeur.DISPONIBLE);

        var chiffreAffaireMois = await _context.Factures
            .Where(f => f.DateEmission >= debutMois && f.Statut == StatutFacture.PAYEE)
            .SumAsync(f => (double?)f.MontantTTC) ?? 0;

        var alertesActives = await _context.Alertes
            .CountAsync(a => a.Statut == Core.Entities.GestionAlertes.StatutAlerte.ACTIVE);

        var stockFaible = await _context.PiecesRechange
            .CountAsync(p => p.Actif && p.StockActuel <= p.StockMinimum);

        var dashboard = new DashboardResponseDto
        {
            TotalVehicules = totalVehicules,
            VehiculesActifs = vehiculesActifs,
            VehiculesEnMaintenance = vehiculesEnMaintenance,
            TotalMissions = totalMissions,
            MissionsEnCours = missionsEnCours,
            TotalChauffeurs = totalChauffeurs,
            ChauffeursDisponibles = chauffeursDisponibles,
            ChiffreAffaireMois = chiffreAffaireMois,
            AlertesActives = alertesActives,
            StockFaible = stockFaible
        };

        return Ok(dashboard);
    }

    /// <summary>Obtenir les statistiques de la semaine</summary>
    [HttpGet("semaine")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistiquesSemaine()
    {
        var debutSemaine = DateTime.UtcNow.AddDays(-7);

        var missionsCreees = await _context.Missions
            .CountAsync(m => m.DateCreation >= debutSemaine);

        var interventionsCreees = await _context.Interventions
            .CountAsync(i => i.DateCreation >= debutSemaine);

        var facturesEmises = await _context.Factures
            .Where(f => f.DateEmission >= debutSemaine)
            .SumAsync(f => (double?)f.MontantTTC) ?? 0;

        return Ok(new
        {
            MissionsCreees = missionsCreees,
            InterventionsCreees = interventionsCreees,
            ChiffreAffaire = facturesEmises,
            PeriodeDu = debutSemaine,
            PeriodeAu = DateTime.UtcNow
        });
    }
}
