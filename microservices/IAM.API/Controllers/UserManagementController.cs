using IAM.API.Data;
using IAM.API.DTOs;
using IAM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Shared.Common;
using XparkGMAO.Shared.Enums;

namespace IAM.API.Controllers;

[Authorize(Roles = "ADMIN,ADMINISTRATEUR")]
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
