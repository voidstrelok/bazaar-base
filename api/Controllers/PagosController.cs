using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;
using TiendaApi.Services;
using TiendaApi.Services.Payments;

namespace TiendaApi.Controllers;

[ApiController]
[Route("api/payments")]
public class PagosController : ControllerBase
{
    private readonly IPaymentGateway _gateway;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;
    private readonly ILogger<PagosController> _logger;

    public PagosController(IPaymentGateway gateway, AppDbContext db, IConfiguration config, IEmailService emailService, ILogger<PagosController> logger)
    {
        _gateway = gateway;
        _db = db;
        _config = config;
        _emailService = emailService;
        _logger = logger;
    }

    // POST api/payments/webhook — público, sin autenticación
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var result = await _gateway.ProcessWebhookAsync(Request);
        if (!result.Verificado)
            return _gateway.GatewayName == "mercadopago" ? Unauthorized() : BadRequest();

        try
        {
            await ProcessPaymentResult(result);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando webhook de {Gateway}.", _gateway.GatewayName);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    // GET api/payments/retorno — redirect de Transbank (token_ws en query)
    [HttpGet("retorno")]
    public async Task<IActionResult> Retorno()
    {
        string estado = "rechazado";
        string pedidoIdStr = string.Empty;

        try
        {
            var result = await _gateway.ProcessWebhookAsync(Request);
            if (result.Verificado)
                await ProcessPaymentResult(result);

            pedidoIdStr = result.PedidoId;
            estado = result.Aprobado ? "aprobado" : result.Pendiente ? "pendiente" : "rechazado";

        }
        catch
        {
            // fall through to redirect with error state
        }

        var allowedBase = _config["Frontend:BaseUrl"];
        var redirectBase = ResolveRetornoUrl(allowedBase);
        var separator = redirectBase.Contains('?') ? "&" : "?";
        return Redirect($"{redirectBase}{separator}estado={estado}&pedidoId={pedidoIdStr}");
    }

    private static string ResolveRetornoUrl(string? allowedBase)
    {
        if (!string.IsNullOrEmpty(allowedBase))
            return allowedBase.TrimEnd('/') + "/pago/resultado";

        return "/pago/resultado";
    }

    private async Task ProcessPaymentResult(WebhookResult result)
    {
        if (!result.Verificado)
            return;
        if (string.IsNullOrEmpty(result.PedidoId) ||
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

        if (pedido is null) return;

        if (!string.Equals(pedido.Gateway, _gateway.GatewayName, StringComparison.OrdinalIgnoreCase))
            return;

        if (result.Monto.HasValue && result.Monto.Value != pedido.Total)
            throw new InvalidOperationException($"El monto del pago {result.Monto.Value} no coincide con el pedido {pedido.Total}.");

        if (!string.IsNullOrWhiteSpace(result.Moneda) &&
            !result.Moneda.Equals("CLP", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("La moneda del pago no es CLP.");

        // Idempotencia: no sobreescribir un estado terminal para evitar race conditions
        // entre el redirect back_url y la notificación webhook server-side.
        if (pedido.Estado != EstadoPedido.Pendiente)
            return;

        // Pagos pendientes (efectivo offline): el stock ya está reservado,
        // el pedido queda en Pendiente hasta que llegue la notificación webhook.
        if (result.Pendiente)
            return;

        var pago = pedido.Pago;
        if (pago is null)
            throw new InvalidOperationException("El pedido no tiene registro de pago.");

        enviarConfirmacion = result.Aprobado;

        if (result.Aprobado)
        {
            pedido.Estado = EstadoPedido.Pagado;
            pago.Estado = EstadoPago.Aprobado;
            pago.ReferenciaPago = result.ReferenciaPago;
            pago.DatosRespuesta = result.DatosRaw;
            pago.FechaPago = DateTime.UtcNow;

        }
        else
        {
            pedido.Estado = EstadoPedido.Cancelado;
            pago.Estado = EstadoPago.Rechazado;
            pago.DatosRespuesta = result.DatosRaw;

            // Restaurar stock
            foreach (var detalle in pedido.Detalles)
            {
                detalle.Producto.Stock += detalle.Cantidad;
            }
        }

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();
        });

        if (pedido is null || !enviarConfirmacion)
            return;

        if (pedido.Usuario is not null)
        {
            await _emailService.SendOrderConfirmationAsync(
                pedido.Usuario.Email,
                pedido.Usuario.Nombre,
                pedido.Id,
                pedido.Total);
        }
    }
}
