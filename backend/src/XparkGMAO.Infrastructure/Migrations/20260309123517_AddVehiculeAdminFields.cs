using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVehiculeAdminFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DateProchaineRevision",
                table: "Vehicules",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PuissanceFiscale",
                table: "Vehicules",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateProchaineRevision",
                table: "Vehicules");

            migrationBuilder.DropColumn(
                name: "PuissanceFiscale",
                table: "Vehicules");
        }
    }
}
