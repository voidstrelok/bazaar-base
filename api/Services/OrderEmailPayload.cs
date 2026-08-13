namespace TiendaApi.Services;

public record OrderEmailItem(string Nombre, int Cantidad, decimal PrecioUnitario, decimal Subtotal);

public record OrderEmailPayload(
    int PedidoId,
    DateTime FechaPedido,
    decimal Total,
    string Gateway,
    string Destinatario,
    string ClienteNombre,
    string ClienteEmail,
    IReadOnlyList<OrderEmailItem> Items,
    string? ReferenciaPago,
    string? AdminUrl
);
