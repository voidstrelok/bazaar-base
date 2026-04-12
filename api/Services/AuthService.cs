using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;
using TiendaApi.Models.DTOs;

namespace TiendaApi.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext db, ITokenService tokenService, IConfiguration configuration)
    {
        _db = db;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Usuarios.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("El email ya está registrado.");

        var refreshToken = _tokenService.GenerateRefreshToken();
        var expiryDays = int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7");

        var usuario = new Usuario
        {
            Nombre = request.Nombre,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Rol = "CLIENTE",
            RefreshToken = BCrypt.Net.BCrypt.HashPassword(refreshToken),
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(expiryDays)
        };

        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();

        var accessToken = _tokenService.GenerateAccessToken(usuario);
        var expiry = DateTime.UtcNow.AddMinutes(
            int.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "60"));

        return new AuthResponse(accessToken, refreshToken, expiry,
            usuario.Nombre, usuario.Email, usuario.Rol);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email)
            ?? throw new InvalidOperationException("Credenciales inválidas.");

        if (!usuario.Activo)
            throw new InvalidOperationException("La cuenta está desactivada.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
            throw new InvalidOperationException("Credenciales inválidas.");

        var refreshToken = _tokenService.GenerateRefreshToken();
        var expiryDays = int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7");

        usuario.RefreshToken = BCrypt.Net.BCrypt.HashPassword(refreshToken);
        usuario.RefreshTokenExpiry = DateTime.UtcNow.AddDays(expiryDays);
        await _db.SaveChangesAsync();

        var accessToken = _tokenService.GenerateAccessToken(usuario);
        var expiry = DateTime.UtcNow.AddMinutes(
            int.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "60"));

        return new AuthResponse(accessToken, refreshToken, expiry,
            usuario.Nombre, usuario.Email, usuario.Rol);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var principal = _tokenService.GetPrincipalFromExpiredToken(request.AccessToken)
            ?? throw new InvalidOperationException("Token de acceso inválido.");

        var emailClaim = principal.FindFirst(System.Security.Claims.ClaimTypes.Email)
            ?? principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)
            ?? throw new InvalidOperationException("Token inválido: falta el claim de email.");

        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == emailClaim.Value)
            ?? throw new InvalidOperationException("Usuario no encontrado.");

        if (usuario.RefreshToken is null ||
            usuario.RefreshTokenExpiry <= DateTime.UtcNow ||
            !BCrypt.Net.BCrypt.Verify(request.RefreshToken, usuario.RefreshToken))
        {
            throw new InvalidOperationException("Refresh token inválido o expirado.");
        }

        var newRefreshToken = _tokenService.GenerateRefreshToken();
        var expiryDays = int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7");

        usuario.RefreshToken = BCrypt.Net.BCrypt.HashPassword(newRefreshToken);
        usuario.RefreshTokenExpiry = DateTime.UtcNow.AddDays(expiryDays);
        await _db.SaveChangesAsync();

        var accessToken = _tokenService.GenerateAccessToken(usuario);
        var expiry = DateTime.UtcNow.AddMinutes(
            int.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "60"));

        return new AuthResponse(accessToken, newRefreshToken, expiry,
            usuario.Nombre, usuario.Email, usuario.Rol);
    }

    public async Task RevokeTokenAsync(string email)
    {
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email)
            ?? throw new InvalidOperationException("Usuario no encontrado.");

        usuario.RefreshToken = null;
        usuario.RefreshTokenExpiry = null;
        await _db.SaveChangesAsync();
    }
}
