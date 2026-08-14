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
    private readonly ILogger<CategoriasController> _logger;

    public CategoriasController(AppDbContext db, IStorageService storage, ILogger<CategoriasController> logger)
    {
        _db = db;
        _storage = storage;
        _logger = logger;
    }

    // GET api/categorias
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool soloActivas = true)
    {
        var incluirInactivas = !soloActivas && User.IsInRole("ADMIN");
        var query = _db.Categorias.AsQueryable();
        if (!incluirInactivas)
            query = query.Where(c => c.Activo);

        var categorias = await query
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
        try
        {
            if (imagen is not null)
                await ImageValidation.ValidateAsync(imagen);
            if (imagen is not null)
                imagenUrl = await _storage.UploadAsync(imagen, "categorias");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        var categoria = new Categoria
        {
            Nombre = request.Nombre,
            Slug = slug,
            Descripcion = request.Descripcion,
            ImagenUrl = imagenUrl
        };

        try
        {
            _db.Categorias.Add(categoria);
            await _db.SaveChangesAsync();
        }
        catch
        {
            await TryDeleteImageAsync(imagenUrl, "compensar la creación fallida de la categoría");
            throw;
        }

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

        var imagenAnterior = categoria.ImagenUrl;
        string? imagenNueva = null;

        try
        {
            if (imagen is not null)
                await ImageValidation.ValidateAsync(imagen);
            if (imagen is not null)
                imagenNueva = await _storage.UploadAsync(imagen, "categorias");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        if (imagenNueva is not null)
        {
            try
            {
                // The old URL is part of the update predicate. If another
                // image update won the race, this prevents the new upload
                // from becoming the unreferenced one.
                var affected = await _db.Categorias
                    .Where(c => c.Id == id && c.ImagenUrl == imagenAnterior)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(c => c.Nombre, request.Nombre)
                        .SetProperty(c => c.Slug, slug)
                        .SetProperty(c => c.Descripcion, request.Descripcion)
                        .SetProperty(c => c.ImagenUrl, imagenNueva)
                        .SetProperty(c => c.Activo, request.Activo));

                if (affected == 0)
                {
                    await TryDeleteImageAsync(imagenNueva, "compensar una actualización concurrente de la categoría");
                    return Conflict(new { message = "La categoría fue modificada mientras se actualizaba la imagen. Inténtalo nuevamente." });
                }

                _db.ChangeTracker.Clear();
                categoria = await _db.Categorias.SingleAsync(c => c.Id == id);
            }
            catch
            {
                await TryDeleteImageAsync(imagenNueva, "compensar la actualización fallida de la categoría");
                throw;
            }
        }
        else
        {
            categoria.Nombre = request.Nombre;
            categoria.Slug = slug;
            categoria.Descripcion = request.Descripcion;
            categoria.Activo = request.Activo;

            await _db.SaveChangesAsync();
        }

        if (imagenNueva is not null &&
            !string.IsNullOrWhiteSpace(imagenAnterior) &&
            !string.Equals(imagenAnterior, imagenNueva, StringComparison.Ordinal))
        {
            await TryDeleteImageAsync(imagenAnterior, "limpiar la imagen anterior de la categoría");
        }

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

    private async Task TryDeleteImageAsync(string? url, string operation)
    {
        if (string.IsNullOrWhiteSpace(url))
            return;

        try
        {
            await _storage.DeleteAsync(url);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudo {Operation}. URL: {ImageUrl}", operation, url);
        }
    }
}
