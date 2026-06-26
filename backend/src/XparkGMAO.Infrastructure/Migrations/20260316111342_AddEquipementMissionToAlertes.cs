using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEquipementMissionToAlertes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "EquipementId",
                table: "Alertes",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "MissionId",
                table: "Alertes",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Alertes_EquipementId",
                table: "Alertes",
                column: "EquipementId");

            migrationBuilder.CreateIndex(
                name: "IX_Alertes_MissionId",
                table: "Alertes",
                column: "MissionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Alertes_Equipements_EquipementId",
                table: "Alertes",
                column: "EquipementId",
                principalTable: "Equipements",
                principalColumn: "IdEquipement");

            migrationBuilder.AddForeignKey(
                name: "FK_Alertes_Missions_MissionId",
                table: "Alertes",
                column: "MissionId",
                principalTable: "Missions",
                principalColumn: "IdMission");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Alertes_Equipements_EquipementId",
                table: "Alertes");

            migrationBuilder.DropForeignKey(
                name: "FK_Alertes_Missions_MissionId",
                table: "Alertes");

            migrationBuilder.DropIndex(
                name: "IX_Alertes_EquipementId",
                table: "Alertes");

            migrationBuilder.DropIndex(
                name: "IX_Alertes_MissionId",
                table: "Alertes");

            migrationBuilder.DropColumn(
                name: "EquipementId",
                table: "Alertes");

            migrationBuilder.DropColumn(
                name: "MissionId",
                table: "Alertes");
        }
    }
}
