namespace TiendaApi.Models.DTOs;

public record ItemCarritoRequest(int ProductoId, int Cantidad);

public record CreatePedidoRequest(
    IEnumerable<ItemCarritoRequest> Items,
    string UrlRetorno,
    string UrlWebhook
);

public record DetallePedidoDto(
    int ProductoId,
    string ProductoNombre,
    string? ImagenUrl,
    int Cantidad,
    decimal PrecioUnitario,
    decimal Subtotal
);

public record PedidoDto(
    int Id,
    decimal Total,
    string Estado,
    string Gateway,
    DateTime FechaCreacion,
    IEnumerable<DetallePedidoDto> Detalles,
    string? EstadoPago
);

public record InitPaymentResponse(
    int PedidoId,
    string? RedirectUrl,
    string? Token,
    string Gateway
);

public record UpdateEstadoRequest(string Estado);
