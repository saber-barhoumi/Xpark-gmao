using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEquipementModuleEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SeuilRemplacement",
                table: "Equipements",
                newName: "SeuilRemplacementUtilisations");

            migrationBuilder.AddColumn<string>(
                name: "DocumentsUrlsJson",
                table: "Equipements",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Fournisseur",
                table: "Equipements",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Equipements",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DocumentsUrlsJson",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "Fournisseur",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Equipements");

            migrationBuilder.RenameColumn(
                name: "SeuilRemplacementUtilisations",
                table: "Equipements",
                newName: "SeuilRemplacement");
        }
    }
}
