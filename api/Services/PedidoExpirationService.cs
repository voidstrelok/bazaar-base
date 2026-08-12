using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;
using TiendaApi.Services.Payments;

namespace TiendaApi.Services;

/// <summary>
/// Servicio en background que expira pedidos en estado Pendiente que superaron el
/// tiempo de espera configurado, restaurando el stock reservado.
/// </summary>
public class PedidoExpirationService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PedidoExpirationService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(15);

    public PedidoExpirationService(
        IServiceScopeFactory scopeFactory,
        ILogger<PedidoExpirationService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PedidoExpirationService iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ExpireOldOrdersAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error al expirar pedidos pendientes.");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }
    }

    private async Task ExpireOldOrdersAsync(CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var gateway = scope.ServiceProvider.GetRequiredService<IPaymentGateway>();
        var settlement = scope.ServiceProvider.GetRequiredService<IPaymentSettlementService>();

        var expirationMinutes = config.GetValue<int>("Orders:ExpirationMinutes", 30);
        var cutoff = DateTime.UtcNow.AddMinutes(-expirationMinutes);
        var pendingPaymentExpirationMinutes = config.GetValue<int>(
            "Orders:PendingPaymentExpirationMinutes", 120);
        var pendingPaymentCutoff = DateTime.UtcNow.AddMinutes(-pendingPaymentExpirationMinutes);

        var pedidosExpirados = await db.Pedidos
            .Include(p => p.Pago)
            .Include(p => p.Detalles).ThenInclude(d => d.Producto)
            .Where(p => p.Estado == EstadoPedido.Pendiente && p.FechaCreacion < cutoff)
            .ToListAsync(ct);

        if (pedidosExpirados.Count == 0)
            return;

        foreach (var pedido in pedidosExpirados)
        {
            // Consultar el gateway antes de liberar stock evita cancelar un pago
            // aprobado cuyo webhook llegó tarde. Si Mercado Pago no responde,
            // dejamos el pedido pendiente para que el siguiente ciclo reintente.
            if (pedido.Pago?.Gateway == gateway.GatewayName &&
                !string.IsNullOrWhiteSpace(pedido.Pago.ReferenciaPago))
            {
                var result = await gateway.GetPaymentStatusAsync(pedido.Pago.ReferenciaPago);
                if (!result.Verificado)
                    continue;
                if (result.Aprobado)
                {
                    await settlement.ApplyAsync(result);
                    continue;
                }

                if (result.Pendiente && pedido.FechaCreacion >= pendingPaymentCutoff)
                    continue;

                if (!result.Pendiente)
                {
                    await settlement.ApplyAsync(result);
                    continue;
                }
            }

            pedido.Estado = EstadoPedido.Cancelado;
            foreach (var detalle in pedido.Detalles)
            {
                detalle.Producto.Stock += detalle.Cantidad;
            }
        }

        await db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Se expiraron {Count} pedidos pendientes y se restauró su stock.",
            pedidosExpirados.Count);
    }
}
