using Transbank.Common;
using Transbank.Webpay.WebpayPlus;

namespace TiendaApi.Services.Payments;

public class TransbankGateway : IPaymentGateway
{
    private readonly IConfiguration _config;

    public TransbankGateway(IConfiguration config)
    {
        _config = config;
    }

    public string GatewayName => "transbank";

    public async Task<PaymentResponse> CreatePaymentAsync(PaymentRequest request)
    {
        try
        {
            var tx = BuildTransaction();
            var buyOrder = $"pedido-{request.PedidoId}";
            var sessionId = $"session-{request.PedidoId}";

            var response = await Task.Run(() =>
                tx.Create(buyOrder, sessionId, request.Monto, request.UrlRetorno));

            return new PaymentResponse(
                Success: true,
                RedirectUrl: response.Url,
                Token: response.Token,
                PaymentId: null,
                ErrorMessage: null
            );
        }
        catch (Exception ex)
        {
            return new PaymentResponse(
                Success: false,
                RedirectUrl: null,
                Token: null,
                PaymentId: null,
                ErrorMessage: ex.Message
            );
        }
    }

    public async Task<WebhookResult> ProcessWebhookAsync(HttpRequest request)
    {
        string token;

        if (request.Method == "GET")
        {
            token = request.Query["token_ws"].ToString();
        }
        else
        {
            var form = await request.ReadFormAsync();
            token = form["token_ws"].ToString();
        }

        if (string.IsNullOrEmpty(token))
        {
            return new WebhookResult(
                Aprobado: false,
                PedidoId: string.Empty,
                ReferenciaPago: string.Empty,
                DatosRaw: "{}"
            );
        }

        var tx = BuildTransaction();
        var commitResponse = await Task.Run(() => tx.Commit(token));

        var aprobado = commitResponse.Status == "AUTHORIZED";
        var pedidoId = commitResponse.BuyOrder?.Replace("pedido-", "") ?? string.Empty;
        var datosRaw = System.Text.Json.JsonSerializer.Serialize(new
        {
            commitResponse.Status,
            commitResponse.BuyOrder,
            commitResponse.Amount,
            commitResponse.ResponseCode,
        });

        return new WebhookResult(
            Aprobado: aprobado,
            PedidoId: pedidoId,
            ReferenciaPago: token,
            DatosRaw: datosRaw
        );
    }

    private Transaction BuildTransaction()
    {
        var commerceCode = _config["Transbank:CommerceCode"]
            ?? IntegrationCommerceCodes.WEBPAY_PLUS;
        var apiKey = _config["Transbank:ApiKey"]
            ?? IntegrationApiKeys.WEBPAY;
        var environment = _config["Transbank:Environment"] ?? "Integration";

        var tx = new Transaction();
        if (environment.Equals("Production", StringComparison.OrdinalIgnoreCase))
            tx.ConfigureForProduction(commerceCode, apiKey);
        else
            tx.ConfigureForIntegration(commerceCode, apiKey);

        return tx;
    }
}
