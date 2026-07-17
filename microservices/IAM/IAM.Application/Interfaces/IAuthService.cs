using IAM.Application.DTOs;

namespace IAM.Application.Interfaces;

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
    Task<AuthResponseDto> VerifyMfaAsync(MfaVerifyRequestDto dto, string ipAddress, string? userAgent);
    Task                  ResendMfaEmailOtpAsync(string mfaToken);
}
