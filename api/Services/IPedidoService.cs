using TiendaApi.Models;
using TiendaApi.Models.DTOs;

namespace TiendaApi.Services;

public interface IPedidoService
{
    Task<InitPaymentResponse> CreatePedidoAsync(CreatePedidoRequest request, int usuarioId);
    Task<PedidoDto> GetPedidoAsync(int pedidoId, int usuarioId);
    Task<IEnumerable<PedidoDto>> GetMisPedidosAsync(int usuarioId);
    Task<IEnumerable<PedidoDto>> GetAllPedidosAsync(int pagina, int tamano);
    Task UpdateEstadoAsync(int pedidoId, EstadoPedido estado);
}
