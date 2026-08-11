using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Helpers;
using TiendaApi.Models;
using TiendaApi.Models.DTOs;

namespace TiendaApi.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;

    public AuthService(AppDbContext db, ITokenService tokenService, IConfiguration configuration, IEmailService emailService)
    {
        _db = db;
        _tokenService = tokenService;
        _configuration = configuration;
        _emailService = emailService;
    }

    public async Task<RegisterPendingResponse> RegisterAsync(RegisterRequest request)
    {
        ValidateIdentity(request.Nombre, request.Email, request.Password);
        if (!RutHelper.Validar(request.Rut))
            throw new InvalidOperationException("El RUT ingresado no es válido.");

        var email = NormalizeEmail(request.Email);
        var existing = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

        if (existing is not null)
        {
            if (existing.Activo)
                throw new InvalidOperationException("El email ya está registrado.");

            // Cuenta pendiente de confirmación: actualizar datos y reenviar código
            existing.Nombre       = request.Nombre;
            existing.Rut          = request.Rut;
            existing.Email        = email;
            existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }
        else
        {
            existing = new Usuario
            {
                Nombre       = request.Nombre,
                Rut          = request.Rut,
                Email        = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Rol          = "CLIENTE",
                Activo       = false
            };
            _db.Usuarios.Add(existing);
            await _db.SaveChangesAsync();
        }

        var code = System.Security.Cryptography.RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString();
        existing.OtpCode   = BCrypt.Net.BCrypt.HashPassword(code);
        existing.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
        await _db.SaveChangesAsync();

        await _emailService.SendOtpAsync(existing.Email, existing.Nombre, code);

        return new RegisterPendingResponse(
            "Código de confirmación enviado a tu correo.",
            email);
    }

    public async Task<AuthResponse> ConfirmEmailAsync(ConfirmEmailRequest request)
    {
        var email = NormalizeEmail(request.Email);
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == NormalizeEmail(email))
            ?? throw new InvalidOperationException("Código inválido o expirado.");

        if (usuario.Activo)
            throw new InvalidOperationException("La cuenta ya fue confirmada. Puedes iniciar sesión.");

        if (usuario.OtpCode is null ||
            usuario.OtpExpiry is null ||
            usuario.OtpExpiry <= DateTime.UtcNow ||
            !BCrypt.Net.BCrypt.Verify(request.Code, usuario.OtpCode))
        {
            throw new InvalidOperationException("Código inválido o expirado.");
        }

        usuario.Activo    = true;
        usuario.OtpCode   = null;
        usuario.OtpExpiry = null;
        await _db.SaveChangesAsync();

        return await IssueTokensFor(usuario);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var email = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(request.Password))
            throw new InvalidOperationException("Credenciales inválidas.");

        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email)
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
            usuario.Nombre, usuario.Email, usuario.Rol, usuario.EsInvitado);
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

        if (!usuario.Activo)
            throw new InvalidOperationException("La cuenta está desactivada.");

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
            usuario.Nombre, usuario.Email, usuario.Rol, usuario.EsInvitado);
    }

    public async Task RevokeTokenAsync(string email)
    {
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email)
            ?? throw new InvalidOperationException("Usuario no encontrado.");

        usuario.RefreshToken = null;
        usuario.RefreshTokenExpiry = null;
        await _db.SaveChangesAsync();
    }

    public async Task<AuthResponse> GuestRegisterAsync(GuestRegisterRequest request)
    {
        ValidateIdentity(request.Nombre, request.Email, "guest");
        if (!RutHelper.Validar(request.Rut))
            throw new InvalidOperationException("El RUT ingresado no es válido.");

        var email = NormalizeEmail(request.Email);
        var existing = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

        if (existing is not null)
        {
            if (!existing.EsInvitado)
                throw new InvalidOperationException("Ya existe una cuenta registrada con ese correo. Por favor inicia sesión.");

            throw new InvalidOperationException("Este correo ya tiene una sesión de invitado. Inicia sesión con código por correo.");
        }

        var usuario = new Usuario
        {
            Nombre       = request.Nombre,
            Rut          = request.Rut,
            Email        = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
            Rol          = "CLIENTE",
            EsInvitado   = true
        };

        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();

        return await IssueTokensFor(usuario);
    }

    public async Task<bool> SendOtpAsync(string email)
    {
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == NormalizeEmail(email));

        if (usuario is null || !usuario.Activo)
            return false;

        var code = System.Security.Cryptography.RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString();
        usuario.OtpCode   = BCrypt.Net.BCrypt.HashPassword(code);
        usuario.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
        await _db.SaveChangesAsync();

        await _emailService.SendOtpAsync(usuario.Email, usuario.Nombre, code);
        return true;
    }

    public async Task<AuthResponse> VerifyOtpAsync(VerifyOtpRequest request)
    {
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == NormalizeEmail(request.Email))
            ?? throw new InvalidOperationException("Código inválido o expirado.");

        if (!usuario.Activo)
            throw new InvalidOperationException("La cuenta está desactivada.");

        if (usuario.OtpCode is null ||
            usuario.OtpExpiry is null ||
            usuario.OtpExpiry <= DateTime.UtcNow ||
            !BCrypt.Net.BCrypt.Verify(request.Code, usuario.OtpCode))
        {
            throw new InvalidOperationException("Código inválido o expirado.");
        }

        // Limpiar OTP
        usuario.OtpCode   = null;
        usuario.OtpExpiry = null;
        await _db.SaveChangesAsync();

        return await IssueTokensFor(usuario);
    }

    private async Task<AuthResponse> IssueTokensFor(Usuario usuario)
    {
        var refreshToken = _tokenService.GenerateRefreshToken();
        var expiryDays   = int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7");

        usuario.RefreshToken       = BCrypt.Net.BCrypt.HashPassword(refreshToken);
        usuario.RefreshTokenExpiry = DateTime.UtcNow.AddDays(expiryDays);
        await _db.SaveChangesAsync();

        var accessToken = _tokenService.GenerateAccessToken(usuario);
        var expiry      = DateTime.UtcNow.AddMinutes(
            int.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "60"));

        return new AuthResponse(accessToken, refreshToken, expiry,
            usuario.Nombre, usuario.Email, usuario.Rol, usuario.EsInvitado);
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static void ValidateIdentity(string nombre, string email, string password)
    {
        if (string.IsNullOrWhiteSpace(nombre) || nombre.Trim().Length < 2)
            throw new InvalidOperationException("El nombre debe tener al menos 2 caracteres.");
        if (string.IsNullOrWhiteSpace(email) || !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(email))
            throw new InvalidOperationException("El correo electrónico no es válido.");
        if (password != "guest" && password.Length < 8)
            throw new InvalidOperationException("La contraseña debe tener al menos 8 caracteres.");
    }
}
