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

    public ProductosController(AppDbContext db, IStorageService storage)
    {
        _db = db;
        _storage = storage;
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

        if (!await _db.Categorias.AnyAsync(c => c.Id == request.CategoriaId))
            return BadRequest(new { message = "La categoría no existe." });

        var slug = SlugHelper.Generate(request.Nombre);

        if (await _db.Productos.AnyAsync(p => p.Slug == slug))
            return Conflict(new { message = "Ya existe un producto con ese nombre." });

        string? imagenUrl = null;
        if (imagen is not null)
            imagenUrl = await _storage.UploadAsync(imagen, "productos");

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

        _db.Productos.Add(producto);
        await _db.SaveChangesAsync();

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

        if (!await _db.Categorias.AnyAsync(c => c.Id == request.CategoriaId))
            return BadRequest(new { message = "La categoría no existe." });

        var slug = SlugHelper.Generate(request.Nombre);

        if (await _db.Productos.AnyAsync(p => p.Slug == slug && p.Id != id))
            return Conflict(new { message = "Ya existe un producto con ese nombre." });

        if (imagen is not null)
        {
            if (!string.IsNullOrWhiteSpace(producto.ImagenUrl))
                await _storage.DeleteAsync(producto.ImagenUrl);

            producto.ImagenUrl = await _storage.UploadAsync(imagen, "productos");
        }

        producto.Nombre = request.Nombre;
        producto.Slug = slug;
        producto.Descripcion = request.Descripcion;
        producto.Precio = request.Precio;
        producto.Stock = request.Stock;
        producto.CategoriaId = request.CategoriaId;
        producto.Activo = request.Activo;

        await _db.SaveChangesAsync();

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
}
