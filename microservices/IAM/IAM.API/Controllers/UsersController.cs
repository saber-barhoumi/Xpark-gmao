using IAM.Infrastructure.Data;
using IAM.Application.DTOs;
using IAM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Shared.Common;

namespace IAM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController(IUserService userService, IamDbContext db) : ControllerBase
{
    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetProfile()
    {
        var userId = long.Parse(User.FindFirst("userId")!.Value);
        var result = await userService.GetProfileAsync(userId);
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }

    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = long.Parse(User.FindFirst("userId")!.Value);
        var result = await userService.UpdateProfileAsync(userId, dto);
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }

    [HttpPost("change-password")]
    public async Task<ActionResult<ApiResponse<string>>> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = long.Parse(User.FindFirst("userId")!.Value);
        await userService.ChangePasswordAsync(userId, dto);
        return Ok(ApiResponse<string>.Ok("Mot de passe modifié."));
    }

    [HttpGet("{id}/details")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetDetails(long id)
    {
        var result = await userService.GetProfileAsync(id);
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }

    [HttpGet("{id}/stats")]
    public ActionResult<ApiResponse<object>> GetStats(long id) =>
        Ok(ApiResponse<object>.Ok(new
        {
            totalInterventions   = 0,
            interventionsEnCours = 0,
            interventionsMois    = 0,
            tauxResolution       = 0,
            prioritaires         = 0,
            ordresOuverts        = 0,
        }));

    [HttpPost("{id}/upload-avatar")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<object>>> UploadAvatar(long id, IFormFile? file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<object>.Fail("Aucun fichier fourni"));

        var user = await db.Utilisateurs.FindAsync(id);
        if (user == null)
            return NotFound(ApiResponse<object>.Fail("Utilisateur introuvable"));

        var uploadsPath = Path.Combine("/app/wwwroot/uploads/avatars");
        Directory.CreateDirectory(uploadsPath);

        var fileName = $"avatar_{id}_{DateTime.UtcNow.Ticks}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsPath, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream);

        if (!string.IsNullOrEmpty(user.Photo))
        {
            var oldPath = Path.Combine("/app/wwwroot", user.Photo.TrimStart('/'));
            if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
        }

        user.Photo = $"/uploads/avatars/{fileName}";
        await db.SaveChangesAsync();

        return Ok(ApiResponse<object>.Ok(new { photoUrl = user.Photo }));
    }

    [HttpPut("{id}/profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateProfileById(
        long id, [FromBody] UpdateProfileDto dto)
    {
        var result = await userService.UpdateProfileAsync(id, dto);
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }
}
