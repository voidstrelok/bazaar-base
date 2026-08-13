namespace TiendaApi.Services;

public interface IEmailService
{
    Task<bool> SendOtpAsync(string email, string nombre, string code);
    Task<bool> SendOrderConfirmationAsync(OrderEmailPayload payload);
    Task<bool> SendNewPaidOrderNotificationAsync(OrderEmailPayload payload);
}
