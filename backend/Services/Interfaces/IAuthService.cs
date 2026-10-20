using backend.DTO.Auth;

namespace backend.Service.Interfaces
{
    public interface IAuthService
    {
        Task<long> RegisterAsync(RegisterDto dto);
        Task<JwtResponseDto> LoginAsync(LoginDto dto);
        Task<bool> RevokeRefreshTokenAsync(string refreshToken);
        Task<RefreshTokenResponseDto?> RefreshTokenAsync(string refreshToken);
        Task ForgotPasswordAsync(ForgotPasswordDto dto);
        Task ResetPasswordAsync(ResetPasswordDto dto);
        Task ChangePasswordAsync(long userId, ChangePasswordDto dto, string? currentRefreshToken);
    }
}
