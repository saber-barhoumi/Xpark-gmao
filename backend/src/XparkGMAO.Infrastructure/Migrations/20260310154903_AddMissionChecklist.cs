using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMissionChecklist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "BonCarburantAccorde",
                table: "Missions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CarteAutorouteRemise",
                table: "Missions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "NumeroBonCarburant",
                table: "Missions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "VerificationDocuments",
                table: "Missions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BonCarburantAccorde",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "CarteAutorouteRemise",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "NumeroBonCarburant",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "VerificationDocuments",
                table: "Missions");
        }
    }
}
