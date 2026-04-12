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
        var items = request.Items.ToList();
        if (!items.Any())
            throw new InvalidOperationException("El carrito está vacío.");

        var productoIds = items.Select(i => i.ProductoId).ToList();
        var productos = await _db.Productos
            .Where(p => productoIds.Contains(p.Id))
            .ToListAsync();

        foreach (var item in items)
        {
            var producto = productos.FirstOrDefault(p => p.Id == item.ProductoId)
                ?? throw new InvalidOperationException($"Producto {item.ProductoId} no encontrado.");
            if (!producto.Activo)
                throw new InvalidOperationException($"El producto '{producto.Nombre}' no está disponible.");
            if (producto.Stock < item.Cantidad)
                throw new InvalidOperationException($"Stock insuficiente para '{producto.Nombre}'.");
        }

        var total = items.Sum(i =>
        {
            var p = productos.First(p => p.Id == i.ProductoId);
            return p.Precio * i.Cantidad;
        });

        var gatewayName = _config["Payment:Gateway"] ?? "transbank";

        var pedido = new Pedido
        {
            Total = total,
            Estado = EstadoPedido.Pendiente,
            Gateway = gatewayName,
            UsuarioId = usuarioId,
            UrlRetorno = request.UrlRetorno,
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
                Cantidad = item.Cantidad,
                PrecioUnitario = producto.Precio,
            });
            producto.Stock -= item.Cantidad;
        }

        await _db.SaveChangesAsync();

        var paymentRequest = new PaymentRequest(
            PedidoId: pedido.Id,
            Monto: total,
            Descripcion: $"Pedido #{pedido.Id}",
            UrlRetorno: $"{request.UrlWebhook.TrimEnd('/')}/retorno",
            UrlWebhook: request.UrlWebhook
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
            throw new InvalidOperationException(paymentResponse.ErrorMessage ?? "Error al iniciar el pago.");

        return new InitPaymentResponse(
            PedidoId: pedido.Id,
            RedirectUrl: paymentResponse.RedirectUrl,
            Token: paymentResponse.Token,
            Gateway: gatewayName
        );
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

    public async Task<IEnumerable<PedidoDto>> GetAllPedidosAsync(int pagina, int tamano)
    {
        var pedidos = await _db.Pedidos
            .Include(p => p.Detalles).ThenInclude(d => d.Producto)
            .Include(p => p.Pago)
            .OrderByDescending(p => p.FechaCreacion)
            .Skip((pagina - 1) * tamano)
            .Take(tamano)
            .ToListAsync();

        return pedidos.Select(ToDto);
    }

    public async Task UpdateEstadoAsync(int pedidoId, EstadoPedido estado)
    {
        var pedido = await _db.Pedidos.FindAsync(pedidoId)
            ?? throw new KeyNotFoundException("Pedido no encontrado.");
        pedido.Estado = estado;
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
                ProductoNombre: d.Producto.Nombre,
                ImagenUrl: d.Producto.ImagenUrl,
                Cantidad: d.Cantidad,
                PrecioUnitario: d.PrecioUnitario,
                Subtotal: d.PrecioUnitario * d.Cantidad
            )),
            EstadoPago: p.Pago?.Estado.ToString()
        );
}
