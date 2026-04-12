using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;
using TiendaApi.Services.Payments;

namespace TiendaApi.Controllers;

[ApiController]
[Route("api/payments")]
public class PagosController : ControllerBase
{
    private readonly IPaymentGateway _gateway;
    private readonly AppDbContext _db;

    public PagosController(IPaymentGateway gateway, AppDbContext db)
    {
        _gateway = gateway;
        _db = db;
    }

    // POST api/payments/webhook — público, sin autenticación
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        try
        {
            var result = await _gateway.ProcessWebhookAsync(Request);
            await ProcessPaymentResult(result);
        }
        catch
        {
            // Siempre retornar 200 para evitar reintentos del gateway
        }
        return Ok();
    }

    // GET api/payments/retorno — redirect de Transbank (token_ws en query)
    [HttpGet("retorno")]
    public async Task<IActionResult> Retorno()
    {
        string? frontendUrl = null;

        try
        {
            var result = await _gateway.ProcessWebhookAsync(Request);
            await ProcessPaymentResult(result);

            if (!string.IsNullOrEmpty(result.PedidoId) &&
                int.TryParse(result.PedidoId, out var pedidoId))
            {
                var pedido = await _db.Pedidos.FindAsync(pedidoId);
                frontendUrl = pedido?.UrlRetorno;
            }

            var estado = result.Aprobado ? "aprobado" : "rechazado";
            var redirectBase = frontendUrl ?? "/";
            var separator = redirectBase.Contains('?') ? "&" : "?";
            return Redirect($"{redirectBase}{separator}estado={estado}&pedidoId={result.PedidoId}");
        }
        catch
        {
            var redirectBase = frontendUrl ?? "/";
            var separator = redirectBase.Contains('?') ? "&" : "?";
            return Redirect($"{redirectBase}{separator}estado=rechazado");
        }
    }

    private async Task ProcessPaymentResult(WebhookResult result)
    {
        if (string.IsNullOrEmpty(result.PedidoId) ||
            !int.TryParse(result.PedidoId, out var pedidoId))
            return;

        var pedido = await _db.Pedidos
            .Include(p => p.Pago)
            .Include(p => p.Detalles).ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(p => p.Id == pedidoId);

        if (pedido is null) return;

        var pago = pedido.Pago;

        if (result.Aprobado)
        {
            pedido.Estado = EstadoPedido.Pagado;
            if (pago is not null)
            {
                pago.Estado = EstadoPago.Aprobado;
                pago.ReferenciaPago = result.ReferenciaPago;
                pago.DatosRespuesta = result.DatosRaw;
                pago.FechaPago = DateTime.UtcNow;
            }
        }
        else
        {
            pedido.Estado = EstadoPedido.Cancelado;
            if (pago is not null)
            {
                pago.Estado = EstadoPago.Rechazado;
                pago.DatosRespuesta = result.DatosRaw;
            }

            // Restaurar stock
            foreach (var detalle in pedido.Detalles)
            {
                detalle.Producto.Stock += detalle.Cantidad;
            }
        }

        await _db.SaveChangesAsync();
    }
}
