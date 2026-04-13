using Microsoft.EntityFrameworkCore;
using TiendaApi.Models;

namespace TiendaApi.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IConfiguration config)
    {
        // Solo crear si no existe ningún ADMIN
        if (await db.Usuarios.AnyAsync(u => u.Rol == "ADMIN"))
            return;

        var email    = config["Admin:Email"]    ?? "admin@tienda.com";
        var password = config["Admin:Password"] ?? "Admin@123456";
        var nombre   = config["Admin:Nombre"]   ?? "Administrador";

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
}
