using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;
using TiendaApi.Models.DTOs;

namespace TiendaApi.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize(Policy = "RequireAdmin")]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsuariosController(AppDbContext db) => _db = db;

    // GET api/usuarios?pagina=1&tamano=20&busqueda=
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pagina = 1,
        [FromQuery] int tamano = 20,
        [FromQuery] string? busqueda = null)
    {
        var query = _db.Usuarios.AsQueryable();

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var lower = busqueda.ToLower();
            query = query.Where(u => u.Nombre.ToLower().Contains(lower) || u.Email.ToLower().Contains(lower));
        }

        var total = await query.CountAsync();
        var usuarios = await query
            .OrderByDescending(u => u.FechaCreacion)
            .Skip((pagina - 1) * tamano)
            .Take(tamano)
            .Select(u => new UsuarioDto(u.Id, u.Nombre, u.Email, u.Rol, u.Activo, u.FechaCreacion))
            .ToListAsync();

        return Ok(new { total, pagina, tamanoPagina = tamano, items = usuarios });
    }

    // GET api/usuarios/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var u = await _db.Usuarios.FindAsync(id);
        if (u is null) return NotFound();
        return Ok(new UsuarioDto(u.Id, u.Nombre, u.Email, u.Rol, u.Activo, u.FechaCreacion));
    }

    // PUT api/usuarios/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUsuarioRequest request)
    {
        var u = await _db.Usuarios.FindAsync(id);
        if (u is null) return NotFound();

        // Validate role if provided
        if (request.Rol is not null && request.Rol != "ADMIN" && request.Rol != "CLIENTE")
            return BadRequest(new { message = "Rol inválido. Los valores permitidos son ADMIN o CLIENTE." });

        // Evitar que el admin se desactive a sí mismo
        var selfId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        if (u.Id == selfId && request.Activo == false)
            return BadRequest(new { message = "No puedes desactivarte a ti mismo." });

        u.Nombre = request.Nombre ?? u.Nombre;
        u.Rol = request.Rol ?? u.Rol;
        u.Activo = request.Activo ?? u.Activo;

        await _db.SaveChangesAsync();
        return Ok(new UsuarioDto(u.Id, u.Nombre, u.Email, u.Rol, u.Activo, u.FechaCreacion));
    }

    // DELETE api/usuarios/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var selfId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        if (id == selfId)
            return BadRequest(new { message = "No puedes eliminar tu propia cuenta." });

        var u = await _db.Usuarios.FindAsync(id);
        if (u is null) return NotFound();

        _db.Usuarios.Remove(u);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
