using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.Security;
using XparkGMAO.Core.Interfaces.Services;
using XparkGMAO.Infrastructure.Data;
using System.Security.Claims;

namespace XparkGMAO.API.Controllers
{
    [ApiController]
    [Route("api/user-management")]
    [Authorize(Roles = "ADMIN")]
    public class UserManagementController : ControllerBase
    {
        private readonly XparkDbContext _context;
        private readonly IEmailService _emailService;

        public UserManagementController(XparkDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        /// <summary>
        /// Liste des utilisateurs en attente d'approbation
        /// </summary>
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingUsers()
        {
            var users = await _context.Utilisateurs
                .Where(u => u.Statut == StatutUtilisateur.EN_ATTENTE)
                .OrderBy(u => u.DateCreation)
                .Select(u => new
                {
                    u.IdUtilisateur,
                    u.Nom,
                    u.Prenom,
                    u.Email,
                    u.Telephone,
                    Role = u.Role.ToString(),
                    u.DateCreation,
                    u.EmailConfirmed
                })
                .ToListAsync();

            return Ok(new { total = users.Count, users });
        }

        /// <summary>
        /// Approuver un utilisateur
        /// </summary>
        [HttpPost("{userId}/approve")]
        public async Task<IActionResult> ApproveUser(long userId, [FromBody] ApproveUserDto dto)
        {
            var user = await _context.Utilisateurs.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            if (user.Statut != StatutUtilisateur.EN_ATTENTE)
                return BadRequest(new { message = "L'utilisateur n'est pas en attente" });

            // Récupérer l'admin qui approuve (Fallback à 0 si non trouvé)
            var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0";
            long.TryParse(adminIdClaim, out long adminId);

            // Approuver
            user.Statut = StatutUtilisateur.ACTIF;
            user.DateApprobation = DateTime.UtcNow;
            user.ApprouvePar = adminId;
            user.EmailConfirmed = true; // Auto-confirm email when approved by an Admin
            
            // Optionnel : Changer le rôle si fourni
            if (dto.Role.HasValue)
            {
                // CRITIQUE : Vérifier que le rôle est valide
                var rolesAssignables = new[] 
                { 
                    Role.GESTIONNAIRE, 
                    Role.TECHNICIEN, 
                    Role.CHAUFFEUR 
                };
                
                if (!rolesAssignables.Contains(dto.Role.Value))
                    return BadRequest(new { message = "Rôle non assignable via cette méthode" });

                user.Role = dto.Role.Value;
            }

            await _context.SaveChangesAsync();

            // Envoyer email de confirmation d'approbation
            await _emailService.SendAccountApprovedAsync(
                user.Email,
                $"{user.Prenom} {user.Nom}",
                user.Role.ToString()
            );

            return Ok(new 
            { 
                message = "Utilisateur approuvé avec succès",
                user = new
                {
                    user.IdUtilisateur,
                    user.Email,
                    Role = user.Role.ToString(),
                    Statut = user.Statut.ToString()
                }
            });
        }

        /// <summary>
        /// Rejeter un utilisateur
        /// </summary>
        [HttpPost("{userId}/reject")]
        public async Task<IActionResult> RejectUser(long userId, [FromBody] RejectUserDto dto)
        {
            var user = await _context.Utilisateurs.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0";
            long.TryParse(adminIdClaim, out long adminId);

            user.Statut = StatutUtilisateur.DESACTIVE;
            user.RaisonRejet = dto.Raison;
            user.DateApprobation = DateTime.UtcNow;
            user.ApprouvePar = adminId;

            await _context.SaveChangesAsync();

            // Envoyer email de rejet
            await _emailService.SendAccountRejectedAsync(
                user.Email,
                $"{user.Prenom} {user.Nom}",
                dto.Raison
            );

            return Ok(new { message = "Utilisateur rejeté avec succès" });
        }

        /// <summary>
        /// Changer le rôle d'un utilisateur (ADMIN seulement)
        /// </summary>
        [HttpPatch("{userId}/role")]
        public async Task<IActionResult> ChangeRole(long userId, [FromBody] ChangeRoleDto dto)
        {
            var user = await _context.Utilisateurs.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "Utilisateur non trouvé" });

            // CRITIQUE : Empêcher de changer son propre rôle
            var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0";
            long.TryParse(currentUserIdClaim, out long currentUserId);
            
            if (userId == currentUserId)
                return BadRequest(new { message = "Vous ne pouvez pas changer votre propre rôle pour éviter de perdre les accès." });

            // CRITIQUE : Ne pas permettre de créer un autre ADMIN facilement
            if (dto.NewRole == Role.ADMIN)
                return BadRequest(new { message = "Contactez spécifiquement le Super-Admin pour éléver un compte au niveau ADMIN." });

            user.Role = dto.NewRole;
            await _context.SaveChangesAsync();

            return Ok(new 
            { 
                message = "Rôle changé avec succès.",
                user = new { user.IdUtilisateur, user.Email, Role = user.Role.ToString() }
            });
        }
    }

    // DTOs
    public class ApproveUserDto
    {
        public Role? Role { get; set; } // Optionnel : changer le rôle lors de l'approbation
    }

    public class RejectUserDto
    {
        public string Raison { get; set; } = string.Empty;
    }

    public class ChangeRoleDto
    {
        public Role NewRole { get; set; }
    }
}
