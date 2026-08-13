using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TiendaApi.Data;
using TiendaApi.Models;
using TiendaApi.Services;
using TiendaApi.Services.Payments;
using Xunit;

namespace TiendaApi.Tests;

public class OrderWorkflowTests
{
    [Fact]
    public void OrderMigrationIsAssociatedWithTheApplicationDbContext()
    {
        var attribute = typeof(TiendaApi.Data.Migrations.AddOrderReceiptsAndNotifications)
            .GetCustomAttributes(typeof(DbContextAttribute), inherit: false)
            .Cast<DbContextAttribute>()
            .SingleOrDefault();

        Assert.NotNull(attribute);
        Assert.Equal(typeof(AppDbContext), attribute!.ContextType);
    }

    [Fact]
    public void ReceiptPdfContainsTheOrderAndNonTaxDisclaimer()
    {
        var pedido = BuildPedido();
        var pdf = OrderReceiptService.SimplePdfDocument.Create(pedido);
        var text = System.Text.Encoding.Latin1.GetString(pdf);

        Assert.StartsWith("%PDF-1.4", text);
        Assert.Contains("COMPROBANTE DE COMPRA", text);
        Assert.Contains("No documento tributario", text);
        Assert.Contains("Pedido #42", text);
        Assert.Contains("Café de especialidad", text);
    }

    [Fact]
    public async Task ApprovedPaymentEnqueuesBuyerAndSellerOnlyOnce()
    {
        await using var db = CreateDb();
        var pedido = BuildPedido();
        db.Pedidos.Add(pedido);
        await db.SaveChangesAsync();

        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Orders:NotificationEmail"] = "ventas@example.com",
            ["Frontend:BaseUrl"] = "https://tienda.example"
        }).Build();
        var service = new PaymentSettlementService(db, new FakeGateway(), configuration, NullLogger<PaymentSettlementService>.Instance);
        var result = new WebhookResult(true, false, pedido.Id.ToString(), "tx-42", "{}", pedido.Total, "CLP", true);

        await service.ApplyAsync(result);
        await service.ApplyAsync(result);

        Assert.Equal(EstadoPedido.Pagado, pedido.Estado);
        Assert.Equal(EstadoPago.Aprobado, pedido.Pago!.Estado);
        Assert.Equal(2, await db.NotificacionesEmail.CountAsync());
        Assert.Contains(await db.NotificacionesEmail.ToListAsync(), n => n.Tipo == TipoNotificacionEmail.ConfirmacionCliente);
        Assert.Contains(await db.NotificacionesEmail.ToListAsync(), n => n.Tipo == TipoNotificacionEmail.NuevoPedidoPagado);
    }

    [Fact]
    public async Task FailedEmailIsRetriedAndEventuallyMarkedFailed()
    {
        await using var db = CreateDb();
        var pedido = BuildPedido();
        db.Pedidos.Add(pedido);
        await db.SaveChangesAsync();
        var payload = new OrderEmailPayload(pedido.Id, pedido.FechaCreacion, pedido.Total, pedido.Gateway,
            "cliente@example.com", pedido.Usuario.Nombre, pedido.Usuario.Email,
            [new OrderEmailItem("Café de especialidad", 1, pedido.Total, pedido.Total)], "tx-42", null);
        db.NotificacionesEmail.Add(new NotificacionEmail
        {
            PedidoId = pedido.Id,
            Tipo = TipoNotificacionEmail.ConfirmacionCliente,
            Destinatario = payload.Destinatario,
            Datos = System.Text.Json.JsonSerializer.Serialize(payload),
        });
        await db.SaveChangesAsync();

        var dispatcher = new EmailNotificationDispatcher(db, new FakeEmailService(false), TimeProvider.System, NullLogger<EmailNotificationDispatcher>.Instance);
        for (var attempt = 0; attempt < 5; attempt++)
        {
            await dispatcher.DispatchDueAsync();
            var notification = await db.NotificacionesEmail.SingleAsync();
            notification.ProximoIntento = DateTime.UtcNow.AddSeconds(-1);
            await db.SaveChangesAsync();
        }

        var failed = await db.NotificacionesEmail.SingleAsync();
        Assert.Equal(EstadoNotificacionEmail.Fallida, failed.Estado);
        Assert.Equal(5, failed.Intentos);
        Assert.False(string.IsNullOrWhiteSpace(failed.UltimoError));
    }

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new AppDbContext(options);
    }

    private static Pedido BuildPedido()
    {
        var product = new Producto { Id = 7, Nombre = "Café de especialidad", Precio = 12990m, Stock = 10, Activo = true };
        var user = new Usuario { Id = 5, Nombre = "Ana Pérez", Email = "ana@example.com", PasswordHash = "x", Activo = true };
        var pedido = new Pedido
        {
            Id = 42, UsuarioId = user.Id, Usuario = user, Total = 12990m, Gateway = "mercadopago",
            Estado = EstadoPedido.Pendiente, FechaCreacion = DateTime.UtcNow,
            Pago = new Pago { Gateway = "mercadopago", Estado = EstadoPago.Pendiente, Monto = 12990m, ReferenciaPago = "preference-42", FechaPago = DateTime.UtcNow }
        };
        pedido.Detalles.Add(new DetallePedido { ProductoId = product.Id, Producto = product, ProductoNombre = product.Nombre, Cantidad = 1, PrecioUnitario = product.Precio });
        return pedido;
    }

    private sealed class FakeGateway : IPaymentGateway
    {
        public string GatewayName => "mercadopago";
        public Task<PaymentResponse> CreatePaymentAsync(PaymentRequest request) => throw new NotSupportedException();
        public Task<WebhookResult> ProcessWebhookAsync(HttpRequest request) => throw new NotSupportedException();
        public Task<WebhookResult> GetPaymentStatusAsync(string paymentId) => throw new NotSupportedException();
    }

    private sealed class FakeEmailService : IEmailService
    {
        private readonly bool _result;
        public FakeEmailService(bool result) => _result = result;
        public Task<bool> SendOtpAsync(string email, string nombre, string code) => Task.FromResult(_result);
        public Task<bool> SendOrderConfirmationAsync(OrderEmailPayload payload) => Task.FromResult(_result);
        public Task<bool> SendNewPaidOrderNotificationAsync(OrderEmailPayload payload) => Task.FromResult(_result);
    }
}
