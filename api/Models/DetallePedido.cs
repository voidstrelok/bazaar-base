namespace TiendaApi.Models;

public class DetallePedido
{
    public int Id { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    // Snapshot para que el historial y los comprobantes no cambien si el catálogo se edita.
    public string ProductoNombre { get; set; } = string.Empty;

    public int PedidoId { get; set; }
    public Pedido Pedido { get; set; } = null!;

    public int ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;
}
