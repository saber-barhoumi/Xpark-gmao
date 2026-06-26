using IAM.API.DTOs;
using IAM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Shared.Common;

namespace IAM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController(IUserService userService) : ControllerBase
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
    public ActionResult<ApiResponse<object>> UploadAvatar(long id, IFormFile? file) =>
        Ok(ApiResponse<object>.Ok(new { photoUrl = (string?)null }));

    [HttpPut("{id}/profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateProfileById(
        long id, [FromBody] UpdateProfileDto dto)
    {
        var result = await userService.UpdateProfileAsync(id, dto);
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }
}
