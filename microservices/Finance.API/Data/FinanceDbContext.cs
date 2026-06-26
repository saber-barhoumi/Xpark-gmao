using Finance.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Finance.API.Data;

public class FinanceDbContext(DbContextOptions<FinanceDbContext> options) : DbContext(options)
{
    public DbSet<Facture> Factures { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.HasDefaultSchema("finance");

        mb.Entity<Facture>(e =>
        {
            e.ToTable("Factures");
            e.HasKey(f => f.IdFacture);
            e.Property(f => f.Statut).HasConversion<string>();
        });

        base.OnModelCreating(mb);
    }
}
