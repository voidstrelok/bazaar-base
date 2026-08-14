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
public class ProductosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IStorageService _storage;
    private readonly ILogger<ProductosController> _logger;

    public ProductosController(AppDbContext db, IStorageService storage, ILogger<ProductosController> logger)
    {
        _db = db;
        _storage = storage;
        _logger = logger;
    }

    // GET api/productos
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pagina = 1,
        [FromQuery] int tamano = 12,
        [FromQuery] int? categoriaId = null,
        [FromQuery] string? busqueda = null,
        [FromQuery] bool soloActivos = true)
    {
        pagina = Math.Max(1, pagina);
        tamano = Math.Clamp(tamano, 1, 100);
        var query = _db.Productos.Include(p => p.Categoria).AsQueryable();

        if (soloActivos)
            query = query.Where(p => p.Activo);

        if (categoriaId.HasValue)
            query = query.Where(p => p.CategoriaId == categoriaId.Value);

        if (!string.IsNullOrWhiteSpace(busqueda))
            query = query.Where(p => p.Nombre.Contains(busqueda) ||
                                     (p.Descripcion != null && p.Descripcion.Contains(busqueda)));

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(p => p.Nombre)
            .Skip((pagina - 1) * tamano)
            .Take(tamano)
            .Select(p => new ProductoDto(p.Id, p.Nombre, p.Slug, p.Descripcion,
                p.Precio, p.Stock, p.ImagenUrl, p.Activo, p.CategoriaId, p.Categoria.Nombre))
            .ToListAsync();

        return Ok(new ProductoListResponse(total, pagina, tamano, items));
    }

    // GET api/productos/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _db.Productos.Include(x => x.Categoria).FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound();

        return Ok(new ProductoDto(p.Id, p.Nombre, p.Slug, p.Descripcion,
            p.Precio, p.Stock, p.ImagenUrl, p.Activo, p.CategoriaId, p.Categoria.Nombre));
    }

    // GET api/productos/slug/{slug}
    [HttpGet("slug/{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var p = await _db.Productos.Include(x => x.Categoria).FirstOrDefaultAsync(x => x.Slug == slug);
        if (p is null) return NotFound();

        return Ok(new ProductoDto(p.Id, p.Nombre, p.Slug, p.Descripcion,
            p.Precio, p.Stock, p.ImagenUrl, p.Activo, p.CategoriaId, p.Categoria.Nombre));
    }

    // POST api/productos
    [HttpPost]
    [Authorize(Policy = "RequireAdmin")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] CreateProductoRequest request, IFormFile? imagen)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return BadRequest(new { message = "El nombre es requerido." });
        if (request.Precio < 0 || request.Stock < 0)
            return BadRequest(new { message = "El precio y el stock no pueden ser negativos." });

        if (!await _db.Categorias.AnyAsync(c => c.Id == request.CategoriaId))
            return BadRequest(new { message = "La categoría no existe." });

        var slug = SlugHelper.Generate(request.Nombre);

        if (await _db.Productos.AnyAsync(p => p.Slug == slug))
            return Conflict(new { message = "Ya existe un producto con ese nombre." });

        string? imagenUrl = null;
        try
        {
            if (imagen is not null)
                await ImageValidation.ValidateAsync(imagen);
            if (imagen is not null)
                imagenUrl = await _storage.UploadAsync(imagen, "productos");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        var producto = new Producto
        {
            Nombre = request.Nombre,
            Slug = slug,
            Descripcion = request.Descripcion,
            Precio = request.Precio,
            Stock = request.Stock,
            CategoriaId = request.CategoriaId,
            ImagenUrl = imagenUrl
        };

        try
        {
            _db.Productos.Add(producto);
            await _db.SaveChangesAsync();
        }
        catch
        {
            await TryDeleteImageAsync(imagenUrl, "compensar la creación fallida del producto");
            throw;
        }

        await _db.Entry(producto).Reference(x => x.Categoria).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = producto.Id },
            new ProductoDto(producto.Id, producto.Nombre, producto.Slug, producto.Descripcion,
                producto.Precio, producto.Stock, producto.ImagenUrl, producto.Activo,
                producto.CategoriaId, producto.Categoria.Nombre));
    }

    // PUT api/productos/{id}
    [HttpPut("{id:int}")]
    [Authorize(Policy = "RequireAdmin")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Update(int id, [FromForm] UpdateProductoRequest request, IFormFile? imagen)
    {
        var producto = await _db.Productos.Include(p => p.Categoria).FirstOrDefaultAsync(p => p.Id == id);
        if (producto is null) return NotFound();

        if (string.IsNullOrWhiteSpace(request.Nombre))
            return BadRequest(new { message = "El nombre es requerido." });
        if (request.Precio < 0 || request.Stock < 0)
            return BadRequest(new { message = "El precio y el stock no pueden ser negativos." });

        if (!await _db.Categorias.AnyAsync(c => c.Id == request.CategoriaId))
            return BadRequest(new { message = "La categoría no existe." });

        var slug = SlugHelper.Generate(request.Nombre);

        if (await _db.Productos.AnyAsync(p => p.Slug == slug && p.Id != id))
            return Conflict(new { message = "Ya existe un producto con ese nombre." });

        var imagenAnterior = producto.ImagenUrl;
        string? imagenNueva = null;

        try
        {
            if (imagen is not null)
                await ImageValidation.ValidateAsync(imagen);
            if (imagen is not null)
                imagenNueva = await _storage.UploadAsync(imagen, "productos");
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
                var affected = await _db.Productos
                    .Where(p => p.Id == id && p.ImagenUrl == imagenAnterior)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(p => p.Nombre, request.Nombre)
                        .SetProperty(p => p.Slug, slug)
                        .SetProperty(p => p.Descripcion, request.Descripcion)
                        .SetProperty(p => p.Precio, request.Precio)
                        .SetProperty(p => p.Stock, request.Stock)
                        .SetProperty(p => p.CategoriaId, request.CategoriaId)
                        .SetProperty(p => p.ImagenUrl, imagenNueva)
                        .SetProperty(p => p.Activo, request.Activo));

                if (affected == 0)
                {
                    await TryDeleteImageAsync(imagenNueva, "compensar una actualización concurrente del producto");
                    return Conflict(new { message = "El producto fue modificado mientras se actualizaba la imagen. Inténtalo nuevamente." });
                }

                _db.ChangeTracker.Clear();
                producto = await _db.Productos
                    .Include(p => p.Categoria)
                    .SingleAsync(p => p.Id == id);
            }
            catch
            {
                await TryDeleteImageAsync(imagenNueva, "compensar la actualización fallida del producto");
                throw;
            }
        }
        else
        {
            producto.Nombre = request.Nombre;
            producto.Slug = slug;
            producto.Descripcion = request.Descripcion;
            producto.Precio = request.Precio;
            producto.Stock = request.Stock;
            producto.CategoriaId = request.CategoriaId;
            producto.Activo = request.Activo;

            await _db.SaveChangesAsync();
        }

        if (imagenNueva is not null &&
            !string.IsNullOrWhiteSpace(imagenAnterior) &&
            !string.Equals(imagenAnterior, imagenNueva, StringComparison.Ordinal))
        {
            await TryDeleteImageAsync(imagenAnterior, "limpiar la imagen anterior del producto");
        }

        await _db.Entry(producto).Reference(x => x.Categoria).LoadAsync();

        return Ok(new ProductoDto(producto.Id, producto.Nombre, producto.Slug, producto.Descripcion,
            producto.Precio, producto.Stock, producto.ImagenUrl, producto.Activo,
            producto.CategoriaId, producto.Categoria.Nombre));
    }

    // DELETE api/productos/{id}
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Delete(int id)
    {
        var producto = await _db.Productos.FindAsync(id);
        if (producto is null) return NotFound();

        producto.Activo = false;
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
