namespace TiendaApi.Models;

public enum EstadoPago { Pendiente, Aprobado, Rechazado, Reembolsado }

public class Pago
{
    public int Id { get; set; }
    public string Gateway { get; set; } = string.Empty; // transbank | mercadopago
    public string? ReferenciaPago { get; set; } // ID externo del gateway
    public EstadoPago Estado { get; set; } = EstadoPago.Pendiente;
    public decimal Monto { get; set; }
    public DateTime? FechaPago { get; set; }
    public string? DatosRespuesta { get; set; } // JSON del webhook

    public int PedidoId { get; set; }
    public Pedido Pedido { get; set; } = null!;
}
