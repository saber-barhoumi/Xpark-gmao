using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using XparkGMAO.Core.Entities.Reporting;

namespace XparkGMAO.Infrastructure.Data.Configurations;

public class RapportIAConfiguration : IEntityTypeConfiguration<RapportIA>
{
    public void Configure(EntityTypeBuilder<RapportIA> builder)
    {
        builder.HasKey(r => r.IdRapport);

        builder.Property(r => r.Titre).IsRequired().HasMaxLength(200);
        builder.Property(r => r.TypeRapport).HasConversion<string>();

        builder.ToTable("RapportsIA");
    }
}
