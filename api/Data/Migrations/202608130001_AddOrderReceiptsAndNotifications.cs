using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using TiendaApi.Data;

#nullable disable

namespace TiendaApi.Data.Migrations;

[Migration("202608130001_AddOrderReceiptsAndNotifications")]
[DbContext(typeof(AppDbContext))]
public partial class AddOrderReceiptsAndNotifications : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ProductoNombre",
            table: "DetallesPedido",
            type: "character varying(300)",
            maxLength: 300,
            nullable: false,
            defaultValue: "");

        migrationBuilder.Sql("""
            UPDATE "DetallesPedido" AS d
            SET "ProductoNombre" = p."Nombre"
            FROM "Productos" AS p
            WHERE d."ProductoId" = p."Id";
            """);

        migrationBuilder.CreateTable(
            name: "NotificacionesEmail",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                Tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                Destinatario = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                Datos = table.Column<string>(type: "text", nullable: false),
                Intentos = table.Column<int>(type: "integer", nullable: false),
                FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                ProximoIntento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                FechaEnvio = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                UltimoError = table.Column<string>(type: "text", nullable: true),
                PedidoId = table.Column<int>(type: "integer", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_NotificacionesEmail", x => x.Id);
                table.ForeignKey(
                    name: "FK_NotificacionesEmail_Pedidos_PedidoId",
                    column: x => x.PedidoId,
                    principalTable: "Pedidos",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_NotificacionesEmail_Estado_ProximoIntento",
            table: "NotificacionesEmail",
            columns: new[] { "Estado", "ProximoIntento" });
        migrationBuilder.CreateIndex(
            name: "IX_NotificacionesEmail_PedidoId_Tipo",
            table: "NotificacionesEmail",
            columns: new[] { "PedidoId", "Tipo" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "NotificacionesEmail");
        migrationBuilder.DropColumn(name: "ProductoNombre", table: "DetallesPedido");
    }
}
