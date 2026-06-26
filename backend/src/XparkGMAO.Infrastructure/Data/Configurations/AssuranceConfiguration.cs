using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionFinance;

namespace XparkGMAO.Infrastructure.Data.Configurations;

public class AssuranceConfiguration : IEntityTypeConfiguration<Assurance>
{
    public void Configure(EntityTypeBuilder<Assurance> builder)
    {
        builder.HasKey(a => a.IdAssurance);

        builder.Property(a => a.Compagnie).IsRequired().HasMaxLength(200);
        builder.Property(a => a.NumeroPolice).IsRequired().HasMaxLength(100);
        builder.Property(a => a.TypeAssurance).HasMaxLength(100);

        builder.HasIndex(a => a.NumeroPolice).IsUnique();

        builder.ToTable("Assurances");
    }
}

public class DocumentAdministratifConfiguration : IEntityTypeConfiguration<DocumentAdministratif>
{
    public void Configure(EntityTypeBuilder<DocumentAdministratif> builder)
    {
        builder.HasKey(d => d.IdDocument);

        builder.Property(d => d.TypeDocument).IsRequired().HasMaxLength(100);
        builder.Property(d => d.NumeroDocument).HasMaxLength(100);
        builder.Property(d => d.FichierPath).HasMaxLength(500);

        builder.ToTable("DocumentsAdministratifs");
    }
}


