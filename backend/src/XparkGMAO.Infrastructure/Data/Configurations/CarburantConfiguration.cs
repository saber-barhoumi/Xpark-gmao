using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.GestionFinance;

namespace XparkGMAO.Infrastructure.Data.Configurations;

public class CarburantConfiguration : IEntityTypeConfiguration<Carburant>
{
    public void Configure(EntityTypeBuilder<Carburant> builder)
    {
        builder.HasKey(c => c.IdCarburant);

        builder.Property(c => c.Quantite).IsRequired();
        builder.Property(c => c.PrixUnitaire).IsRequired();
        builder.Property(c => c.MontantTotal).IsRequired();
        builder.Property(c => c.Kilometrage).IsRequired();

        builder.Property(c => c.TypeCarburant)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.Station)
            .HasMaxLength(200);

        builder.Property(c => c.NumeroBon)
            .HasMaxLength(50);

        // Relations
        builder.HasOne(c => c.Vehicule)
            .WithMany()
            .HasForeignKey(c => c.VehiculeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Source)
            .WithMany(s => s.ConsommationsCarburant)
            .HasForeignKey(c => c.SourceId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(c => c.VehiculeId);
        builder.HasIndex(c => c.SourceId);
        builder.HasIndex(c => c.DateRemplissage);
    }
}
