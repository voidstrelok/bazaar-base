using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;

namespace TiendaApi.Services;

public interface IEmailNotificationDispatcher
{
    Task DispatchDueAsync(CancellationToken cancellationToken = default);
}

public class EmailNotificationDispatcher : IEmailNotificationDispatcher
{
    private const int MaxAttempts = 5;
    private static readonly TimeSpan[] RetryDelays =
        [TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(15), TimeSpan.FromHours(1), TimeSpan.FromHours(4)];

    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly TimeProvider _timeProvider;
    private readonly ILogger<EmailNotificationDispatcher> _logger;

    public EmailNotificationDispatcher(AppDbContext db, IEmailService emailService, TimeProvider timeProvider, ILogger<EmailNotificationDispatcher> logger)
    {
        _db = db;
        _emailService = emailService;
        _timeProvider = timeProvider;
        _logger = logger;
    }

    public async Task DispatchDueAsync(CancellationToken cancellationToken = default)
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var notifications = await _db.NotificacionesEmail
            .Where(n => n.Estado == EstadoNotificacionEmail.Pendiente &&
                        (n.ProximoIntento == null || n.ProximoIntento <= now))
            .OrderBy(n => n.FechaCreacion)
            .Take(25)
            .ToListAsync(cancellationToken);

        foreach (var notification in notifications)
        {
            var sent = false;
            string? error = null;
            try
            {
                var payload = JsonSerializer.Deserialize<OrderEmailPayload>(notification.Datos)
                    ?? throw new InvalidOperationException("La notificación no contiene datos válidos.");
                sent = notification.Tipo == TipoNotificacionEmail.ConfirmacionCliente
                    ? await _emailService.SendOrderConfirmationAsync(payload)
                    : await _emailService.SendNewPaidOrderNotificationAsync(payload);
                if (!sent) error = "El proveedor de correo no aceptó el envío.";
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                error = ex.Message;
                _logger.LogError(ex, "No se pudo enviar la notificación {NotificationId}.", notification.Id);
            }

            if (sent)
            {
                notification.Estado = EstadoNotificacionEmail.Enviada;
                notification.FechaEnvio = now;
                notification.ProximoIntento = null;
                notification.UltimoError = null;
            }
            else
            {
                notification.Intentos++;
                notification.UltimoError = error;
                if (notification.Intentos >= MaxAttempts)
                {
                    notification.Estado = EstadoNotificacionEmail.Fallida;
                    notification.ProximoIntento = null;
                }
                else
                {
                    notification.ProximoIntento = now + RetryDelays[notification.Intentos - 1];
                }
            }
        }

        if (notifications.Count > 0)
            await _db.SaveChangesAsync(cancellationToken);
    }
}
