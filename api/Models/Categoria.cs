namespace TiendaApi.Models;

public class Categoria
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? ImagenUrl { get; set; }
    public bool Activo { get; set; } = true;

    // Navegación
    public ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
