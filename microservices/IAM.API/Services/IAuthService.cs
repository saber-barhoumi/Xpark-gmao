using IAM.API.DTOs;

namespace IAM.API.Services;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto dto, string ipAddress);
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto);
    Task                  LogoutAsync(long userId);
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
    Task                  ConfirmEmailAsync(ConfirmEmailDto dto);
    Task                  RecoverPasswordAsync(RecoverPasswordDto dto);
    Task                  ResetPasswordAsync(ResetPasswordDto dto);
    Task                  SetPinAsync(long userId, SetPinDto dto);
    Task<AuthResponseDto> LoginPinAsync(LoginPinDto dto);
    Task<AuthResponseDto> UnlockSessionAsync(long userId, UnlockSessionDto dto);
}
