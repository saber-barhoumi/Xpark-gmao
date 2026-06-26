using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionFlotte;

namespace XparkGMAO.Infrastructure.Data.Configurations;

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employees");

        builder.HasKey(e => e.IdEmployee);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Prenom)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.NumeroMatricule)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.Telephone)
            .HasMaxLength(20);

        builder.Property(e => e.Post)
            .HasConversion<string>();

        builder.Property(e => e.Service)
            .HasConversion<string>();

        builder.Property(e => e.Statut)
            .HasConversion<string>();

        // Specialized fields
        builder.Property(e => e.NumeroPermis).HasMaxLength(50);
        builder.Property(e => e.CategoriePermis).HasConversion<string>();
        builder.Property(e => e.Specialty).HasConversion<string>();
        builder.Property(e => e.Level).HasConversion<string>();

        builder.HasMany(e => e.Missions)
            .WithOne(m => m.Employee)
            .HasForeignKey(m => m.EmployeeId);
    }
}
