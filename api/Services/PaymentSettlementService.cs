using System.Data;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;
using TiendaApi.Services.Payments;

namespace TiendaApi.Services;

public interface IPaymentSettlementService
{
    Task ApplyAsync(WebhookResult result);
}

public class PaymentSettlementService : IPaymentSettlementService
{
    private readonly AppDbContext _db;
    private readonly IPaymentGateway _gateway;
    private readonly IConfiguration _config;
    private readonly ILogger<PaymentSettlementService> _logger;

    public PaymentSettlementService(AppDbContext db, IPaymentGateway gateway, IConfiguration config, ILogger<PaymentSettlementService> logger)
    {
        _db = db;
        _gateway = gateway;
        _config = config;
        _logger = logger;
    }

    public async Task ApplyAsync(WebhookResult result)
    {
        if (!result.Verificado || string.IsNullOrWhiteSpace(result.PedidoId) ||
            !int.TryParse(result.PedidoId, out var pedidoId))
            return;

        Pedido? pedido = null;
        var strategy = _db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
            pedido = await _db.Pedidos
                .Include(p => p.Pago)
                .Include(p => p.Detalles).ThenInclude(d => d.Producto)
                .Include(p => p.Usuario)
                .FirstOrDefaultAsync(p => p.Id == pedidoId);

            if (pedido is null || !string.Equals(pedido.Gateway, _gateway.GatewayName, StringComparison.OrdinalIgnoreCase))
                return;

            if (result.Monto.HasValue && result.Monto.Value != pedido.Total)
                throw new InvalidOperationException($"El monto del pago {result.Monto.Value} no coincide con el pedido {pedido.Total}.");
            if (!string.IsNullOrWhiteSpace(result.Moneda) &&
                !result.Moneda.Equals("CLP", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("La moneda del pago no es CLP.");

            if (pedido.Estado != EstadoPedido.Pendiente)
                return;
            if (result.Pendiente)
                return;

            var pago = pedido.Pago ?? throw new InvalidOperationException("El pedido no tiene registro de pago.");
            pago.ReferenciaPago = string.IsNullOrWhiteSpace(result.ReferenciaPago)
                ? pago.ReferenciaPago : result.ReferenciaPago;
            pago.DatosRespuesta = result.DatosRaw;

            if (result.Aprobado)
            {
                pedido.Estado = EstadoPedido.Pagado;
                pago.Estado = EstadoPago.Aprobado;
                pago.FechaPago = DateTime.UtcNow;
                EnqueuePaidOrderNotifications(pedido);
            }
            else
            {
                pedido.Estado = EstadoPedido.Cancelado;
                pago.Estado = EstadoPago.Rechazado;
                foreach (var detalle in pedido.Detalles)
                    detalle.Producto.Stock += detalle.Cantidad;
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
        });

    }

    private void EnqueuePaidOrderNotifications(Pedido pedido)
    {
        var items = pedido.Detalles.Select(d => new OrderEmailItem(
            d.ProductoNombre, d.Cantidad, d.PrecioUnitario, d.PrecioUnitario * d.Cantidad)).ToList();
        var adminBaseUrl = _config["Frontend:BaseUrl"]?.TrimEnd('/');
        var adminUrl = string.IsNullOrWhiteSpace(adminBaseUrl) ? null : $"{adminBaseUrl}/admin/pedidos";

        AddNotification(TipoNotificacionEmail.ConfirmacionCliente, new OrderEmailPayload(
            pedido.Id, pedido.FechaCreacion, pedido.Total, pedido.Gateway,
            pedido.Usuario.Email, pedido.Usuario.Nombre, pedido.Usuario.Email, items,
            pedido.Pago?.ReferenciaPago, adminUrl));

        var sellerEmail = _config["Orders:NotificationEmail"];
        if (string.IsNullOrWhiteSpace(sellerEmail))
        {
            _logger.LogWarning("Orders:NotificationEmail no está configurado; se omitirá el aviso del pedido #{PedidoId} al vendedor.", pedido.Id);
            return;
        }

        AddNotification(TipoNotificacionEmail.NuevoPedidoPagado, new OrderEmailPayload(
            pedido.Id, pedido.FechaCreacion, pedido.Total, pedido.Gateway,
            sellerEmail.Trim(), pedido.Usuario.Nombre, pedido.Usuario.Email, items,
            pedido.Pago?.ReferenciaPago, adminUrl));
    }

    private void AddNotification(TipoNotificacionEmail type, OrderEmailPayload payload) =>
        _db.NotificacionesEmail.Add(new NotificacionEmail
        {
            PedidoId = payload.PedidoId,
            Tipo = type,
            Destinatario = payload.Destinatario,
            Datos = System.Text.Json.JsonSerializer.Serialize(payload),
            FechaCreacion = DateTime.UtcNow,
        });
}
