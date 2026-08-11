namespace TiendaApi.Services;

public interface IEmailService
{
    Task SendOtpAsync(string email, string nombre, string code);
    Task SendOrderConfirmationAsync(string email, string nombre, int pedidoId, decimal total);
}
