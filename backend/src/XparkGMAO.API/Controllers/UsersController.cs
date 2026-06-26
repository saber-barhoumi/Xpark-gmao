using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.GestionMaintenance;
using XparkGMAO.Infrastructure.Data;
using BCrypt.Net;

namespace XparkGMAO.API.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly XparkDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public UsersController(XparkDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        /// <summary>
        /// Récupérer les détails du profil (Téléphone, Photo, Site, Spécialité)
        /// </summary>
        [HttpGet("{id}/details")]
        public async Task<IActionResult> GetProfileDetails(long id)
        {
            var user = await _context.Utilisateurs.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            // Recherche des infos d'employé s'il s'agit d'un technicien/chauffeur
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.NumeroMatricule == $"XPGM-{id:D4}" || e.Telephone == user.Telephone);

            return Ok(new
            {
                user.IdUtilisateur,
                user.Nom,
                user.Prenom,
                user.Email,
                user.Telephone,
                PhotoUrl = user.Photo,
                Role = user.Role.ToString(),
                Site = employee?.Service.ToString() ?? "Siège Principal",
                Specialite = employee?.Specialty?.ToString() ?? user.Role.ToString(),
                Departement = employee?.Service.ToString() ?? "Administration",
                Matricule = employee?.NumeroMatricule ?? $"XPGM-{id:D4}",
                Competences = employee != null ? new[] { "Expertise " + employee.Level } : new[] { "Généraliste" }
            });
        }

        /// <summary>
        /// Uploader une photo de profil
        /// </summary>
        [HttpPost("{id}/upload-avatar")]
        public async Task<IActionResult> UploadAvatar(long id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Aucun fichier fourni" });

            var user = await _context.Utilisateurs.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            try
            {
                // Créer le dossier s'il n'existe pas
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "avatars");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                // Nom unique pour éviter le cache et les collisions
                var fileName = $"avatar_{id}_{DateTime.UtcNow.Ticks}{Path.GetExtension(file.FileName)}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Supprimer l'ancienne photo si elle existe
                if (!string.IsNullOrEmpty(user.Photo))
                {
                    var oldPath = Path.Combine(_environment.WebRootPath, user.Photo.TrimStart('/'));
                    if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
                }

                // Mettre à jour l'URL en DB (URL relative pour le frontend)
                user.Photo = $"/uploads/avatars/{fileName}";
                await _context.SaveChangesAsync();

                return Ok(new { photoUrl = user.Photo });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Erreur serveur: {ex.Message}" });
            }
        }

        /// <summary>
        /// Récupérer les statistiques GMAO d'un utilisateur (technicien)
        /// </summary>
        [HttpGet("{id}/stats")]
        public async Task<IActionResult> GetUserStats(long id)
        {
            // Vérifier que l'utilisateur existe (optionnel mais recommandé pour la robustesse)
            var userExists = await _context.Utilisateurs.AnyAsync(u => u.IdUtilisateur == id);
            if (!userExists)
                return NotFound(new { message = "Utilisateur non trouvé" });

            var stats = new
            {
                TotalInterventions = await _context.Interventions
                    .CountAsync(i => i.TechnicienId == id),

                InterventionsEnCours = await _context.Interventions
                    .CountAsync(i => i.TechnicienId == id
                                  && i.Statut == StatutIntervention.EN_COURS),

                InterventionsMois = await _context.Interventions
                    .CountAsync(i => i.TechnicienId == id
                                  && i.DateCreation.Month == DateTime.Now.Month
                                  && i.DateCreation.Year == DateTime.Now.Year),

                TauxResolution = await CalculerTauxResolutionAsync(id),

                Prioritaires = await _context.Interventions
                    .CountAsync(i => i.TechnicienId == id
                                  && (i.OrdreTravail != null && (i.OrdreTravail.Priorite == PrioriteOrdreTravail.HAUTE || i.OrdreTravail.Priorite == PrioriteOrdreTravail.URGENT))
                                  && i.Statut == StatutIntervention.EN_COURS),

                OrdresOuverts = await _context.OrdresTravail
                    .CountAsync(o => o.TechnicienId == id
                                  && o.Statut != StatutOrdreTravail.TERMINE
                                  && o.Statut != StatutOrdreTravail.ANNULE),
            };

            return Ok(stats);
        }

        private async Task<int> CalculerTauxResolutionAsync(long technicienId)
        {
            var total = await _context.Interventions
                .CountAsync(i => i.TechnicienId == technicienId);

            if (total == 0) return 0;

            var resolues = await _context.Interventions
                .CountAsync(i => i.TechnicienId == technicienId
                              && i.Statut == StatutIntervention.TERMINEE);

            return (int)Math.Round((double)resolues / total * 100);
        }

        /// <summary>
        /// Mettre à jour le profil utilisateur
        /// </summary>
        [HttpPut("{id}/profile")]
        public async Task<IActionResult> UpdateProfile(long id, [FromBody] UserUpdateProfileDto dto)
        {
            var user = await _context.Utilisateurs.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            // Mettre à jour les champs de base
            if (!string.IsNullOrEmpty(dto.Prenom)) user.Prenom = dto.Prenom;
            if (!string.IsNullOrEmpty(dto.Nom)) user.Nom = dto.Nom;
            if (!string.IsNullOrEmpty(dto.Telephone)) user.Telephone = dto.Telephone;

            // Changer le mot de passe si fourni
            if (!string.IsNullOrEmpty(dto.NewPassword))
            {
                if (string.IsNullOrEmpty(dto.CurrentPassword))
                    return BadRequest(new { message = "Le mot de passe actuel est requis." });

                if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.MotDePasse))
                    return BadRequest(new { message = "Mot de passe actuel incorrect." });

                user.MotDePasse = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Profil mis à jour avec succès.",
                user.IdUtilisateur,
                user.Nom,
                user.Prenom,
                user.Email,
                user.Telephone,
                PhotoUrl = user.Photo,
                Role = user.Role.ToString()
            });
        }
    }

    public class UserUpdateProfileDto
    {
        public string? Prenom { get; set; }
        public string? Nom { get; set; }
        public string? Telephone { get; set; }
        public string? Site { get; set; }
        public string? Specialite { get; set; }
        public string? Departement { get; set; }
        public string? Bio { get; set; }
        public string? CurrentPassword { get; set; }
        public string? NewPassword { get; set; }
    }
}
