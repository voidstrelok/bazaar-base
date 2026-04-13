namespace TiendaApi.Models.DTOs;

public record UsuarioDto(
    int Id,
    string Nombre,
    string Email,
    string Rol,
    bool Activo,
    DateTime FechaCreacion
);

public record UpdateUsuarioRequest(
    string? Nombre,
    string? Rol,
    bool? Activo
);

public record UpdatePerfilRequest(
    string? Nombre,
    string? PasswordActual,
    string? NuevaPassword
);
