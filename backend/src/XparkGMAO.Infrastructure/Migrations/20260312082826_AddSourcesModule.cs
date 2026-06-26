using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSourcesModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "SourceId",
                table: "Carburants",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TypeCarburant",
                table: "Carburants",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Sources",
                columns: table => new
                {
                    IdSource = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NomSource = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TypeSource = table.Column<string>(type: "text", nullable: false),
                    Adresse = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Ville = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    PrixMoyen = table.Column<double>(type: "double precision", precision: 18, scale: 3, nullable: true),
                    RemiseFiotte = table.Column<double>(type: "double precision", precision: 5, scale: 2, nullable: true),
                    CodeCarte = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Actif = table.Column<bool>(type: "boolean", nullable: false),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sources", x => x.IdSource);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Carburants_SourceId",
                table: "Carburants",
                column: "SourceId");

            migrationBuilder.CreateIndex(
                name: "IX_Sources_Actif",
                table: "Sources",
                column: "Actif");

            migrationBuilder.CreateIndex(
                name: "IX_Sources_TypeSource",
                table: "Sources",
                column: "TypeSource");

            migrationBuilder.AddForeignKey(
                name: "FK_Carburants_Sources_SourceId",
                table: "Carburants",
                column: "SourceId",
                principalTable: "Sources",
                principalColumn: "IdSource",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Carburants_Sources_SourceId",
                table: "Carburants");

            migrationBuilder.DropTable(
                name: "Sources");

            migrationBuilder.DropIndex(
                name: "IX_Carburants_SourceId",
                table: "Carburants");

            migrationBuilder.DropColumn(
                name: "SourceId",
                table: "Carburants");

            migrationBuilder.DropColumn(
                name: "TypeCarburant",
                table: "Carburants");
        }
    }
}
