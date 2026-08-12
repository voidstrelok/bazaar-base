using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;
using TiendaApi.Services.Payments;

namespace TiendaApi.Services;

public class PendingPaymentReconciliationService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PendingPaymentReconciliationService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(5);

    public PendingPaymentReconciliationService(
        IServiceScopeFactory scopeFactory,
        ILogger<PendingPaymentReconciliationService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PendingPaymentReconciliationService iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ReconcileAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error reconciliando pagos pendientes.");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task ReconcileAsync(CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var gateway = scope.ServiceProvider.GetRequiredService<IPaymentGateway>();
        var settlement = scope.ServiceProvider.GetRequiredService<IPaymentSettlementService>();

        var pagos = await db.Pagos
            .Include(p => p.Pedido)
            .Where(p => p.Estado == EstadoPago.Pendiente &&
                        p.Pedido.Estado == EstadoPedido.Pendiente &&
                        p.Gateway == gateway.GatewayName &&
                        p.ReferenciaPago != null && p.ReferenciaPago != "")
            .AsNoTracking()
            .ToListAsync(ct);

        foreach (var pago in pagos)
        {
            if (ct.IsCancellationRequested) break;

            var result = await gateway.GetPaymentStatusAsync(pago.ReferenciaPago!);
            if (result.Verificado && !result.Pendiente)
                await settlement.ApplyAsync(result);
        }
    }
}
