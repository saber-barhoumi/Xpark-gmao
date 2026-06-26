using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.IntelligenceArtificielle;

namespace XparkGMAO.Infrastructure.Data.Configurations;

public class TrajetCalculeConfiguration : IEntityTypeConfiguration<TrajetCalcule>
{
    public void Configure(EntityTypeBuilder<TrajetCalcule> builder)
    {
        builder.HasKey(t => t.IdTrajet);

        builder.Property(t => t.Origine).IsRequired().HasMaxLength(300);
        builder.Property(t => t.Destination).IsRequired().HasMaxLength(300);

        builder.ToTable("TrajetsCalcules");
    }
}

public class PredictionPanneConfiguration : IEntityTypeConfiguration<PredictionPanne>
{
    public void Configure(EntityTypeBuilder<PredictionPanne> builder)
    {
        builder.HasKey(p => p.IdPrediction);

        builder.Property(p => p.TypePanne).IsRequired().HasMaxLength(200);

        builder.ToTable("PredictionsPannes");
    }
}

public class CalculateurPrixTrajetIAConfiguration : IEntityTypeConfiguration<CalculateurPrixTrajetIA>
{
    public void Configure(EntityTypeBuilder<CalculateurPrixTrajetIA> builder)
    {
        builder.HasKey(c => c.IdCalculateur);

        builder.Property(c => c.ModeleIA).IsRequired().HasMaxLength(200);
        builder.Property(c => c.VersionModele).IsRequired().HasMaxLength(100);

        builder.ToTable("CalculateursPrixTrajet");
    }
}
