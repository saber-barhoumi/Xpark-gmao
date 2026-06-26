using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.GestionFlotte;

namespace XparkGMAO.Infrastructure.Data.Configurations;

public class VehiculeConfiguration : IEntityTypeConfiguration<Vehicule>
{
    public void Configure(EntityTypeBuilder<Vehicule> builder)
    {
        builder.HasKey(v => v.IdVehicule);

        builder.Property(v => v.Marque).IsRequired().HasMaxLength(100);
        builder.Property(v => v.Modele).IsRequired().HasMaxLength(100);
        builder.Property(v => v.Immatriculation).IsRequired().HasMaxLength(20);
        builder.Property(v => v.NumeroChassis).IsRequired().HasMaxLength(50);
        builder.Property(v => v.Couleur).HasMaxLength(50);
        builder.Property(v => v.Photo).HasMaxLength(500);

        builder.HasIndex(v => v.Immatriculation).IsUnique();
        builder.HasIndex(v => v.NumeroChassis).IsUnique();

        builder.Property(v => v.Statut).HasConversion<string>();
        builder.Property(v => v.TypeCarburant).HasConversion<string>();
        builder.Property(v => v.TypeVehicule).HasConversion<string>();

        // Relations
        builder.HasMany(v => v.Interventions)
               .WithOne(i => i.Vehicule)
               .HasForeignKey(i => i.VehiculeId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(v => v.Missions)
               .WithOne(m => m.Vehicule)
               .HasForeignKey(m => m.VehiculeId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(v => v.Assurances)
               .WithOne(a => a.Vehicule)
               .HasForeignKey(a => a.VehiculeId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(v => v.Documents)
               .WithOne(d => d.Vehicule)
               .HasForeignKey(d => d.VehiculeId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(v => v.Carburants)
               .WithOne(c => c.Vehicule)
               .HasForeignKey(c => c.VehiculeId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("Vehicules");
    }
}
