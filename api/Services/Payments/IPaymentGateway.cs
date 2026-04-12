namespace TiendaApi.Services.Payments;

public record PaymentRequest(
    int PedidoId,
    decimal Monto,
    string Descripcion,
    string UrlRetorno,
    string UrlWebhook
);

public record PaymentResponse(
    bool Success,
    string? RedirectUrl,
    string? Token,
    string? PaymentId,
    string? ErrorMessage
);

public record WebhookResult(
    bool Aprobado,
    string PedidoId,
    string ReferenciaPago,
    string DatosRaw
);

public interface IPaymentGateway
{
    Task<PaymentResponse> CreatePaymentAsync(PaymentRequest request);
    Task<WebhookResult> ProcessWebhookAsync(HttpRequest request);
    string GatewayName { get; }
}
