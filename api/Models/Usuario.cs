namespace TiendaApi.Models;

public class Usuario
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Rol { get; set; } = "CLIENTE"; // CLIENTE | ADMIN
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public bool Activo { get; set; } = true;

    // Navegación
    public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
}
