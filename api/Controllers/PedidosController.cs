using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TiendaApi.Models;
using TiendaApi.Models.DTOs;
using TiendaApi.Services;

namespace TiendaApi.Controllers;

[ApiController]
[Route("api/pedidos")]
public class PedidosController : ControllerBase
{
    private readonly IPedidoService _pedidoService;

    public PedidosController(IPedidoService pedidoService)
    {
        _pedidoService = pedidoService;
    }

    private int GetUsuarioId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("Usuario no identificado."));

    // POST api/pedidos
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreatePedidoRequest request)
    {
        try
        {
            var usuarioId = GetUsuarioId();
            var result = await _pedidoService.CreatePedidoAsync(request, usuarioId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET api/pedidos/mis-pedidos
    [HttpGet("mis-pedidos")]
    [Authorize]
    public async Task<IActionResult> GetMisPedidos()
    {
        var usuarioId = GetUsuarioId();
        var pedidos = await _pedidoService.GetMisPedidosAsync(usuarioId);
        return Ok(pedidos);
    }

    // GET api/pedidos/{id}
    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var usuarioId = GetUsuarioId();
            var pedido = await _pedidoService.GetPedidoAsync(id, usuarioId);
            return Ok(pedido);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // GET api/pedidos/admin
    [HttpGet("admin")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> GetAll([FromQuery] int pagina = 1, [FromQuery] int tamano = 20)
    {
        var pedidos = await _pedidoService.GetAllPedidosAsync(pagina, tamano);
        return Ok(pedidos);
    }

    // PUT api/pedidos/admin/{id}/estado
    [HttpPut("admin/{id:int}/estado")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> UpdateEstado(int id, [FromBody] UpdateEstadoRequest request)
    {
        try
        {
            if (!Enum.TryParse<EstadoPedido>(request.Estado, ignoreCase: true, out var estado))
                return BadRequest(new { message = "Estado inválido." });

            await _pedidoService.UpdateEstadoAsync(id, estado);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
