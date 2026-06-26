using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMissionModule_Fixed_v2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Missions_Employees_EmployeeId",
                table: "Missions");

            migrationBuilder.DropForeignKey(
                name: "FK_Missions_Utilisateurs_ChauffeurId",
                table: "Missions");

            migrationBuilder.DropForeignKey(
                name: "FK_Missions_Utilisateurs_ClientId",
                table: "Missions");

            migrationBuilder.DropIndex(
                name: "IX_Missions_Reference",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "CoutCarburant",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "DateRetourEffectif",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "Objet",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "Observations",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "Origine",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "Reference",
                table: "Missions");

            migrationBuilder.RenameColumn(
                name: "ClientId",
                table: "Missions",
                newName: "ClientIdUtilisateur");

            migrationBuilder.RenameColumn(
                name: "ChauffeurId",
                table: "Missions",
                newName: "ChauffeurIdUtilisateur");

            migrationBuilder.RenameIndex(
                name: "IX_Missions_ClientId",
                table: "Missions",
                newName: "IX_Missions_ClientIdUtilisateur");

            migrationBuilder.RenameIndex(
                name: "IX_Missions_ChauffeurId",
                table: "Missions",
                newName: "IX_Missions_ChauffeurIdUtilisateur");

            migrationBuilder.AlterColumn<double>(
                name: "KilometrageRetour",
                table: "Missions",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(double),
                oldType: "double precision",
                oldNullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "EmployeeId",
                table: "Missions",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Destination",
                table: "Missions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(300)",
                oldMaxLength: 300);

            migrationBuilder.AlterColumn<double>(
                name: "CoutTotal",
                table: "Missions",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(double),
                oldType: "double precision",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ObjetMission",
                table: "Missions",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_Missions_Employees_EmployeeId",
                table: "Missions",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "IdEmployee",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Missions_Utilisateurs_ChauffeurIdUtilisateur",
                table: "Missions",
                column: "ChauffeurIdUtilisateur",
                principalTable: "Utilisateurs",
                principalColumn: "IdUtilisateur");

            migrationBuilder.AddForeignKey(
                name: "FK_Missions_Utilisateurs_ClientIdUtilisateur",
                table: "Missions",
                column: "ClientIdUtilisateur",
                principalTable: "Utilisateurs",
                principalColumn: "IdUtilisateur");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Missions_Employees_EmployeeId",
                table: "Missions");

            migrationBuilder.DropForeignKey(
                name: "FK_Missions_Utilisateurs_ChauffeurIdUtilisateur",
                table: "Missions");

            migrationBuilder.DropForeignKey(
                name: "FK_Missions_Utilisateurs_ClientIdUtilisateur",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "ObjetMission",
                table: "Missions");

            migrationBuilder.RenameColumn(
                name: "ClientIdUtilisateur",
                table: "Missions",
                newName: "ClientId");

            migrationBuilder.RenameColumn(
                name: "ChauffeurIdUtilisateur",
                table: "Missions",
                newName: "ChauffeurId");

            migrationBuilder.RenameIndex(
                name: "IX_Missions_ClientIdUtilisateur",
                table: "Missions",
                newName: "IX_Missions_ClientId");

            migrationBuilder.RenameIndex(
                name: "IX_Missions_ChauffeurIdUtilisateur",
                table: "Missions",
                newName: "IX_Missions_ChauffeurId");

            migrationBuilder.AlterColumn<double>(
                name: "KilometrageRetour",
                table: "Missions",
                type: "double precision",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "double precision");

            migrationBuilder.AlterColumn<long>(
                name: "EmployeeId",
                table: "Missions",
                type: "bigint",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AlterColumn<string>(
                name: "Destination",
                table: "Missions",
                type: "character varying(300)",
                maxLength: 300,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<double>(
                name: "CoutTotal",
                table: "Missions",
                type: "double precision",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "double precision");

            migrationBuilder.AddColumn<double>(
                name: "CoutCarburant",
                table: "Missions",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateRetourEffectif",
                table: "Missions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Objet",
                table: "Missions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Observations",
                table: "Missions",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Origine",
                table: "Missions",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Reference",
                table: "Missions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Missions_Reference",
                table: "Missions",
                column: "Reference",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Missions_Employees_EmployeeId",
                table: "Missions",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "IdEmployee");

            migrationBuilder.AddForeignKey(
                name: "FK_Missions_Utilisateurs_ChauffeurId",
                table: "Missions",
                column: "ChauffeurId",
                principalTable: "Utilisateurs",
                principalColumn: "IdUtilisateur",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Missions_Utilisateurs_ClientId",
                table: "Missions",
                column: "ClientId",
                principalTable: "Utilisateurs",
                principalColumn: "IdUtilisateur",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
