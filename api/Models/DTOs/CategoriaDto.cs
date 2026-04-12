namespace TiendaApi.Models.DTOs;

public record CategoriaDto(int Id, string Nombre, string Slug, string? Descripcion, string? ImagenUrl, bool Activo);
public record CreateCategoriaRequest(string Nombre, string? Descripcion);
public record UpdateCategoriaRequest(string Nombre, string? Descripcion, bool Activo);
