using MercadoPago;

namespace TiendaApi.Services.Payments;

public class MercadoPagoGateway : IPaymentGateway
{
    private readonly IConfiguration _config;

    public MercadoPagoGateway(IConfiguration config)
    {
        _config = config;
    }

    public string GatewayName => "mercadopago";

    public async Task<PaymentResponse> CreatePaymentAsync(PaymentRequest request)
    {
        try
        {
            var accessToken = _config["MercadoPago:AccessToken"]
                ?? throw new InvalidOperationException("MercadoPago:AccessToken no configurado.");

            var preference = new CheckoutPreference
            {
                external_reference = request.PedidoId.ToString(),
                back_urls = new CheckoutPreferenceBackUrl
                {
                    success = request.UrlRetorno + (request.UrlRetorno.Contains('?') ? "&" : "?") + "estado=aprobado",
                    failure = request.UrlRetorno + (request.UrlRetorno.Contains('?') ? "&" : "?") + "estado=rechazado",
                    pending = request.UrlRetorno + (request.UrlRetorno.Contains('?') ? "&" : "?") + "estado=pendiente",
                },
            };

            preference.AddItem(new CheckoutPreferenceItem
            {
                title = request.Descripcion,
                quantity = 1,
                unit_price = request.Monto,
                currency_id = "CLP",
            });

            var service = new CheckoutService();
            var result = await Task.Run(() =>
                service.create_checkout_preference(preference, accessToken));

            return new PaymentResponse(
                Success: true,
                RedirectUrl: result.init_point,
                Token: null,
                PaymentId: result.id,
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
        try
        {
            string body = string.Empty;
            if (request.ContentLength > 0)
            {
                using var reader = new StreamReader(request.Body);
                body = await reader.ReadToEndAsync();
            }

            var type = request.Query["type"].ToString();
            var dataId = request.Query["data.id"].ToString();
            var externalRef = request.Query["external_reference"].ToString();

            if (string.IsNullOrEmpty(dataId) && !string.IsNullOrEmpty(body))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(body);
                    if (doc.RootElement.TryGetProperty("data", out var dataEl)
                        && dataEl.TryGetProperty("id", out var idEl))
                        dataId = idEl.GetString() ?? string.Empty;
                    if (string.IsNullOrEmpty(externalRef)
                        && doc.RootElement.TryGetProperty("external_reference", out var extEl))
                        externalRef = extEl.GetString() ?? string.Empty;
                }
                catch { }
            }

            var aprobado = type == "payment" && !string.IsNullOrEmpty(dataId);

            return new WebhookResult(
                Aprobado: aprobado,
                PedidoId: externalRef,
                ReferenciaPago: dataId,
                DatosRaw: string.IsNullOrEmpty(body) ? "{}" : body
            );
        }
        catch
        {
            return new WebhookResult(
                Aprobado: false,
                PedidoId: string.Empty,
                ReferenciaPago: string.Empty,
                DatosRaw: "{}"
            );
        }
    }
}
