namespace TiendaApi.Models;

public enum EstadoPedido { Pendiente, Pagado, Enviado, Entregado, Cancelado }

public class Pedido
{
    public int Id { get; set; }
    public decimal Total { get; set; }
    public EstadoPedido Estado { get; set; } = EstadoPedido.Pendiente;
    public string Gateway { get; set; } = string.Empty; // transbank | mercadopago
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public string? UrlRetorno { get; set; }

    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    // Navegación
    public ICollection<DetallePedido> Detalles { get; set; } = new List<DetallePedido>();
    public Pago? Pago { get; set; }
}
