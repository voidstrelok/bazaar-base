namespace TiendaApi.Services;

public interface IOrderReceiptService
{
    Task<byte[]> CreateReceiptAsync(int pedidoId, int usuarioId);
}
