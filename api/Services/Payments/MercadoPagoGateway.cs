using System.Net.Http.Headers;
using System.Text.Json;
using TiendaApi.Helpers;

namespace TiendaApi.Services.Payments;

public class MercadoPagoGateway : IPaymentGateway
{
    private readonly IConfiguration _config;
    private static readonly HttpClient _httpClient = new();

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

            var payload = new
            {
                external_reference = request.PedidoId.ToString(),
                notification_url = request.UrlWebhook.TrimEnd('/') + "/webhook",
                items = new[]
                {
                    new
                    {
                        title = request.Descripcion,
                        quantity = 1,
                        unit_price = request.Monto,
                        currency_id = "CLP"
                    }
                },
                back_urls = new
                {
                    success = request.UrlRetorno,
                    failure = request.UrlRetorno,
                    pending = request.UrlRetorno
                }
            };

            using var req = new HttpRequestMessage(HttpMethod.Post,
                "https://api.mercadopago.com/checkout/preferences");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            req.Content = JsonContent.Create(payload);

            var response = await _httpClient.SendAsync(req);
            var json = await response.Content.ReadFromJsonAsync<JsonElement>();

            if (!response.IsSuccessStatusCode)
            {
                var errMsg = json.TryGetProperty("message", out var msgEl)
                    ? msgEl.GetString() : response.ReasonPhrase;
                return new PaymentResponse(
                    Success: false,
                    RedirectUrl: null,
                    Token: null,
                    PaymentId: null,
                    ErrorMessage: errMsg
                );
            }

            return new PaymentResponse(
                Success: true,
                RedirectUrl: json.GetProperty("init_point").GetString(),
                Token: null,
                PaymentId: json.GetProperty("id").GetString(),
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
            string eventType = request.Query["type"].ToString();
            string paymentId = request.Query["data.id"].ToString();

            // ContentLength can be null when the sender uses Transfer-Encoding:
            // chunked. Do not use it as a gate, otherwise the JSON notification
            // is silently ignored and paymentId remains empty.
            if (request.Method == HttpMethods.Post && request.Body.CanRead)
            {
                using var reader = new StreamReader(request.Body);
                body = await reader.ReadToEndAsync();
                if (!string.IsNullOrWhiteSpace(body))
                {
                    using var doc = JsonDocument.Parse(body);
                    if (string.IsNullOrWhiteSpace(eventType) && doc.RootElement.TryGetProperty("type", out var typeElement))
                        eventType = typeElement.GetString() ?? string.Empty;
                    if (string.IsNullOrWhiteSpace(paymentId) &&
                        doc.RootElement.TryGetProperty("data", out var dataElement) &&
                        dataElement.TryGetProperty("id", out var idElement))
                        paymentId = idElement.GetString() ?? string.Empty;
                }
            }

            // Browser redirects are not trusted. We use only the payment_id and
            // verify it server-to-server against Mercado Pago.
            if (request.Method == HttpMethods.Get)
            {
                paymentId = request.Query["payment_id"].ToString();
                return await GetPaymentResultAsync(paymentId);
            }

            if (!string.Equals(eventType, "payment", StringComparison.OrdinalIgnoreCase))
                return new WebhookResult(false, false, string.Empty, paymentId, body, Verificado: true);

            if (!WebhookSignatureValidator.Validate(
                    request.Headers["x-signature"].ToString(),
                    request.Headers["x-request-id"].ToString(),
                    paymentId,
                    _config["MercadoPago:WebhookSecret"]))
                return InvalidResult();

            return await GetPaymentResultAsync(paymentId);
        }
        catch
        {
            return InvalidResult();
        }
    }

    private async Task<WebhookResult> GetPaymentResultAsync(string paymentId)
    {
        if (string.IsNullOrWhiteSpace(paymentId))
            return InvalidResult();

        var accessToken = _config["MercadoPago:AccessToken"];
        if (string.IsNullOrWhiteSpace(accessToken))
            return InvalidResult();

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://api.mercadopago.com/v1/payments/{Uri.EscapeDataString(paymentId)}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _httpClient.SendAsync(request);
        // The URL tester sends a synthetic payment id (for example 123456).
        // The notification signature has already been verified at this point;
        // acknowledge a resource that does not exist so Mercado Pago does not
        // report the URL test as unauthorized. There is no order to process.
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            return new WebhookResult(
                Aprobado: false,
                Pendiente: false,
                PedidoId: string.Empty,
                ReferenciaPago: paymentId,
                DatosRaw: "{}",
                Verificado: true);

        if (!response.IsSuccessStatusCode)
            return InvalidResult();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var status = json.TryGetProperty("status", out var statusElement)
            ? statusElement.GetString() ?? string.Empty
            : string.Empty;
        var pedidoId = json.TryGetProperty("external_reference", out var referenceElement)
            ? referenceElement.GetString() ?? string.Empty
            : string.Empty;
        var currency = json.TryGetProperty("currency_id", out var currencyElement)
            ? currencyElement.GetString()
            : null;
        decimal? amount = json.TryGetProperty("transaction_amount", out var amountElement) &&
                          amountElement.TryGetDecimal(out var parsedAmount)
            ? parsedAmount
            : null;

        return new WebhookResult(
            Aprobado: status.Equals("approved", StringComparison.OrdinalIgnoreCase),
            Pendiente: status is "pending" or "in_process",
            PedidoId: pedidoId,
            ReferenciaPago: paymentId,
            DatosRaw: json.GetRawText(),
            Monto: amount,
            Moneda: currency,
            Verificado: true);
    }

    private static WebhookResult InvalidResult() =>
        new(false, false, string.Empty, string.Empty, "{}", Verificado: false);
}
