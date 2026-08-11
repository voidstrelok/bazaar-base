using Microsoft.EntityFrameworkCore;
using TiendaApi.Models;

namespace TiendaApi.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IConfiguration config)
    {
        // Solo crear si no existe ningún ADMIN
        if (!await db.Usuarios.AnyAsync(u => u.Rol == "ADMIN"))
        {
            var email    = config["Admin:Email"];
            var password = config["Admin:Password"];
            var nombre   = config["Admin:Nombre"]   ?? "Administrador";

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                throw new InvalidOperationException("Admin:Email y Admin:Password son obligatorios para crear el administrador inicial.");

            var admin = new Usuario
            {
                Nombre        = nombre,
                Email         = email,
                PasswordHash  = BCrypt.Net.BCrypt.HashPassword(password),
                Rol           = "ADMIN",
                Activo        = true,
                FechaCreacion = DateTime.UtcNow
            };

            db.Usuarios.Add(admin);
            await db.SaveChangesAsync();
        }

        // Los datos de ejemplo solo se crean explícitamente en desarrollo.
        if (config.GetValue<bool>("SeedDemoData") && !await db.Categorias.AnyAsync())
        {
            var categorias = new List<Categoria>
            {
                new() { Nombre = "Electrónica",  Slug = "electronica",  Descripcion = "Dispositivos y accesorios electrónicos", Activo = true },
                new() { Nombre = "Ropa",         Slug = "ropa",         Descripcion = "Prendas de vestir para todas las ocasiones", Activo = true },
                new() { Nombre = "Hogar",        Slug = "hogar",        Descripcion = "Artículos para el hogar y decoración", Activo = true },
            };

            db.Categorias.AddRange(categorias);
            await db.SaveChangesAsync();

            // Productos de ejemplo
            var productos = new List<Producto>
            {
                new()
                {
                    Nombre      = "Auriculares Bluetooth",
                    Slug        = "auriculares-bluetooth",
                    Descripcion = "Auriculares inalámbricos con cancelación de ruido y 20 h de batería.",
                    Precio      = 49990m,
                    Stock       = 50,
                    Activo      = true,
                    FechaCreacion = DateTime.UtcNow,
                    CategoriaId = categorias[0].Id
                },
                new()
                {
                    Nombre      = "Camiseta Básica",
                    Slug        = "camiseta-basica",
                    Descripcion = "Camiseta de algodón 100 % disponible en varios colores.",
                    Precio      = 9990m,
                    Stock       = 200,
                    Activo      = true,
                    FechaCreacion = DateTime.UtcNow,
                    CategoriaId = categorias[1].Id
                },
                new()
                {
                    Nombre      = "Lámpara de Mesa LED",
                    Slug        = "lampara-mesa-led",
                    Descripcion = "Lámpara de escritorio con luz regulable y puerto USB de carga.",
                    Precio      = 19990m,
                    Stock       = 80,
                    Activo      = true,
                    FechaCreacion = DateTime.UtcNow,
                    CategoriaId = categorias[2].Id
                },
            };

            db.Productos.AddRange(productos);
            await db.SaveChangesAsync();
        }
    }
}
