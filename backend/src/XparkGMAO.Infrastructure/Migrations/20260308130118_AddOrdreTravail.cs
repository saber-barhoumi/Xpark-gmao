using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrdreTravail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DureeMinutes",
                table: "Interventions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "OrdreTravailId",
                table: "Interventions",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TypePeriodicite",
                table: "Interventions",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "OrdresTravail",
                columns: table => new
                {
                    IdOrdreTravail = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Reference = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateDebut = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateFin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Statut = table.Column<string>(type: "text", nullable: false),
                    CoutReel = table.Column<double>(type: "double precision", precision: 18, scale: 2, nullable: true),
                    Observations = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    VehiculeId = table.Column<long>(type: "bigint", nullable: false),
                    TechnicienId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdresTravail", x => x.IdOrdreTravail);
                    table.ForeignKey(
                        name: "FK_OrdresTravail_Utilisateurs_TechnicienId",
                        column: x => x.TechnicienId,
                        principalTable: "Utilisateurs",
                        principalColumn: "IdUtilisateur",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdresTravail_Vehicules_VehiculeId",
                        column: x => x.VehiculeId,
                        principalTable: "Vehicules",
                        principalColumn: "IdVehicule",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Interventions_OrdreTravailId",
                table: "Interventions",
                column: "OrdreTravailId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdresTravail_Reference",
                table: "OrdresTravail",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdresTravail_TechnicienId",
                table: "OrdresTravail",
                column: "TechnicienId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdresTravail_VehiculeId",
                table: "OrdresTravail",
                column: "VehiculeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Interventions_OrdresTravail_OrdreTravailId",
                table: "Interventions",
                column: "OrdreTravailId",
                principalTable: "OrdresTravail",
                principalColumn: "IdOrdreTravail",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Interventions_OrdresTravail_OrdreTravailId",
                table: "Interventions");

            migrationBuilder.DropTable(
                name: "OrdresTravail");

            migrationBuilder.DropIndex(
                name: "IX_Interventions_OrdreTravailId",
                table: "Interventions");

            migrationBuilder.DropColumn(
                name: "DureeMinutes",
                table: "Interventions");

            migrationBuilder.DropColumn(
                name: "OrdreTravailId",
                table: "Interventions");

            migrationBuilder.DropColumn(
                name: "TypePeriodicite",
                table: "Interventions");
        }
    }
}
