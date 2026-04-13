namespace TiendaApi.Middleware;

public class CheckoutFeatureMiddleware
{
    private readonly RequestDelegate _next;
    private readonly bool _checkoutEnabled;

    public CheckoutFeatureMiddleware(RequestDelegate next, IConfiguration config)
    {
        _next = next;
        _checkoutEnabled = bool.TryParse(config["Features:EnableCheckout"] ?? "true", out var parsed) ? parsed : true;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!_checkoutEnabled)
        {
            var path = context.Request.Path.Value ?? "";
            var method = context.Request.Method;

            // Bloquear creación de pedidos y pagos
            var isCheckoutPath =
                (path.StartsWith("/api/pedidos", StringComparison.OrdinalIgnoreCase) && method == "POST") ||
                path.StartsWith("/api/payments", StringComparison.OrdinalIgnoreCase);

            if (isCheckoutPath)
            {
                context.Response.StatusCode = 503;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"message\":\"El checkout no está habilitado en esta tienda.\"}");
                return;
            }
        }

        await _next(context);
    }
}
