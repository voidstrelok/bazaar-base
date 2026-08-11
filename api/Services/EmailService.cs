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

    public async Task SendOtpAsync(string email, string nombre, string code)
    {
        var storeName = _config["STORE_NAME"] ?? "la tienda";
        await SendAsync(
            to: email,
            subject: $"Tu código de acceso — {storeName}",
            text: $"""
                Hola {nombre},

                Tu código de acceso es:

                    {code}

                Este código es válido por 10 minutos.
                Si no solicitaste este código, ignora este mensaje.

                — Equipo {storeName}
                """
        );
    }

    public async Task SendOrderConfirmationAsync(string email, string nombre, int pedidoId, decimal total)
    {
        var storeName = _config["STORE_NAME"] ?? "la tienda";
        await SendAsync(
            to: email,
            subject: $"Confirmación de tu pedido #{pedidoId} — {storeName}",
            text: $"""
                Hola {nombre},

                ¡Tu pedido fue confirmado exitosamente!

                Número de pedido : #{pedidoId}
                Total            : ${total:N2}

                Puedes revisar tus pedidos en cualquier momento ingresando al sitio con tu correo.

                ¡Gracias por tu compra!
                — Equipo {storeName}
                """
        );
    }

    private async Task SendAsync(string to, string subject, string text)
    {
        var apiKey    = _config["Resend:ApiKey"];
        var fromEmail = _config["Resend:FromEmail"];
        var fromName  = _config["Resend:FromName"] ?? "Bazaar";

        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(fromEmail))
        {
            _logger.LogWarning("Resend no configurado — omitiendo envío a {Email}", to);
            return;
        }

        var payload = new
        {
            from    = $"{fromName} <{fromEmail}>",
            to      = new[] { to },
            subject,
            text
        };

        var client = _httpFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("https://api.resend.com/emails", content);

        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            _logger.LogError("Resend error {Status}: {Body}", response.StatusCode, responseBody);
        else
            _logger.LogInformation("Resend OK → {Body}", responseBody);
    }
}
