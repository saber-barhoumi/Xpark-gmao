using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace XparkGMAO.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChatSystemComplete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Conversations",
                columns: table => new
                {
                    IdConversation = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Titre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TypeConversation = table.Column<string>(type: "text", nullable: false),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DernierMessageDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    ImageGroupe = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    EstArchivee = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Conversations", x => x.IdConversation);
                    table.ForeignKey(
                        name: "FK_Conversations_Utilisateurs_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Utilisateurs",
                        principalColumn: "IdUtilisateur",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UtilisateurStatuts",
                columns: table => new
                {
                    IdStatut = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UtilisateurId = table.Column<long>(type: "bigint", nullable: false),
                    Statut = table.Column<string>(type: "text", nullable: false),
                    DerniereActivite = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MessageCustom = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ConnectionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UtilisateurStatuts", x => x.IdStatut);
                    table.ForeignKey(
                        name: "FK_UtilisateurStatuts_Utilisateurs_UtilisateurId",
                        column: x => x.UtilisateurId,
                        principalTable: "Utilisateurs",
                        principalColumn: "IdUtilisateur",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    IdMessage = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Contenu = table.Column<string>(type: "text", nullable: false),
                    DateEnvoi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TypeMessage = table.Column<string>(type: "text", nullable: false),
                    ExpediteurId = table.Column<long>(type: "bigint", nullable: false),
                    ConversationId = table.Column<long>(type: "bigint", nullable: false),
                    EstLu = table.Column<bool>(type: "boolean", nullable: false),
                    DateLecture = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EstSupprime = table.Column<bool>(type: "boolean", nullable: false),
                    EstModifie = table.Column<bool>(type: "boolean", nullable: false),
                    DateModification = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CheminFichier = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    NomFichier = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TailleFichier = table.Column<long>(type: "bigint", nullable: true),
                    ReponseAMessageId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.IdMessage);
                    table.ForeignKey(
                        name: "FK_ChatMessages_ChatMessages_ReponseAMessageId",
                        column: x => x.ReponseAMessageId,
                        principalTable: "ChatMessages",
                        principalColumn: "IdMessage",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "IdConversation",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Utilisateurs_ExpediteurId",
                        column: x => x.ExpediteurId,
                        principalTable: "Utilisateurs",
                        principalColumn: "IdUtilisateur",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ConversationParticipants",
                columns: table => new
                {
                    IdParticipant = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ConversationId = table.Column<long>(type: "bigint", nullable: false),
                    UtilisateurId = table.Column<long>(type: "bigint", nullable: false),
                    DateAjout = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DerniereLecture = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EstAdmin = table.Column<bool>(type: "boolean", nullable: false),
                    EstEpingle = table.Column<bool>(type: "boolean", nullable: false),
                    NotificationsActivees = table.Column<bool>(type: "boolean", nullable: false),
                    Pseudonyme = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConversationParticipants", x => x.IdParticipant);
                    table.ForeignKey(
                        name: "FK_ConversationParticipants_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "IdConversation",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ConversationParticipants_Utilisateurs_UtilisateurId",
                        column: x => x.UtilisateurId,
                        principalTable: "Utilisateurs",
                        principalColumn: "IdUtilisateur",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MessageReactions",
                columns: table => new
                {
                    IdReaction = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MessageId = table.Column<long>(type: "bigint", nullable: false),
                    UtilisateurId = table.Column<long>(type: "bigint", nullable: false),
                    TypeReaction = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DateReaction = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageReactions", x => x.IdReaction);
                    table.ForeignKey(
                        name: "FK_MessageReactions_ChatMessages_MessageId",
                        column: x => x.MessageId,
                        principalTable: "ChatMessages",
                        principalColumn: "IdMessage",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MessageReactions_Utilisateurs_UtilisateurId",
                        column: x => x.UtilisateurId,
                        principalTable: "Utilisateurs",
                        principalColumn: "IdUtilisateur",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ConversationId",
                table: "ChatMessages",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_DateEnvoi",
                table: "ChatMessages",
                column: "DateEnvoi");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ExpediteurId",
                table: "ChatMessages",
                column: "ExpediteurId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ReponseAMessageId",
                table: "ChatMessages",
                column: "ReponseAMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_ConversationParticipants_ConversationId_UtilisateurId",
                table: "ConversationParticipants",
                columns: new[] { "ConversationId", "UtilisateurId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConversationParticipants_UtilisateurId",
                table: "ConversationParticipants",
                column: "UtilisateurId");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_CreatedByUserId",
                table: "Conversations",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_DernierMessageDate",
                table: "Conversations",
                column: "DernierMessageDate");

            migrationBuilder.CreateIndex(
                name: "IX_MessageReactions_MessageId_UtilisateurId_TypeReaction",
                table: "MessageReactions",
                columns: new[] { "MessageId", "UtilisateurId", "TypeReaction" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MessageReactions_UtilisateurId",
                table: "MessageReactions",
                column: "UtilisateurId");

            migrationBuilder.CreateIndex(
                name: "IX_UtilisateurStatuts_ConnectionId",
                table: "UtilisateurStatuts",
                column: "ConnectionId");

            migrationBuilder.CreateIndex(
                name: "IX_UtilisateurStatuts_UtilisateurId",
                table: "UtilisateurStatuts",
                column: "UtilisateurId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConversationParticipants");

            migrationBuilder.DropTable(
                name: "MessageReactions");

            migrationBuilder.DropTable(
                name: "UtilisateurStatuts");

            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "Conversations");
        }
    }
}
