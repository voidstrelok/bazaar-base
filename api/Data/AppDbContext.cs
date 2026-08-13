using Microsoft.EntityFrameworkCore;
using TiendaApi.Models;

namespace TiendaApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<DetallePedido> DetallesPedido => Set<DetallePedido>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<NotificacionEmail> NotificacionesEmail => Set<NotificacionEmail>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Usuario
        modelBuilder.Entity<Usuario>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(256);
            e.Property(u => u.Nombre).HasMaxLength(200);
            e.Property(u => u.Rol).HasMaxLength(20);
        });

        // Categoria
        modelBuilder.Entity<Categoria>(e =>
        {
            e.HasIndex(c => c.Slug).IsUnique();
            e.Property(c => c.Nombre).HasMaxLength(200);
            e.Property(c => c.Slug).HasMaxLength(200);
        });

        // Producto
        modelBuilder.Entity<Producto>(e =>
        {
            e.HasIndex(p => p.Slug).IsUnique();
            e.Property(p => p.Nombre).HasMaxLength(300);
            e.Property(p => p.Slug).HasMaxLength(300);
            e.Property(p => p.Precio).HasPrecision(18, 2);
            e.HasOne(p => p.Categoria)
             .WithMany(c => c.Productos)
             .HasForeignKey(p => p.CategoriaId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Pedido
        modelBuilder.Entity<Pedido>(e =>
        {
            e.Property(p => p.Total).HasPrecision(18, 2);
            e.Property(p => p.Estado).HasConversion<string>();
            e.Property(p => p.Gateway).HasMaxLength(50);
            e.HasOne(p => p.Usuario)
             .WithMany(u => u.Pedidos)
             .HasForeignKey(p => p.UsuarioId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // DetallePedido
        modelBuilder.Entity<DetallePedido>(e =>
        {
            e.Property(d => d.PrecioUnitario).HasPrecision(18, 2);
            e.Property(d => d.ProductoNombre).HasMaxLength(300);
            e.HasOne(d => d.Pedido)
             .WithMany(p => p.Detalles)
             .HasForeignKey(d => d.PedidoId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(d => d.Producto)
             .WithMany(p => p.DetallesPedido)
             .HasForeignKey(d => d.ProductoId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Pago
        modelBuilder.Entity<Pago>(e =>
        {
            e.Property(p => p.Monto).HasPrecision(18, 2);
            e.Property(p => p.Estado).HasConversion<string>();
            e.Property(p => p.Gateway).HasMaxLength(50);
            e.HasOne(p => p.Pedido)
             .WithOne(p => p.Pago)
             .HasForeignKey<Pago>(p => p.PedidoId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NotificacionEmail>(e =>
        {
            e.Property(n => n.Tipo).HasConversion<string>().HasMaxLength(50);
            e.Property(n => n.Estado).HasConversion<string>().HasMaxLength(20);
            e.Property(n => n.Destinatario).HasMaxLength(256);
            e.HasIndex(n => new { n.PedidoId, n.Tipo }).IsUnique();
            e.HasIndex(n => new { n.Estado, n.ProximoIntento });
            e.HasOne(n => n.Pedido)
             .WithMany()
             .HasForeignKey(n => n.PedidoId)
             .OnDelete(DeleteBehavior.Cascade);
        });

    }
}
