using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.Chat;

namespace XparkGMAO.Infrastructure.Data.Configurations
{
    public class ConversationConfiguration : IEntityTypeConfiguration<Conversation>
    {
        public void Configure(EntityTypeBuilder<Conversation> builder)
        {
            builder.HasKey(c => c.IdConversation);
            builder.Property(c => c.Titre).HasMaxLength(200);
            builder.Property(c => c.ImageGroupe).HasMaxLength(500);
            builder.Property(c => c.TypeConversation).HasConversion<string>();

            builder.HasOne(c => c.CreatedByUser)
                .WithMany()
                .HasForeignKey(c => c.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(c => c.Messages)
                .WithOne(m => m.Conversation)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(c => c.Participants)
                .WithOne(p => p.Conversation)
                .HasForeignKey(p => p.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(c => c.DernierMessageDate);
        }
    }

    public class ConversationParticipantConfiguration : IEntityTypeConfiguration<ConversationParticipant>
    {
        public void Configure(EntityTypeBuilder<ConversationParticipant> builder)
        {
            builder.HasKey(p => p.IdParticipant);
            builder.Property(p => p.Pseudonyme).HasMaxLength(100);

            builder.HasOne(p => p.Utilisateur)
                .WithMany()
                .HasForeignKey(p => p.UtilisateurId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(p => new { p.ConversationId, p.UtilisateurId }).IsUnique();
        }
    }

    public class MessageConfiguration : IEntityTypeConfiguration<Message>
    {
        public void Configure(EntityTypeBuilder<Message> builder)
        {
            builder.HasKey(m => m.IdMessage);
            builder.Property(m => m.Contenu).IsRequired();
            builder.Property(m => m.TypeMessage).HasConversion<string>();
            builder.Property(m => m.CheminFichier).HasMaxLength(500);
            builder.Property(m => m.NomFichier).HasMaxLength(200);

            builder.HasOne(m => m.Expediteur)
                .WithMany()
                .HasForeignKey(m => m.ExpediteurId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(m => m.MessageParent)
                .WithMany(m => m.Reponses)
                .HasForeignKey(m => m.ReponseAMessageId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(m => m.Reactions)
                .WithOne(r => r.Message)
                .HasForeignKey(r => r.MessageId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(m => m.DateEnvoi);
            builder.HasIndex(m => m.ConversationId);
        }
    }

    public class MessageReactionConfiguration : IEntityTypeConfiguration<MessageReaction>
    {
        public void Configure(EntityTypeBuilder<MessageReaction> builder)
        {
            builder.HasKey(r => r.IdReaction);
            builder.Property(r => r.TypeReaction).HasMaxLength(10).IsRequired();

            builder.HasOne(r => r.Utilisateur)
                .WithMany()
                .HasForeignKey(r => r.UtilisateurId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(r => new { r.MessageId, r.UtilisateurId, r.TypeReaction }).IsUnique();
        }
    }

    public class UtilisateurStatutConfiguration : IEntityTypeConfiguration<UtilisateurStatut>
    {
        public void Configure(EntityTypeBuilder<UtilisateurStatut> builder)
        {
            builder.HasKey(s => s.IdStatut);
            builder.Property(s => s.Statut).HasConversion<string>();
            builder.Property(s => s.MessageCustom).HasMaxLength(200);
            builder.Property(s => s.ConnectionId).HasMaxLength(100);

            builder.HasOne(s => s.Utilisateur)
                .WithMany()
                .HasForeignKey(s => s.UtilisateurId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(s => s.UtilisateurId).IsUnique();
            builder.HasIndex(s => s.ConnectionId);
        }
    }
}
