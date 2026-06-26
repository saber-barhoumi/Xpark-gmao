using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDashboardAndKPIs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EstParDefaut",
                table: "TableauxDeBord",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Widgets",
                table: "TableauxDeBord",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Tendance",
                table: "KPIs",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Categorie",
                table: "KPIs",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodeKPI",
                table: "KPIs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Couleur",
                table: "KPIs",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "KPIs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DonneesJson",
                table: "KPIs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Icone",
                table: "KPIs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_TableauxDeBord_EstParDefaut",
                table: "TableauxDeBord",
                column: "EstParDefaut");

            migrationBuilder.CreateIndex(
                name: "IX_KPIs_Categorie",
                table: "KPIs",
                column: "Categorie");

            migrationBuilder.CreateIndex(
                name: "IX_KPIs_CodeKPI",
                table: "KPIs",
                column: "CodeKPI");

            migrationBuilder.CreateIndex(
                name: "IX_KPIs_DateCalcul",
                table: "KPIs",
                column: "DateCalcul");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TableauxDeBord_EstParDefaut",
                table: "TableauxDeBord");

            migrationBuilder.DropIndex(
                name: "IX_KPIs_Categorie",
                table: "KPIs");

            migrationBuilder.DropIndex(
                name: "IX_KPIs_CodeKPI",
                table: "KPIs");

            migrationBuilder.DropIndex(
                name: "IX_KPIs_DateCalcul",
                table: "KPIs");

            migrationBuilder.DropColumn(
                name: "EstParDefaut",
                table: "TableauxDeBord");

            migrationBuilder.DropColumn(
                name: "Widgets",
                table: "TableauxDeBord");

            migrationBuilder.DropColumn(
                name: "CodeKPI",
                table: "KPIs");

            migrationBuilder.DropColumn(
                name: "Couleur",
                table: "KPIs");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "KPIs");

            migrationBuilder.DropColumn(
                name: "DonneesJson",
                table: "KPIs");

            migrationBuilder.DropColumn(
                name: "Icone",
                table: "KPIs");

            migrationBuilder.AlterColumn<string>(
                name: "Tendance",
                table: "KPIs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Categorie",
                table: "KPIs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
