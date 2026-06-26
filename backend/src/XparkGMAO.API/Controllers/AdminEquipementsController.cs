using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Application.Services;

namespace XparkGMAO.API.Controllers
{
    [ApiController]
    [Route("api/admin/equipements")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR")]
    public class AdminEquipementsController : ControllerBase
    {
        private readonly IEquipementsService _service;
        private readonly ILogger<AdminEquipementsController> _logger;

        public AdminEquipementsController(
            IEquipementsService service,
            ILogger<AdminEquipementsController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Recalcule le nombre d'utilisations et les heures d'utilisation 
        /// pour tous les équipements à partir des mouvements réels.
        /// </summary>
        [HttpPost("recalculer-compteurs")]
        public async Task<IActionResult> RecalculerCompteurs()
        {
            try
            {
                var count = await _service.RecalculerCompteursEquipementsAsync();
                return Ok(new
                {
                    message = "Recalcul terminé avec succès",
                    equipementsMisAJour = count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur lors du recalcul des compteurs");
                return StatusCode(500, new { message = "Une erreur est survenue lors du recalcul" });
            }
        }
    }
}
