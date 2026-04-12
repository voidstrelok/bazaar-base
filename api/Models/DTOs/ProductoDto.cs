namespace TiendaApi.Models.DTOs;

public record ProductoDto(int Id, string Nombre, string Slug, string? Descripcion, decimal Precio, int Stock, string? ImagenUrl, bool Activo, int CategoriaId, string CategoriaNombre);
public record CreateProductoRequest(string Nombre, string? Descripcion, decimal Precio, int Stock, int CategoriaId);
public record UpdateProductoRequest(string Nombre, string? Descripcion, decimal Precio, int Stock, int CategoriaId, bool Activo);
public record ProductoListResponse(int Total, int Pagina, int TamañoPagina, IEnumerable<ProductoDto> Items);
