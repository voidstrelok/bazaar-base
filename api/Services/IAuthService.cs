using TiendaApi.Models.DTOs;

namespace TiendaApi.Services;

public interface IAuthService
{
    Task<RegisterPendingResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> ConfirmEmailAsync(ConfirmEmailRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request);
    Task RevokeTokenAsync(string email);
    Task<AuthResponse> GuestRegisterAsync(GuestRegisterRequest request);
    Task<bool> SendOtpAsync(string email);
    Task<AuthResponse> VerifyOtpAsync(VerifyOtpRequest request);
}
