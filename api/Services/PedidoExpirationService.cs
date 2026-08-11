using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;

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

        var expirationMinutes = config.GetValue<int>("Orders:ExpirationMinutes", 30);
        var cutoff = DateTime.UtcNow.AddMinutes(-expirationMinutes);

        var pedidosExpirados = await db.Pedidos
            .Include(p => p.Detalles).ThenInclude(d => d.Producto)
            .Where(p => p.Estado == EstadoPedido.Pendiente && p.FechaCreacion < cutoff)
            .ToListAsync(ct);

        if (pedidosExpirados.Count == 0)
            return;

        foreach (var pedido in pedidosExpirados)
        {
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
