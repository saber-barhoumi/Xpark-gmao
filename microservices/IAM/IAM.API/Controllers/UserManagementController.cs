using IAM.Infrastructure.Data;
using IAM.Application.DTOs;
using IAM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Shared.Common;
using XparkGMAO.Shared.Enums;

namespace IAM.API.Controllers;

[Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
[ApiController]
[Route("api/user-management")]
public class UserManagementController(IUserService userService, IamDbContext db) : ControllerBase
{
    private long AdminId => long.Parse(User.FindFirst("userId")!.Value);

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<UserProfileDto>>>> GetAll()
    {
        var result = await userService.GetAllUsersAsync();
        return Ok(ApiResponse<List<UserProfileDto>>.Ok(result));
    }

    [HttpGet("pending")]
    public async Task<ActionResult> GetPending()
    {
        var users = await db.Utilisateurs
            .Where(u => u.Statut == StatutUtilisateur.EN_ATTENTE)
            .Select(u => new
            {
                idUtilisateur = u.IdUtilisateur,
                nom           = u.Nom,
                prenom        = u.Prenom,
                email         = u.Email,
                telephone     = u.Telephone,
                role          = u.Role.ToString(),
                dateCreation  = u.DateCreation,
            })
            .ToListAsync();

        return Ok(new { total = users.Count, users });
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult<ApiResponse<string>>> ApproveById(long id)
    {
        await userService.ApproveUserAsync(AdminId, new ApproveUserDto(id));
        return Ok(ApiResponse<string>.Ok("Utilisateur approuvé."));
    }

    [HttpPost("{id}/reject")]
    public async Task<ActionResult<ApiResponse<string>>> RejectById(
        long id, [FromBody] RejectByIdBody body)
    {
        await userService.RejectUserAsync(AdminId, new RejectUserDto(id, body.Raison ?? ""));
        return Ok(ApiResponse<string>.Ok("Utilisateur rejeté."));
    }

    [HttpPost("{id}/role")]
    public async Task<ActionResult<ApiResponse<string>>> ChangeRoleById(
        long id, [FromBody] RoleByIdBody body)
    {
        if (!Enum.TryParse<Role>(body.NewRole, ignoreCase: true, out var role))
            return BadRequest(ApiResponse<string>.Fail("Rôle invalide."));
        await userService.ChangeRoleAsync(AdminId, new ChangeRoleDto(id, role));
        return Ok(ApiResponse<string>.Ok("Rôle modifié."));
    }

    [HttpPost("approve")]
    public async Task<ActionResult<ApiResponse<string>>> Approve([FromBody] ApproveUserDto dto)
    {
        await userService.ApproveUserAsync(AdminId, dto);
        return Ok(ApiResponse<string>.Ok("Utilisateur approuvé."));
    }

    [HttpPost("reject")]
    public async Task<ActionResult<ApiResponse<string>>> Reject([FromBody] RejectUserDto dto)
    {
        await userService.RejectUserAsync(AdminId, dto);
        return Ok(ApiResponse<string>.Ok("Utilisateur rejeté."));
    }

    [HttpPost("change-role")]
    public async Task<ActionResult<ApiResponse<string>>> ChangeRole([FromBody] ChangeRoleDto dto)
    {
        await userService.ChangeRoleAsync(AdminId, dto);
        return Ok(ApiResponse<string>.Ok("Rôle modifié."));
    }

    /// <summary>Met à jour les informations de base d'un compte (nom, prénom, téléphone).</summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateUser(
        long id, [FromBody] UpdateProfileDto dto)
    {
        var updated = await userService.UpdateProfileAsync(id, dto);
        return Ok(ApiResponse<UserProfileDto>.Ok(updated, "Compte mis à jour."));
    }

    /// <summary>Supprime définitivement un compte (impossible sur soi-même ;
    /// 409 si le compte est lié à des données métier — le suspendre à la place).</summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteUser(long id)
    {
        await userService.DeleteUserAsync(AdminId, id);
        return Ok(ApiResponse<string>.Ok("Compte supprimé définitivement."));
    }

    /// <summary>Confirme manuellement l'email d'un compte (utile quand le SMTP
    /// n'a pas pu délivrer le code de confirmation).</summary>
    [HttpPost("{id}/confirm-email")]
    public async Task<ActionResult<ApiResponse<string>>> ConfirmEmailManually(long id)
    {
        var user = await db.Utilisateurs.FindAsync(id);
        if (user is null) return NotFound(ApiResponse<string>.Fail("Utilisateur introuvable."));

        user.EmailConfirmed               = true;
        user.EmailConfirmationToken       = null;
        user.EmailConfirmationTokenExpiry = null;
        if (user.Role == Role.CLIENT && user.Statut == StatutUtilisateur.EN_ATTENTE)
            user.Statut = StatutUtilisateur.ACTIF;
        await db.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok("Email confirmé manuellement."));
    }

    [HttpPost("{id}/suspend")]
    public async Task<ActionResult<ApiResponse<string>>> Suspend(long id)
    {
        await userService.SuspendUserAsync(AdminId, id);
        return Ok(ApiResponse<string>.Ok("Utilisateur suspendu."));
    }

    [HttpPost("{id}/activate")]
    public async Task<ActionResult<ApiResponse<string>>> Activate(long id)
    {
        await userService.ActivateUserAsync(AdminId, id);
        return Ok(ApiResponse<string>.Ok("Utilisateur activé."));
    }
}

public record RejectByIdBody(string? Raison);
public record RoleByIdBody(string NewRole);
