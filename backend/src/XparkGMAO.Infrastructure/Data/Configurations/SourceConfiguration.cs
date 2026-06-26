using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.GestionFlotte;

namespace XparkGMAO.Infrastructure.Data.Configurations;

public class SourceConfiguration : IEntityTypeConfiguration<Source>
{
    public void Configure(EntityTypeBuilder<Source> builder)
    {
        builder.HasKey(s => s.IdSource);

        builder.Property(s => s.NomSource)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.TypeSource)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(s => s.Adresse).HasMaxLength(300);
        builder.Property(s => s.Ville).HasMaxLength(100);
        builder.Property(s => s.PrixMoyen).HasPrecision(18, 3);
        builder.Property(s => s.RemiseFiotte).HasPrecision(5, 2);
        builder.Property(s => s.CodeCarte).HasMaxLength(50);

        builder.HasIndex(s => s.TypeSource);
        builder.HasIndex(s => s.Actif);

        // Relation: Source → ConsommationsCarburant (via FK SourceId on Carburant)
        builder.HasMany(s => s.ConsommationsCarburant)
            .WithOne(c => c.Source)
            .HasForeignKey(c => c.SourceId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
