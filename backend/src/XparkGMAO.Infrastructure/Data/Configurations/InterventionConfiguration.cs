using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.GestionMaintenance;

namespace XparkGMAO.Infrastructure.Data.Configurations;

public class OrdreTravailConfiguration : IEntityTypeConfiguration<OrdreTravail>
{
    public void Configure(EntityTypeBuilder<OrdreTravail> builder)
    {
        builder.HasKey(ot => ot.IdOrdreTravail);
        builder.Property(ot => ot.Reference).IsRequired().HasMaxLength(50);
        builder.HasIndex(ot => ot.Reference).IsUnique();
        builder.Property(ot => ot.Description).HasMaxLength(1000);
        builder.Property(ot => ot.Observations).HasMaxLength(1000);
        builder.Property(ot => ot.Statut).HasConversion<string>();
        builder.Property(ot => ot.CoutReel).HasPrecision(18, 2);

        builder.HasOne(ot => ot.Vehicule)
            .WithMany()
            .HasForeignKey(ot => ot.VehiculeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ot => ot.Technicien)
            .WithMany()
            .HasForeignKey(ot => ot.TechnicienId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(ot => ot.Interventions)
            .WithOne(i => i.OrdreTravail)
            .HasForeignKey(i => i.OrdreTravailId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Ignore(ot => ot.CoutEstime);
        builder.Ignore(ot => ot.NombreInterventions);
        builder.ToTable("OrdresTravail");
    }
}

public class InterventionConfiguration : IEntityTypeConfiguration<Intervention>
{
    public void Configure(EntityTypeBuilder<Intervention> builder)
    {
        builder.HasKey(i => i.IdIntervention);

        builder.Property(i => i.Description).IsRequired().HasMaxLength(1000);
        builder.Property(i => i.Observations).HasMaxLength(1000);
        builder.Property(i => i.Prestataire).HasMaxLength(200);
        builder.Property(i => i.TypePeriodicite).HasMaxLength(10);

        builder.Property(i => i.TypeIntervention).HasConversion<string>();
        builder.Property(i => i.Statut).HasConversion<string>();

        builder.HasMany(i => i.InterventionPieces)
               .WithOne(ip => ip.Intervention)
               .HasForeignKey(ip => ip.InterventionId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("Interventions");
    }
}

public class InterventionPieceConfiguration : IEntityTypeConfiguration<InterventionPiece>
{
    public void Configure(EntityTypeBuilder<InterventionPiece> builder)
    {
        builder.HasKey(ip => ip.IdInterventionPiece);

        builder.HasOne(ip => ip.Piece)
               .WithMany()
               .HasForeignKey(ip => ip.PieceId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable("InterventionPieces");
    }
}

public class PieceRechangeConfiguration : IEntityTypeConfiguration<PieceRechange>
{
    public void Configure(EntityTypeBuilder<PieceRechange> builder)
    {
        builder.HasKey(p => p.IdPiece);

        builder.Property(p => p.Reference).IsRequired().HasMaxLength(100);
        builder.Property(p => p.Designation).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Categorie).HasConversion<string>();

        builder.ToTable("PiecesRechange");
    }
}
