namespace TiendaApi.Models.DTOs;

public record RegisterRequest(string Nombre, string Rut, string Email, string Password);
public record LoginRequest(string Email, string Password);
public record RefreshTokenRequest(string AccessToken, string RefreshToken);
public record GuestRegisterRequest(string Nombre, string Rut, string Email);
public record OtpRegisterRequest(string Nombre, string Rut, string Email);
public record SendOtpRequest(string Email);
public record VerifyOtpRequest(string Email, string Code);
public record ConfirmEmailRequest(string Email, string Code);
public record RegisterPendingResponse(string Message, string Email);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime Expiry,
    string Nombre,
    string Email,
    string Rol,
    bool EsInvitado
);
