namespace TiendaApi.Models;

public enum TipoNotificacionEmail { ConfirmacionCliente, NuevoPedidoPagado }
public enum EstadoNotificacionEmail { Pendiente, Enviada, Fallida }

public class NotificacionEmail
{
    public int Id { get; set; }
    public TipoNotificacionEmail Tipo { get; set; }
    public EstadoNotificacionEmail Estado { get; set; } = EstadoNotificacionEmail.Pendiente;
    public string Destinatario { get; set; } = string.Empty;
    public string Datos { get; set; } = string.Empty;
    public int Intentos { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? ProximoIntento { get; set; }
    public DateTime? FechaEnvio { get; set; }
    public string? UltimoError { get; set; }

    public int PedidoId { get; set; }
    public Pedido Pedido { get; set; } = null!;
}
