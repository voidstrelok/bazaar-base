using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;
using TiendaApi.Models.DTOs;
using TiendaApi.Services.Payments;

namespace TiendaApi.Services;

public class PedidoService : IPedidoService
{
    private readonly AppDbContext _db;
    private readonly IPaymentGateway _gateway;
    private readonly IConfiguration _config;

    public PedidoService(AppDbContext db, IPaymentGateway gateway, IConfiguration config)
    {
        _db = db;
        _gateway = gateway;
        _config = config;
    }

    public async Task<InitPaymentResponse> CreatePedidoAsync(CreatePedidoRequest request, int usuarioId)
    {
        var items = request.Items?.ToList() ?? new List<ItemCarritoRequest>();
        if (!items.Any())
            throw new InvalidOperationException("El carrito está vacío.");

        var productoIds = items.Select(i => i.ProductoId).ToList();

        // Carga con AsNoTracking para validación inicial (precio, activo).
        // El decremento real de stock se hace con ExecuteUpdateAsync dentro de la transacción.
        var productos = await _db.Productos
            .AsNoTracking()
            .Where(p => productoIds.Contains(p.Id))
            .ToListAsync();

        foreach (var item in items)
        {
            var producto = productos.FirstOrDefault(p => p.Id == item.ProductoId)
                ?? throw new InvalidOperationException($"Producto {item.ProductoId} no encontrado.");
            if (!producto.Activo)
                throw new InvalidOperationException($"El producto '{producto.Nombre}' no está disponible.");
            if (item.Cantidad <= 0)
                throw new InvalidOperationException($"La cantidad para '{producto.Nombre}' debe ser mayor a cero.");
        }

        var total = items.Sum(i =>
        {
            var p = productos.First(p => p.Id == i.ProductoId);
            return p.Precio * i.Cantidad;
        });

        var gatewayName = _config["Payment:Gateway"] ?? "transbank";

        // ── Transacción atómica: decremento de stock + creación del pedido ────
        Pedido pedido = null!;
        var paymentBaseUrl = _config["PublicBaseUrl"]?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(paymentBaseUrl))
            throw new InvalidOperationException("PublicBaseUrl no está configurado.");

        // La estrategia de reintentos debe envolver la transacción completa.
        var strategy = _db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _db.Database.BeginTransactionAsync();

