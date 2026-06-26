using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Application.Services;
using XparkGMAO.Core.Entities.Dashboard;

namespace XparkGMAO.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class KPIController : ControllerBase
    {
        private readonly IKPIService _kpiService;

        public KPIController(IKPIService kpiService)
        {
            _kpiService = kpiService;
        }

        /// <summary>
        /// Calculer tous les KPIs (à exécuter via job ou manuellement)
        /// </summary>
        [HttpPost("calculer-tous")]
        [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
        public async Task<IActionResult> CalculerTousKPIs()
        {
            var kpis = await _kpiService.CalculerTousKPIsAsync();
            return Ok(new { message = $"{kpis.Count} KPIs calculés avec succès", kpis });
        }

        /// <summary>
        /// Récupérer tous les KPIs par catégorie
        /// </summary>
        [HttpGet("categorie/{categorie}")]
        public async Task<IActionResult> GetKPIsParCategorie(CategorieKPI categorie)
        {
            var kpis = await _kpiService.GetKPIsParCategorieAsync(categorie);
            return Ok(kpis);
        }

        /// <summary>
        /// Récupérer le dernier calcul d'un KPI spécifique
        /// </summary>
        [HttpGet("{codeKPI}")]
        public async Task<IActionResult> GetDernierKPI(string codeKPI)
        {
            var kpi = await _kpiService.GetDernierKPIAsync(codeKPI);
            if (kpi == null)
                return NotFound(new { message = "KPI non trouvé" });

            return Ok(kpi);
        }
    }
}
