using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TiendaApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUrlRetornoToPedido : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UrlRetorno",
                table: "Pedidos",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UrlRetorno",
                table: "Pedidos");
        }
    }
}
