using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.GestionFinance;

namespace XparkGMAO.Infrastructure.Data.Configurations;

public class FactureConfiguration : IEntityTypeConfiguration<Facture>
{
    public void Configure(EntityTypeBuilder<Facture> builder)
    {
        builder.HasKey(f => f.IdFacture);

        builder.Property(f => f.NumeroFacture).IsRequired().HasMaxLength(50);
        builder.Property(f => f.ModePaiement).HasMaxLength(100);
        builder.Property(f => f.Notes).HasMaxLength(1000);

        builder.HasIndex(f => f.NumeroFacture).IsUnique();

        builder.Property(f => f.Statut).HasConversion<string>();

        builder.ToTable("Factures");
    }
}
