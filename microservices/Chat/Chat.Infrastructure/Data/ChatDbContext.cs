using Chat.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Chat.Infrastructure.Data;

public class ChatDbContext(DbContextOptions<ChatDbContext> options) : DbContext(options)
{
    // DbSet names MUST match the table names created by the monolith EF migrations
    public DbSet<Conversation>             Conversations            { get; set; }
    public DbSet<Message>                  ChatMessages             { get; set; }  // table: ChatMessages
    public DbSet<ConversationParticipant>  ConversationParticipants { get; set; }
    public DbSet<MessageReaction>          MessageReactions         { get; set; }
    public DbSet<UtilisateurStatut>        UtilisateurStatuts       { get; set; }
    public DbSet<ChatUtilisateur>          Utilisateurs             { get; set; }  // shared table owned by IAM

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // ── ChatUtilisateur → "Utilisateurs" (read-shared, no migration) ──────
        b.Entity<ChatUtilisateur>(e =>
        {
            e.ToTable("Utilisateurs");
            e.HasKey(u => u.IdUtilisateur);
        });

        // ── Conversation ──────────────────────────────────────────────────────
        b.Entity<Conversation>(e =>
        {
            e.HasKey(c => c.IdConversation);
            e.Property(c => c.Titre).HasMaxLength(200);
            e.Property(c => c.TypeConversation).HasConversion<string>();
            e.Property(c => c.ImageGroupe).HasMaxLength(500);

            // No FK to ChatUtilisateur for CreatedByUserId — cross-table, just store the id
            e.HasMany(c => c.Messages)
             .WithOne(m => m.Conversation)
             .HasForeignKey(m => m.ConversationId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(c => c.Participants)
             .WithOne(p => p.Conversation)
             .HasForeignKey(p => p.ConversationId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── ConversationParticipant ───────────────────────────────────────────
        b.Entity<ConversationParticipant>(e =>
        {
            e.HasKey(p => p.IdParticipant);
            e.Property(p => p.Pseudonyme).HasMaxLength(100);

            e.HasOne(p => p.Utilisateur)
             .WithMany()
             .HasForeignKey(p => p.UtilisateurId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(p => new { p.ConversationId, p.UtilisateurId }).IsUnique();
        });

        // ── Message (DbSet = ChatMessages → table = ChatMessages) ────────────
        b.Entity<Message>(e =>
        {
            e.HasKey(m => m.IdMessage);
            e.Property(m => m.Contenu).IsRequired();
            e.Property(m => m.TypeMessage).HasConversion<string>();
            e.Property(m => m.CheminFichier).HasMaxLength(500);
            e.Property(m => m.NomFichier).HasMaxLength(200);

            e.HasOne(m => m.Expediteur)
             .WithMany()
             .HasForeignKey(m => m.ExpediteurId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(m => m.MessageParent)
             .WithMany(m => m.Reponses)
             .HasForeignKey(m => m.ReponseAMessageId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(m => m.Reactions)
             .WithOne(r => r.Message)
             .HasForeignKey(r => r.MessageId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── MessageReaction ───────────────────────────────────────────────────
        b.Entity<MessageReaction>(e =>
        {
            e.HasKey(r => r.IdReaction);
            e.Property(r => r.TypeReaction).HasMaxLength(10).IsRequired();

            e.HasOne(r => r.Utilisateur)
             .WithMany()
             .HasForeignKey(r => r.UtilisateurId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(r => new { r.MessageId, r.UtilisateurId, r.TypeReaction }).IsUnique();
        });

        // ── UtilisateurStatut ─────────────────────────────────────────────────
        b.Entity<UtilisateurStatut>(e =>
        {
            e.HasKey(s => s.IdStatut);
            e.Property(s => s.Statut).HasConversion<string>();
            e.Property(s => s.MessageCustom).HasMaxLength(200);
            e.Property(s => s.ConnectionId).HasMaxLength(100);

            e.HasOne(s => s.Utilisateur)
             .WithMany()
             .HasForeignKey(s => s.UtilisateurId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(s => s.UtilisateurId).IsUnique();
        });
    }
}
