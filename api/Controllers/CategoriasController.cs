using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Helpers;
using TiendaApi.Models;
using TiendaApi.Models.DTOs;
using TiendaApi.Services.Storage;

namespace TiendaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriasController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IStorageService _storage;

    public CategoriasController(AppDbContext db, IStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    // GET api/categorias
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categorias = await _db.Categorias
            .Where(c => c.Activo)
            .OrderBy(c => c.Nombre)
            .Select(c => new CategoriaDto(c.Id, c.Nombre, c.Slug, c.Descripcion, c.ImagenUrl, c.Activo))
            .ToListAsync();

        return Ok(categorias);
    }

    // GET api/categorias/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var c = await _db.Categorias.FindAsync(id);
        if (c is null) return NotFound();

        return Ok(new CategoriaDto(c.Id, c.Nombre, c.Slug, c.Descripcion, c.ImagenUrl, c.Activo));
    }

    // POST api/categorias
    [HttpPost]
    [Authorize(Policy = "RequireAdmin")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] CreateCategoriaRequest request, IFormFile? imagen)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return BadRequest(new { message = "El nombre es requerido." });

        var slug = SlugHelper.Generate(request.Nombre);

        if (await _db.Categorias.AnyAsync(c => c.Slug == slug))
            return Conflict(new { message = "Ya existe una categoría con ese nombre." });

        string? imagenUrl = null;
        if (imagen is not null)
            imagenUrl = await _storage.UploadAsync(imagen, "categorias");

        var categoria = new Categoria
        {
            Nombre = request.Nombre,
            Slug = slug,
            Descripcion = request.Descripcion,
            ImagenUrl = imagenUrl
        };

        _db.Categorias.Add(categoria);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = categoria.Id },
            new CategoriaDto(categoria.Id, categoria.Nombre, categoria.Slug,
                categoria.Descripcion, categoria.ImagenUrl, categoria.Activo));
    }

    // PUT api/categorias/{id}
    [HttpPut("{id:int}")]
    [Authorize(Policy = "RequireAdmin")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Update(int id, [FromForm] UpdateCategoriaRequest request, IFormFile? imagen)
    {
        var categoria = await _db.Categorias.FindAsync(id);
        if (categoria is null) return NotFound();

        if (string.IsNullOrWhiteSpace(request.Nombre))
            return BadRequest(new { message = "El nombre es requerido." });

        var slug = SlugHelper.Generate(request.Nombre);

        if (await _db.Categorias.AnyAsync(c => c.Slug == slug && c.Id != id))
            return Conflict(new { message = "Ya existe una categoría con ese nombre." });

        if (imagen is not null)
        {
            if (!string.IsNullOrWhiteSpace(categoria.ImagenUrl))
                await _storage.DeleteAsync(categoria.ImagenUrl);

            categoria.ImagenUrl = await _storage.UploadAsync(imagen, "categorias");
        }

        categoria.Nombre = request.Nombre;
        categoria.Slug = slug;
        categoria.Descripcion = request.Descripcion;
        categoria.Activo = request.Activo;

        await _db.SaveChangesAsync();

        return Ok(new CategoriaDto(categoria.Id, categoria.Nombre, categoria.Slug,
            categoria.Descripcion, categoria.ImagenUrl, categoria.Activo));
    }

    // DELETE api/categorias/{id}
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Delete(int id)
    {
        var categoria = await _db.Categorias.FindAsync(id);
        if (categoria is null) return NotFound();

        categoria.Activo = false;
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
