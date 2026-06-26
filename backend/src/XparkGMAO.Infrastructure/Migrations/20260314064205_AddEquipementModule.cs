using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEquipementModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Equipements_Missions_MissionId",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "Designation",
                table: "Equipements");

            migrationBuilder.RenameColumn(
                name: "Quantite",
                table: "Equipements",
                newName: "NombreUtilisations");

            migrationBuilder.RenameColumn(
                name: "MissionId",
                table: "Equipements",
                newName: "VehiculeId");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Equipements",
                newName: "NumeroSerie");

            migrationBuilder.RenameIndex(
                name: "IX_Equipements_MissionId",
                table: "Equipements",
                newName: "IX_Equipements_VehiculeId");

            migrationBuilder.AlterColumn<string>(
                name: "Etat",
                table: "Equipements",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<bool>(
                name: "Actif",
                table: "Equipements",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Categorie",
                table: "Equipements",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CodeInventaire",
                table: "Equipements",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "DateAchat",
                table: "Equipements",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateCreation",
                table: "Equipements",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "DateFinGarantie",
                table: "Equipements",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateModification",
                table: "Equipements",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "DureeVieTheoriqueEnMois",
                table: "Equipements",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "HeuresUtilisation",
                table: "Equipements",
                type: "numeric(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Marque",
                table: "Equipements",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Modele",
                table: "Equipements",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Nom",
                table: "Equipements",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Equipements",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PrixAchat",
                table: "Equipements",
                type: "numeric(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SeuilRemplacement",
                table: "Equipements",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SeuilUsureUtilisations",
                table: "Equipements",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Equipements",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "InspectionsEquipements",
                columns: table => new
                {
                    IdInspection = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EquipementId = table.Column<long>(type: "bigint", nullable: false),
                    TechnicienId = table.Column<long>(type: "bigint", nullable: false),
                    EtatConstate = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ScoreEtat = table.Column<int>(type: "integer", nullable: false),
                    ChecklistJson = table.Column<string>(type: "text", nullable: true),
                    Observations = table.Column<string>(type: "text", nullable: true),
                    PhotosJson = table.Column<string>(type: "text", nullable: true),
                    CoutEstimeRemplacement = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    RecommandeRemplacement = table.Column<bool>(type: "boolean", nullable: false),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InspectionsEquipements", x => x.IdInspection);
                    table.ForeignKey(
                        name: "FK_InspectionsEquipements_Equipements_EquipementId",
                        column: x => x.EquipementId,
                        principalTable: "Equipements",
                        principalColumn: "IdEquipement",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InspectionsEquipements_Utilisateurs_TechnicienId",
                        column: x => x.TechnicienId,
                        principalTable: "Utilisateurs",
                        principalColumn: "IdUtilisateur",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MouvementsEquipements",
                columns: table => new
                {
                    IdMouvement = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    EquipementId = table.Column<long>(type: "bigint", nullable: false),
                    MissionId = table.Column<long>(type: "bigint", nullable: true),
                    IdUtilisateur = table.Column<long>(type: "bigint", nullable: true),
                    DateDebutUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateFinUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EtatApresRetour = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    CoutReparation = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    Observations = table.Column<string>(type: "text", nullable: true),
                    PhotosJson = table.Column<string>(type: "text", nullable: true),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MouvementsEquipements", x => x.IdMouvement);
                    table.ForeignKey(
                        name: "FK_MouvementsEquipements_Equipements_EquipementId",
                        column: x => x.EquipementId,
                        principalTable: "Equipements",
                        principalColumn: "IdEquipement",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MouvementsEquipements_Missions_MissionId",
                        column: x => x.MissionId,
                        principalTable: "Missions",
                        principalColumn: "IdMission",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MouvementsEquipements_Utilisateurs_IdUtilisateur",
                        column: x => x.IdUtilisateur,
                        principalTable: "Utilisateurs",
                        principalColumn: "IdUtilisateur",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Equipements_CodeInventaire",
                table: "Equipements",
                column: "CodeInventaire",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InspectionsEquipements_EquipementId",
                table: "InspectionsEquipements",
                column: "EquipementId");

            migrationBuilder.CreateIndex(
                name: "IX_InspectionsEquipements_TechnicienId",
                table: "InspectionsEquipements",
                column: "TechnicienId");

            migrationBuilder.CreateIndex(
                name: "IX_MouvementsEquipements_EquipementId",
                table: "MouvementsEquipements",
                column: "EquipementId");

            migrationBuilder.CreateIndex(
                name: "IX_MouvementsEquipements_IdUtilisateur",
                table: "MouvementsEquipements",
                column: "IdUtilisateur");

            migrationBuilder.CreateIndex(
                name: "IX_MouvementsEquipements_MissionId",
                table: "MouvementsEquipements",
                column: "MissionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Equipements_Vehicules_VehiculeId",
                table: "Equipements",
                column: "VehiculeId",
                principalTable: "Vehicules",
                principalColumn: "IdVehicule",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Equipements_Vehicules_VehiculeId",
                table: "Equipements");

            migrationBuilder.DropTable(
                name: "InspectionsEquipements");

            migrationBuilder.DropTable(
                name: "MouvementsEquipements");

            migrationBuilder.DropIndex(
                name: "IX_Equipements_CodeInventaire",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "Actif",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "Categorie",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "CodeInventaire",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "DateAchat",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "DateCreation",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "DateFinGarantie",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "DateModification",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "DureeVieTheoriqueEnMois",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "HeuresUtilisation",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "Marque",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "Modele",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "Nom",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "PrixAchat",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "SeuilRemplacement",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "SeuilUsureUtilisations",
                table: "Equipements");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Equipements");

            migrationBuilder.RenameColumn(
                name: "VehiculeId",
                table: "Equipements",
                newName: "MissionId");

            migrationBuilder.RenameColumn(
                name: "NumeroSerie",
                table: "Equipements",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "NombreUtilisations",
                table: "Equipements",
                newName: "Quantite");

            migrationBuilder.RenameIndex(
                name: "IX_Equipements_VehiculeId",
                table: "Equipements",
                newName: "IX_Equipements_MissionId");

            migrationBuilder.AlterColumn<int>(
                name: "Etat",
                table: "Equipements",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30);

            migrationBuilder.AddColumn<string>(
                name: "Designation",
                table: "Equipements",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_Equipements_Missions_MissionId",
                table: "Equipements",
                column: "MissionId",
                principalTable: "Missions",
                principalColumn: "IdMission");
        }
    }
}
