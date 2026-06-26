using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNotesAndContratsEquipements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Notes",
                table: "Equipements",
                newName: "NotesGenerales");

            migrationBuilder.CreateTable(
                name: "ContratsFournisseurs",
                columns: table => new
                {
                    IdContrat = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EquipementId = table.Column<long>(type: "bigint", nullable: false),
                    Type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    NomFournisseur = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    NumeroContrat = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ContactFournisseur = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TelephoneSAV = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DateDebutUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateFinUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MontantAnnuel = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    ConditionsJson = table.Column<string>(type: "text", nullable: true),
                    DocumentUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActif = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateModification = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContratsFournisseurs", x => x.IdContrat);
                    table.ForeignKey(
                        name: "FK_ContratsFournisseurs_Equipements_EquipementId",
                        column: x => x.EquipementId,
                        principalTable: "Equipements",
                        principalColumn: "IdEquipement",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NotesEquipements",
                columns: table => new
                {
                    IdNote = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EquipementId = table.Column<long>(type: "bigint", nullable: false),
                    AuteurId = table.Column<long>(type: "bigint", nullable: false),
                    Priorite = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "info"),
                    Contenu = table.Column<string>(type: "text", nullable: false),
                    TagsJson = table.Column<string>(type: "text", nullable: true),
                    PiecesJointesJson = table.Column<string>(type: "text", nullable: true),
                    IsEpingle = table.Column<bool>(type: "boolean", nullable: false),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateModification = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotesEquipements", x => x.IdNote);
                    table.ForeignKey(
                        name: "FK_NotesEquipements_Equipements_EquipementId",
                        column: x => x.EquipementId,
                        principalTable: "Equipements",
                        principalColumn: "IdEquipement",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NotesEquipements_Utilisateurs_AuteurId",
                        column: x => x.AuteurId,
                        principalTable: "Utilisateurs",
                        principalColumn: "IdUtilisateur",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContratsFournisseurs_EquipementId",
                table: "ContratsFournisseurs",
                column: "EquipementId");

            migrationBuilder.CreateIndex(
                name: "IX_NotesEquipements_AuteurId",
                table: "NotesEquipements",
                column: "AuteurId");

            migrationBuilder.CreateIndex(
                name: "IX_NotesEquipements_EquipementId",
                table: "NotesEquipements",
                column: "EquipementId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContratsFournisseurs");

            migrationBuilder.DropTable(
                name: "NotesEquipements");

            migrationBuilder.RenameColumn(
                name: "NotesGenerales",
                table: "Equipements",
                newName: "Notes");
        }
    }
}
