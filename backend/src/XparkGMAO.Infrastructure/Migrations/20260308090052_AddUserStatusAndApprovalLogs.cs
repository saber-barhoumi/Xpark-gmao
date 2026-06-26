using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    public partial class AddUserStatusAndApprovalLogs : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Statut",
                table: "Utilisateurs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateApprobation",
                table: "Utilisateurs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ApprouvePar",
                table: "Utilisateurs",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RaisonRejet",
                table: "Utilisateurs",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Statut",
                table: "Utilisateurs");

            migrationBuilder.DropColumn(
                name: "DateApprobation",
                table: "Utilisateurs");

            migrationBuilder.DropColumn(
                name: "ApprouvePar",
                table: "Utilisateurs");

            migrationBuilder.DropColumn(
                name: "RaisonRejet",
                table: "Utilisateurs");
        }
    }
}
