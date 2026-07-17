using IAM.Application.DTOs;

namespace IAM.Application.Interfaces;

public interface IUserService
{
    Task<UserProfileDto>       GetProfileAsync(long userId);
    Task<UserProfileDto>       UpdateProfileAsync(long userId, UpdateProfileDto dto);
    Task                       ChangePasswordAsync(long userId, ChangePasswordDto dto);
    Task<List<UserProfileDto>> GetAllUsersAsync();
    Task                       ApproveUserAsync(long adminId, ApproveUserDto dto);
    Task                       RejectUserAsync(long adminId, RejectUserDto dto);
    Task                       ChangeRoleAsync(long adminId, ChangeRoleDto dto);
    Task                       SuspendUserAsync(long adminId, long userId);
    Task                       DeleteUserAsync(long adminId, long userId);
    Task                       ActivateUserAsync(long adminId, long userId);
}
