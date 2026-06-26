using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DateValidation",
                table: "OrdresTravail",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotifAnnulation",
                table: "OrdresTravail",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ValideParId",
                table: "OrdresTravail",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EntityName = table.Column<string>(type: "text", nullable: false),
                    EntityId = table.Column<long>(type: "bigint", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    OldValues = table.Column<string>(type: "text", nullable: true),
                    NewValues = table.Column<string>(type: "text", nullable: true),
                    UtilisateurId = table.Column<long>(type: "bigint", nullable: true),
                    UtilisateurNom = table.Column<string>(type: "text", nullable: true),
                    DateAction = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HistoriqueStatutsOT",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrdreTravailId = table.Column<long>(type: "bigint", nullable: false),
                    AncienStatut = table.Column<string>(type: "text", nullable: false),
                    NouveauStatut = table.Column<string>(type: "text", nullable: false),
                    Commentaire = table.Column<string>(type: "text", nullable: true),
                    UtilisateurId = table.Column<long>(type: "bigint", nullable: true),
                    DateChangement = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HistoriqueStatutsOT", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HistoriqueStatutsOT_OrdresTravail_OrdreTravailId",
                        column: x => x.OrdreTravailId,
                        principalTable: "OrdresTravail",
                        principalColumn: "IdOrdreTravail",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HistoriqueStatutsOT_Utilisateurs_UtilisateurId",
                        column: x => x.UtilisateurId,
                        principalTable: "Utilisateurs",
                        principalColumn: "IdUtilisateur");
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrdresTravail_ValideParId",
                table: "OrdresTravail",
                column: "ValideParId");

            migrationBuilder.CreateIndex(
                name: "IX_HistoriqueStatutsOT_OrdreTravailId",
                table: "HistoriqueStatutsOT",
                column: "OrdreTravailId");

            migrationBuilder.CreateIndex(
                name: "IX_HistoriqueStatutsOT_UtilisateurId",
                table: "HistoriqueStatutsOT",
                column: "UtilisateurId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrdresTravail_Utilisateurs_ValideParId",
                table: "OrdresTravail",
                column: "ValideParId",
                principalTable: "Utilisateurs",
                principalColumn: "IdUtilisateur");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrdresTravail_Utilisateurs_ValideParId",
                table: "OrdresTravail");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "HistoriqueStatutsOT");

            migrationBuilder.DropIndex(
                name: "IX_OrdresTravail_ValideParId",
                table: "OrdresTravail");

            migrationBuilder.DropColumn(
                name: "DateValidation",
                table: "OrdresTravail");

            migrationBuilder.DropColumn(
                name: "MotifAnnulation",
                table: "OrdresTravail");

            migrationBuilder.DropColumn(
                name: "ValideParId",
                table: "OrdresTravail");
        }
    }
}
