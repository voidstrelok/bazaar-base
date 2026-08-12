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
    private readonly IEmailService _emailService;
    private readonly IPaymentGateway _gateway;

    public PaymentSettlementService(AppDbContext db, IEmailService emailService, IPaymentGateway gateway)
    {
        _db = db;
        _emailService = emailService;
        _gateway = gateway;
    }

    public async Task ApplyAsync(WebhookResult result)
    {
        if (!result.Verificado || string.IsNullOrWhiteSpace(result.PedidoId) ||
            !int.TryParse(result.PedidoId, out var pedidoId))
            return;

        Pedido? pedido = null;
        var enviarConfirmacion = false;
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
                enviarConfirmacion = true;
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

        if (enviarConfirmacion && pedido?.Usuario is not null)
            await _emailService.SendOrderConfirmationAsync(
                pedido.Usuario.Email, pedido.Usuario.Nombre, pedido.Id, pedido.Total);
    }
}
