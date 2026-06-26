using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "EmployeeId",
                table: "Missions",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    IdEmployee = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Prenom = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NumeroMatricule = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Post = table.Column<string>(type: "text", nullable: false),
                    Service = table.Column<string>(type: "text", nullable: false),
                    Statut = table.Column<string>(type: "text", nullable: false),
                    Telephone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DateEmbauche = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Activ = table.Column<bool>(type: "boolean", nullable: false),
                    NumeroPermis = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CategoriePermis = table.Column<string>(type: "text", nullable: true),
                    DateExpirationPermis = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Specialty = table.Column<string>(type: "text", nullable: true),
                    Level = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.IdEmployee);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Missions_EmployeeId",
                table: "Missions",
                column: "EmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Missions_Employees_EmployeeId",
                table: "Missions",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "IdEmployee");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Missions_Employees_EmployeeId",
                table: "Missions");

            migrationBuilder.DropTable(
                name: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Missions_EmployeeId",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "EmployeeId",
                table: "Missions");
        }
    }
}
