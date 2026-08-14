namespace TiendaApi.Models.DTOs;

public record ItemCarritoRequest(int ProductoId, int Cantidad);

public record CreatePedidoRequest(
    IEnumerable<ItemCarritoRequest>? Items
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
    string? EstadoPago,
    DateTime? FechaPago,
    string? ReferenciaPago,
    string? ClienteNombre = null,
    string? ClienteEmail = null
);

public record PedidoListResponse(
    int Total,
    int Pagina,
    int TamanoPagina,
    IEnumerable<PedidoDto> Items
);

public record PedidoTrendPointDto(
    DateTime Fecha,
    int Pedidos,
    decimal Ingresos
);

public record PedidoDashboardDto(
    int TotalPedidos,
    decimal IngresosTotales,
    int PedidosPendientes,
    int PedidosPagados,
    int PedidosEnviados,
    int PedidosEntregados,
    int PedidosCancelados,
    IEnumerable<PedidoTrendPointDto> VentasPorDia,
    IEnumerable<PedidoDto> UltimosPedidos
);

public record InitPaymentResponse(
    int PedidoId,
    string? RedirectUrl,
    string? Token,
    string Gateway
);

public record UpdateEstadoRequest(string Estado);
