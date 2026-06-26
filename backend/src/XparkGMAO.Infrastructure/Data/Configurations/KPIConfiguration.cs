using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.Dashboard;

namespace XparkGMAO.Infrastructure.Data.Configurations
{
    public class KPIConfiguration : IEntityTypeConfiguration<KPI>
    {
        public void Configure(EntityTypeBuilder<KPI> builder)
        {
            builder.HasKey(k => k.IdKPI);

            builder.Property(k => k.Nom)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(k => k.CodeKPI)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(k => k.CodeKPI);

            builder.Property(k => k.Unite)
                .HasMaxLength(50);

            builder.Property(k => k.Icone)
                .HasMaxLength(100);

            builder.Property(k => k.Couleur)
                .HasMaxLength(50);

            builder.Property(k => k.Description)
                .HasMaxLength(500);

            builder.Property(k => k.Tendance)
                .HasConversion<string>();

            builder.Property(k => k.Categorie)
                .HasConversion<string>();

            builder.HasIndex(k => k.DateCalcul);
            builder.HasIndex(k => k.Categorie);
        }
    }

    public class TableauDeBordConfiguration : IEntityTypeConfiguration<TableauDeBord>
    {
        public void Configure(EntityTypeBuilder<TableauDeBord> builder)
        {
            builder.HasKey(t => t.IdDashboard);

            builder.Property(t => t.Nom)
                .HasMaxLength(200);

            // Relation avec Utilisateur
            builder.HasOne(t => t.Utilisateur)
                .WithMany()
                .HasForeignKey(t => t.UtilisateurId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(t => t.UtilisateurId);
            builder.HasIndex(t => t.EstParDefaut);
        }
    }
}
