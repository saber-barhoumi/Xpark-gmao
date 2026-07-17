using XparkGMAO.Shared.Enums;

namespace IAM.Application.DTOs;

public record ApproveUserDto(long UserId);
public record RejectUserDto(long UserId, string Raison);
public record ChangeRoleDto(long UserId, Role NewRole);
