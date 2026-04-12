namespace TiendaApi.Services.Payments;

public static class PaymentGatewayFactory
{
    public static void AddPaymentGateway(this IServiceCollection services, IConfiguration config)
    {
        var gateway = config["Payment:Gateway"] ?? "transbank";
        if (gateway == "mercadopago")
            services.AddScoped<IPaymentGateway, MercadoPagoGateway>();
        else
            services.AddScoped<IPaymentGateway, TransbankGateway>();
    }
}
