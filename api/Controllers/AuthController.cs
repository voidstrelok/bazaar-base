using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TiendaApi.Data;
using TiendaApi.Models.DTOs;
using TiendaApi.Services;

namespace TiendaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshTokenRequest request)
    {
        try
        {
            var response = await _authService.RefreshTokenAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("revoke")]
    [Authorize]
    public async Task<IActionResult> Revoke()
    {
        try
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value;

            if (string.IsNullOrEmpty(email))
                return BadRequest(new { message = "No se pudo identificar al usuario." });

            await _authService.RevokeTokenAsync(email);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET api/auth/me — perfil del usuario autenticado
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me([FromServices] AppDbContext db)
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        if (!int.TryParse(idStr, out var userId))
            return Unauthorized();

        var u = await db.Usuarios.FindAsync(userId);
        if (u is null || !u.Activo)
            return Unauthorized();

        return Ok(new UsuarioDto(u.Id, u.Nombre, u.Email, u.Rol, u.Activo, u.FechaCreacion));
    }

    // PUT api/auth/me — actualizar perfil propio
    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateMe([FromServices] AppDbContext db, [FromBody] UpdatePerfilRequest request)
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        if (!int.TryParse(idStr, out var userId))
            return Unauthorized();

        var u = await db.Usuarios.FindAsync(userId);
        if (u is null || !u.Activo)
            return Unauthorized();

        if (!string.IsNullOrWhiteSpace(request.Nombre))
            u.Nombre = request.Nombre.Trim();

        if (!string.IsNullOrWhiteSpace(request.NuevaPassword))
        {
            if (string.IsNullOrWhiteSpace(request.PasswordActual))
                return BadRequest(new { message = "Debes ingresar tu contraseña actual para cambiarla." });

            if (!BCrypt.Net.BCrypt.Verify(request.PasswordActual, u.PasswordHash))
                return BadRequest(new { message = "La contraseña actual es incorrecta." });

            u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NuevaPassword);
        }

        await db.SaveChangesAsync();
        return Ok(new UsuarioDto(u.Id, u.Nombre, u.Email, u.Rol, u.Activo, u.FechaCreacion));
    }
}
