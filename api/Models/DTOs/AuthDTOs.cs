namespace TiendaApi.Models.DTOs;

public record RegisterRequest(string Nombre, string Email, string Password);
public record LoginRequest(string Email, string Password);
public record RefreshTokenRequest(string AccessToken, string RefreshToken);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime Expiry,
    string Nombre,
    string Email,
    string Rol
);
