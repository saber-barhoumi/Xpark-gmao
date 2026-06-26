using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.GestionAlertes;

namespace XparkGMAO.Infrastructure.Data.Configurations;

public class AlerteConfiguration : IEntityTypeConfiguration<Alerte>
{
    public void Configure(EntityTypeBuilder<Alerte> builder)
    {
        builder.HasKey(a => a.IdAlerte);

        builder.Property(a => a.Message).IsRequired().HasMaxLength(1000);
        builder.Property(a => a.EntiteReference).HasMaxLength(100);

        builder.Property(a => a.TypeAlerte).HasConversion<string>();
        builder.Property(a => a.Priorite).HasConversion<string>();
        builder.Property(a => a.Statut).HasConversion<string>();

        builder.HasOne(a => a.Utilisateur)
               .WithMany()
               .HasForeignKey(a => a.UtilisateurId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.ToTable("Alertes");
    }
}
