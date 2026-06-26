using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPieceRechangeImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "PiecesRechange",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "PiecesRechange");
        }
    }
}
