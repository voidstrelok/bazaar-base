using TiendaApi.Models;

namespace TiendaApi.Services;

public interface ITokenService
{
    string GenerateAccessToken(Usuario usuario);
    string GenerateRefreshToken();
    System.Security.Claims.ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