        // Decrementar stock de cada producto de forma atómica (UPDATE ... WHERE Stock >= cantidad).
        // Si otro hilo ya consumió el stock, rowsAffected == 0 y se lanza excepción.
        foreach (var item in items)
        {
            var nombre = productos.First(p => p.Id == item.ProductoId).Nombre;
            var rowsAffected = await _db.Productos
                .Where(p => p.Id == item.ProductoId && p.Stock >= item.Cantidad)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock - item.Cantidad));

            if (rowsAffected == 0)
                throw new InvalidOperationException($"Stock insuficiente para '{nombre}'.");
        }

        var publicBaseUrl = paymentBaseUrl;
        if (string.IsNullOrWhiteSpace(publicBaseUrl))
            throw new InvalidOperationException("PublicBaseUrl no está configurado.");

        pedido = new Pedido
        {
            Total = total,
            Estado = EstadoPedido.Pendiente,
            Gateway = gatewayName,
            UsuarioId = usuarioId,
            UrlRetorno = $"{publicBaseUrl}/pago/resultado",
            FechaCreacion = DateTime.UtcNow,
        };
        _db.Pedidos.Add(pedido);

        foreach (var item in items)
        {
            var producto = productos.First(p => p.Id == item.ProductoId);
            _db.DetallesPedido.Add(new DetallePedido
            {
                Pedido = pedido,
                ProductoId = item.ProductoId,
                ProductoNombre = producto.Nombre,
                Cantidad = item.Cantidad,
                PrecioUnitario = producto.Precio,
            });
        }

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();
        });

        var paymentRequest = new PaymentRequest(
            PedidoId: pedido.Id,
            Monto: total,
            Descripcion: $"Pedido #{pedido.Id}",
            UrlRetorno: $"{paymentBaseUrl}/api/payments/retorno",
            UrlWebhook: $"{paymentBaseUrl}/api/payments"
        );

        var paymentResponse = await _gateway.CreatePaymentAsync(paymentRequest);

        var pago = new Pago
        {
            PedidoId = pedido.Id,
            Gateway = gatewayName,
            Monto = total,
            Estado = EstadoPago.Pendiente,
            ReferenciaPago = paymentResponse.Token ?? paymentResponse.PaymentId,
        };
        _db.Pagos.Add(pago);
        await _db.SaveChangesAsync();

        if (!paymentResponse.Success)
        {
            // No dejamos stock reservado si Mercado Pago ni siquiera pudo crear
            // la preferencia. El pedido queda cancelado y puede intentarse de nuevo.
            await UpdateEstadoAsync(pedido.Id, EstadoPedido.Cancelado);
            throw new InvalidOperationException(paymentResponse.ErrorMessage ?? "Error al iniciar el pago.");
        }

        return new InitPaymentResponse(
            PedidoId: pedido.Id,
            RedirectUrl: paymentResponse.RedirectUrl,
            Token: paymentResponse.Token,
            Gateway: gatewayName
        );
    }

    public async Task<InitPaymentResponse> RetryPaymentAsync(int pedidoId, int usuarioId)
    {
        var pedido = await _db.Pedidos
            .Include(p => p.Pago)
            .FirstOrDefaultAsync(p => p.Id == pedidoId && p.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Pedido no encontrado.");

        if (pedido.Estado != EstadoPedido.Pendiente || pedido.Pago is null)
            throw new InvalidOperationException("El pedido no admite un nuevo intento de pago.");

        var paymentBaseUrl = _config["PublicBaseUrl"]?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(paymentBaseUrl))
            throw new InvalidOperationException("PublicBaseUrl no está configurado.");

        var response = await _gateway.CreatePaymentAsync(new PaymentRequest(
            pedido.Id,
            pedido.Total,
            $"Pedido #{pedido.Id}",
            $"{paymentBaseUrl}/api/payments/retorno",
            $"{paymentBaseUrl}/api/payments"));

        if (!response.Success)
            throw new InvalidOperationException(response.ErrorMessage ?? "Error al iniciar el pago.");

        pedido.Pago.Estado = EstadoPago.Pendiente;
        pedido.Pago.ReferenciaPago = response.Token ?? response.PaymentId;
        pedido.Pago.DatosRespuesta = null;
        await _db.SaveChangesAsync();

        return new InitPaymentResponse(pedido.Id, response.RedirectUrl, response.Token, _gateway.GatewayName);
    }

    public async Task<PedidoDto> GetPedidoAsync(int pedidoId, int usuarioId)
    {
        var pedido = await _db.Pedidos
            .Include(p => p.Detalles).ThenInclude(d => d.Producto)
            .Include(p => p.Pago)
            .FirstOrDefaultAsync(p => p.Id == pedidoId && p.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Pedido no encontrado.");

        return ToDto(pedido);
    }

    public async Task<IEnumerable<PedidoDto>> GetMisPedidosAsync(int usuarioId)
    {
        var pedidos = await _db.Pedidos
            .Include(p => p.Detalles).ThenInclude(d => d.Producto)
            .Include(p => p.Pago)
            .Where(p => p.UsuarioId == usuarioId)
            .OrderByDescending(p => p.FechaCreacion)
            .ToListAsync();

        return pedidos.Select(ToDto);
    }

    public async Task<PedidoListResponse> GetAllPedidosAsync(int pagina, int tamano)
    {
        var query = _db.Pedidos
            .Include(p => p.Detalles).ThenInclude(d => d.Producto)
            .Include(p => p.Pago)
            .Include(p => p.Usuario)
            .AsQueryable();
        var total = await query.CountAsync();
        var pedidos = await query
            .OrderByDescending(p => p.FechaCreacion)
            .Skip((pagina - 1) * tamano)
            .Take(tamano)
            .ToListAsync();

        return new PedidoListResponse(total, pagina, tamano, pedidos.Select(ToDto));
    }

    public async Task<PedidoDto> GetPedidoAdminAsync(int pedidoId)
    {
        var pedido = await _db.Pedidos
            .Include(p => p.Detalles).ThenInclude(d => d.Producto)
            .Include(p => p.Pago)
            .Include(p => p.Usuario)
            .FirstOrDefaultAsync(p => p.Id == pedidoId)
            ?? throw new KeyNotFoundException("Pedido no encontrado.");

        return ToDto(pedido);
    }

    public async Task<PedidoDashboardDto> GetDashboardAsync()
    {
        var totalPedidos = await _db.Pedidos.CountAsync();
        var ingresosTotales = await _db.Pedidos
            .Where(p => p.Pago != null && p.Pago.Estado == EstadoPago.Aprobado)
            .Select(p => (decimal?)p.Total)
            .SumAsync() ?? 0m;

        var estados = await _db.Pedidos
            .GroupBy(p => p.Estado)
            .Select(group => new { Estado = group.Key, Total = group.Count() })
            .ToDictionaryAsync(item => item.Estado, item => item.Total);

        var desde = DateTime.UtcNow.Date.AddDays(-6);
        var periodo = await _db.Pedidos
            .Include(p => p.Pago)
            .Where(p => p.FechaCreacion >= desde)
            .OrderBy(p => p.FechaCreacion)
            .ToListAsync();

        var ventasPorDia = Enumerable.Range(0, 7)
            .Select(offset =>
            {
                var fecha = desde.AddDays(offset);
                var pedidosDia = periodo.Where(p => p.FechaCreacion.Date == fecha);
                return new PedidoTrendPointDto(
                    fecha,
                    pedidosDia.Count(),
                    pedidosDia
                        .Where(p => p.Pago?.Estado == EstadoPago.Aprobado)
                        .Sum(p => p.Total));
            })
            .ToList();

        var ultimosPedidos = await _db.Pedidos
            .Include(p => p.Detalles).ThenInclude(d => d.Producto)
            .Include(p => p.Pago)
            .Include(p => p.Usuario)
            .OrderByDescending(p => p.FechaCreacion)
            .Take(5)
            .ToListAsync();

        return new PedidoDashboardDto(
            totalPedidos,
            ingresosTotales,
            estados.GetValueOrDefault(EstadoPedido.Pendiente),
            estados.GetValueOrDefault(EstadoPedido.Pagado),
            estados.GetValueOrDefault(EstadoPedido.Enviado),
            estados.GetValueOrDefault(EstadoPedido.Entregado),
            estados.GetValueOrDefault(EstadoPedido.Cancelado),
            ventasPorDia,
            ultimosPedidos.Select(ToDto));
    }

    public async Task UpdateEstadoAsync(int pedidoId, EstadoPedido estado)
    {
        var pedido = await _db.Pedidos
            .Include(p => p.Detalles).ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(p => p.Id == pedidoId)
            ?? throw new KeyNotFoundException("Pedido no encontrado.");

        var estadoAnterior = pedido.Estado;
        pedido.Estado = estado;

        // Restaurar stock si se cancela un pedido que aún tenía stock reservado
        // (Pendiente o Pagado). No restaurar si ya estaba Cancelado o si fue Entregado.
        if (estado == EstadoPedido.Cancelado &&
            estadoAnterior != EstadoPedido.Cancelado &&
            estadoAnterior != EstadoPedido.Entregado)
        {
            foreach (var detalle in pedido.Detalles)
            {
                detalle.Producto.Stock += detalle.Cantidad;
            }
        }

        await _db.SaveChangesAsync();
    }

    private static PedidoDto ToDto(Pedido p) =>
        new PedidoDto(
            Id: p.Id,
            Total: p.Total,
            Estado: p.Estado.ToString(),
            Gateway: p.Gateway,
            FechaCreacion: p.FechaCreacion,
            Detalles: p.Detalles.Select(d => new DetallePedidoDto(
                ProductoId: d.ProductoId,
                ProductoNombre: d.ProductoNombre,
                ImagenUrl: d.Producto.ImagenUrl,
                Cantidad: d.Cantidad,
                PrecioUnitario: d.PrecioUnitario,
                Subtotal: d.PrecioUnitario * d.Cantidad
            )),
            EstadoPago: p.Pago?.Estado.ToString(),
            FechaPago: p.Pago?.FechaPago,
            ReferenciaPago: p.Pago?.ReferenciaPago,
            ClienteNombre: p.Usuario?.Nombre,
            ClienteEmail: p.Usuario?.Email
        );
}
