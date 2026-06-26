using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.GestionOperations;

namespace XparkGMAO.Infrastructure.Data.Configurations;

public class MissionConfiguration : IEntityTypeConfiguration<Mission>
{
    public void Configure(EntityTypeBuilder<Mission> builder)
    {
        builder.HasKey(m => m.IdMission);

        builder.Property(m => m.Destination).IsRequired().HasMaxLength(500);
        builder.Property(m => m.ObjetMission).IsRequired().HasMaxLength(1000);

        builder.Property(m => m.Statut).HasConversion<string>();

        builder.HasOne(m => m.Employee)
               .WithMany(e => e.Missions)
               .HasForeignKey(m => m.EmployeeId)
               .OnDelete(DeleteBehavior.Restrict);
 
        builder.HasOne(m => m.Vehicule)
               .WithMany(v => v.Missions)
               .HasForeignKey(m => m.VehiculeId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable("Missions");
    }
}
