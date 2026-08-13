using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace TiendaApi.Services;

public class EmailService : IEmailService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<EmailService> logger)
    {
        _httpFactory = httpFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<bool> SendOtpAsync(string email, string nombre, string code)
    {
        var storeName = StoreName;
        return await SendAsync(
            email,
            $"Tu código de acceso - {storeName}",
            $"Hola {nombre},\n\nTu código de acceso es: {code}\n\nEste código es válido por 10 minutos.\n\n- Equipo {storeName}",
            EmailLayout(
                $"Tu código de acceso es {code}", "Acceso seguro", "Tu código está listo", $"Hola, {nombre}",
                "Usa este código para acceder a tu cuenta. Por seguridad, no lo compartas con nadie.",
                $"<div class=\"otp-code\">{Html(code)}</div><p class=\"hint\">Válido por 10 minutos</p>",
                "¿No solicitaste este código? Puedes ignorar este correo.", storeName));
    }

    public async Task<bool> SendOrderConfirmationAsync(OrderEmailPayload payload)
    {
        var storeName = StoreName;
        var total = Money(payload.Total);
        return await SendAsync(
            payload.Destinatario,
            $"Pedido #{payload.PedidoId} confirmado - {storeName}",
            $"Hola {payload.ClienteNombre},\n\nTu pedido #{payload.PedidoId} fue confirmado. Total pagado: {total}.\n\nPuedes revisar el detalle y descargar tu comprobante iniciando sesión.\n\n- Equipo {storeName}",
            EmailLayout(
                $"Tu pedido #{payload.PedidoId} fue confirmado", "Compra confirmada", "Gracias por tu compra", $"Hola, {payload.ClienteNombre}",
                "Recibimos tu pago y ya registramos tu pedido. Conserva esta confirmación como comprobante.",
                OrderSummary(payload),
                "Puedes revisar tus pedidos y descargar el comprobante cuando quieras iniciando sesión con este correo.", storeName));
    }

    public async Task<bool> SendNewPaidOrderNotificationAsync(OrderEmailPayload payload)
    {
        var storeName = StoreName;
        var note = string.IsNullOrWhiteSpace(payload.AdminUrl)
            ? "Revisa el pedido en el panel de administración."
            : $"<a href=\"{HtmlAttribute(payload.AdminUrl)}\">Abrir panel de pedidos</a>";
        return await SendAsync(
            payload.Destinatario,
            $"Nuevo pedido pagado #{payload.PedidoId} - {storeName}",
            $"Nuevo pedido pagado #{payload.PedidoId}.\nCliente: {payload.ClienteNombre} ({payload.ClienteEmail})\nTotal: {Money(payload.Total)}\nGateway: {FriendlyGateway(payload.Gateway)}\n\nRevisa el pedido en el panel de administración.",
            EmailLayout(
                $"Nuevo pedido pagado #{payload.PedidoId}", "Venta confirmada", "Tienes un nuevo pedido pagado", $"Pedido #{payload.PedidoId}",
                $"Cliente: <strong>{Html(payload.ClienteNombre)}</strong><br>Correo: {Html(payload.ClienteEmail)}<br>Pago: {Html(FriendlyGateway(payload.Gateway))}",
                OrderSummary(payload), note, storeName));
    }

    private string StoreName => _config["STORE_NAME"] ?? _config["Resend:FromName"] ?? "Bazaar";

    private static string OrderSummary(OrderEmailPayload payload)
    {
        var rows = string.Join(string.Empty, payload.Items.Select(item =>
            $"<tr><td>{Html(item.Nombre)} × {item.Cantidad}</td><td>{Html(Money(item.Subtotal))}</td></tr>"));
        return $"<table class=\"order-summary\" role=\"presentation\"><tr><td>Pedido</td><td>#{payload.PedidoId}</td></tr>{rows}<tr><td>Total pagado</td><td>{Html(Money(payload.Total))}</td></tr></table>";
    }

    private static string EmailLayout(string preheader, string eyebrow, string title, string greeting, string content, string highlight, string note, string storeName)
    {
        const string styles = """
            body{margin:0;padding:0;background:#f5f3ef;color:#25221e;font-family:Arial,Helvetica,sans-serif}.wrapper{width:100%;padding:36px 12px}.email{max-width:600px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden}.header{padding:28px 40px;background:#1f2933;color:#fff}.body{padding:42px 40px 32px}.eyebrow{color:#b56b2d;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase}h1{font-size:30px;color:#1f2933}p{font-size:16px;line-height:1.6}.highlight{margin:28px 0;padding:22px;border-radius:12px;background:#faf7f2;border:1px solid #eee7de}.otp-code{font-size:32px;font-weight:700;letter-spacing:9px}.order-summary{width:100%;border-collapse:collapse;font-size:15px}.order-summary td{padding:8px 0;color:#625c54}.order-summary td:last-child{color:#1f2933;font-weight:700;text-align:right}.order-summary tr+tr td{border-top:1px solid #e9e3db}.footer{padding:22px 40px 30px;border-top:1px solid #eeeae4;color:#8a837a;font-size:12px;text-align:center}@media screen and (max-width:600px){.wrapper{padding:0}.email{border-radius:0}.header{padding:24px}.body{padding:32px 24px}}
            """;
        return $"<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><style>{styles}</style></head><body><span style=\"display:none!important\">{Html(preheader)}</span><div class=\"wrapper\"><div class=\"email\"><div class=\"header\"><strong>{Html(storeName)}</strong></div><div class=\"body\"><p class=\"eyebrow\">{Html(eyebrow)}</p><h1>{Html(title)}</h1><p><strong>{Html(greeting)}</strong></p><p>{content}</p><div class=\"highlight\">{highlight}</div><p>{note}</p></div><div class=\"footer\">Este es un correo automático de {Html(storeName)}.<br>Por favor, no respondas a este mensaje.</div></div></div></body></html>";
    }

    private async Task<bool> SendAsync(string to, string subject, string text, string html)
    {
        var apiKey = _config["Resend:ApiKey"];
        var fromEmail = _config["Resend:FromEmail"];
        var fromName = _config["Resend:FromName"] ?? "Bazaar";
        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(fromEmail))
        {
            _logger.LogWarning("Resend no configurado; se reintentará el correo a {Email}", to);
            return false;
        }

        try
        {
            var client = _httpFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            var body = new { from = $"{fromName} <{fromEmail}>", to = new[] { to }, subject, text, html };
            var response = await client.PostAsync("https://api.resend.com/emails", new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));
            var responseBody = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Resend error {Status}: {Body}", response.StatusCode, responseBody);
                return false;
            }
            _logger.LogInformation("Resend OK para {Email}: {Body}", to, responseBody);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error de red enviando correo a {Email}", to);
            return false;
        }
    }

    private static string Money(decimal value) => $"${value:N0}";
    private static string Html(string value) => WebUtility.HtmlEncode(value);
    private static string HtmlAttribute(string value) => WebUtility.HtmlEncode(value).Replace("\"", "&quot;", StringComparison.Ordinal);
    private static string FriendlyGateway(string gateway) => gateway.Equals("mercadopago", StringComparison.OrdinalIgnoreCase) ? "Mercado Pago" : "Transbank Webpay";
}
