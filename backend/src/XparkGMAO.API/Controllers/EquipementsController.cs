using XparkGMAO.Core.DTOs;
using XparkGMAO.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace XparkGMAO.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EquipementsController : ControllerBase
    {
        private readonly IEquipementsService _service;

        public EquipementsController(IEquipementsService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] FilterEquipementsDto filters)
        {
            var result = await _service.GetAllAsync(filters);
            return Ok(result);
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var eq = await _service.GetByIdAsync(id);
            return Ok(eq);
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
        public async Task<IActionResult> Create([FromBody] CreateEquipementDto dto)
        {
            var eq = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = eq.Id }, eq);
        }

        [HttpPut("{id:long}")]
        [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateEquipementDto dto)
        {
            var eq = await _service.UpdateAsync(id, dto);
            return Ok(eq);
        }

        [HttpDelete("{id:long}")]
        [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
        public async Task<IActionResult> Delete(long id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }

        [HttpGet("vehicule/{vehiculeId:long}/verification-mission")]
        public async Task<IActionResult> VerifierAvantMission(long vehiculeId)
        {
            var result = await _service.VerifierEquipementsAvantMissionAsync(vehiculeId);
            return Ok(result);
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> CheckOut([FromBody] CheckOutDto dto)
        {
            var mouvement = await _service.CheckOutAsync(dto);
            return Ok(mouvement);
        }

        [HttpPost("checkin")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInDto dto)
        {
            var mouvement = await _service.CheckInAsync(dto);
            return Ok(mouvement);
        }

        [HttpPost("{id:long}/inspections")]
        [Authorize(Roles = "ADMIN,TECHNICIEN")]
        public async Task<IActionResult> CreerInspection(
            long id,
            [FromBody] InspectionCreateDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !long.TryParse(userIdStr, out long userId))
            {
                return Unauthorized();
            }
            var inspection = await _service.CreerInspectionAsync(id, userId, dto);
            return Ok(inspection);
        }

        [HttpGet("kpis")]
        public async Task<IActionResult> GetKpis()
        {
            var kpis = await _service.GetKpisAsync();
            return Ok(kpis);
        }

        /// <summary>Uploader une image pour un équipement</summary>
        [HttpPost("upload")]
        [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Fichier vide" });

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Format d'image non supporté" });

            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "equipements");
            if (!Directory.Exists(uploadsPath))
                Directory.CreateDirectory(uploadsPath);

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"/uploads/equipements/{fileName}";
            return Ok(new { imageUrl });
        }

        // --- NOTES ---

        [HttpPost("notes")]
        public async Task<IActionResult> AjouterNote([FromBody] CreateNoteEquipementDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!long.TryParse(userIdStr, out long userId)) return Unauthorized();

            var note = await _service.AjouterNoteAsync(dto, userId);
            return Ok(note);
        }

        [HttpPut("notes/{noteId:long}")]
        public async Task<IActionResult> ModifierNote(long noteId, [FromBody] CreateNoteEquipementDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!long.TryParse(userIdStr, out long userId)) return Unauthorized();

            var note = await _service.ModifierNoteAsync(noteId, dto, userId);
            return Ok(note);
        }

        [HttpDelete("notes/{noteId:long}")]
        public async Task<IActionResult> SupprimerNote(long noteId)
        {
            await _service.SupprimerNoteAsync(noteId);
            return NoContent();
        }

        // --- CONTRATS ---

        [HttpPost("contrats")]
        [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
        public async Task<IActionResult> AjouterContrat([FromBody] CreateContratFournisseurDto dto)
        {
            var contrat = await _service.AjouterContratAsync(dto);
            return Ok(contrat);
        }

        [HttpPut("contrats/{contratId:long}")]
        [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
        public async Task<IActionResult> ModifierContrat(long contratId, [FromBody] CreateContratFournisseurDto dto)
        {
            var contrat = await _service.ModifierContratAsync(contratId, dto);
            return Ok(contrat);
        }

        [HttpDelete("contrats/{contratId:long}")]
        [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
        public async Task<IActionResult> SupprimerContrat(long contratId)
        {
            await _service.SupprimerContratAsync(contratId);
            return NoContent();
        }
    }
}
