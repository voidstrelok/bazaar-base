using Microsoft.AspNetCore.Mvc;
using TiendaApi.Services;
using TiendaApi.Services.Payments;

namespace TiendaApi.Controllers;

[ApiController]
[Route("api/payments")]
public class PagosController : ControllerBase
{
    private readonly IPaymentGateway _gateway;
    private readonly IConfiguration _config;
    private readonly ILogger<PagosController> _logger;
    private readonly IPaymentSettlementService _settlement;

    public PagosController(IPaymentGateway gateway, IConfiguration config, ILogger<PagosController> logger, IPaymentSettlementService settlement)
    {
        _gateway = gateway;
        _config = config;
        _logger = logger;
        _settlement = settlement;
    }

    // POST api/payments/webhook - publico, sin autenticacion.
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var result = await _gateway.ProcessWebhookAsync(Request);
        if (!result.Verificado)
            return _gateway.GatewayName == "mercadopago" ? Unauthorized() : BadRequest();

        try
        {
            await _settlement.ApplyAsync(result);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando webhook de {Gateway}.", _gateway.GatewayName);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    // GET api/payments/retorno - redirect de Transbank o Mercado Pago.
    [HttpGet("retorno")]
    public async Task<IActionResult> Retorno()
    {
        var estado = "rechazado";
        var pedidoId = string.Empty;
        try
        {
            var result = await _gateway.ProcessWebhookAsync(Request);
            if (result.Verificado)
                await _settlement.ApplyAsync(result);

            pedidoId = result.PedidoId;
            estado = result.Aprobado ? "aprobado" : result.Pendiente ? "pendiente" : "rechazado";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo confirmar el pago durante el retorno del gateway.");
        }

        var redirectBase = ResolveRetornoUrl(_config["Frontend:BaseUrl"]);
        var separator = redirectBase.Contains('?') ? "&" : "?";
        return Redirect($"{redirectBase}{separator}estado={estado}&pedidoId={Uri.EscapeDataString(pedidoId)}");
    }

    private static string ResolveRetornoUrl(string? allowedBase) =>
        string.IsNullOrEmpty(allowedBase) ? "/pago/resultado" : allowedBase.TrimEnd('/') + "/pago/resultado";
}
