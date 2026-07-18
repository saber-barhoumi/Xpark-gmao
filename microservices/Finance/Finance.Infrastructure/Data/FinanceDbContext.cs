using Finance.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Finance.Infrastructure.Data;

public class FinanceDbContext(DbContextOptions<FinanceDbContext> options) : DbContext(options)
{
    public DbSet<Facture> Factures { get; set; }
    // Lecture seule (enrichissement des DTOs) — base partagée
    public DbSet<UtilisateurRef> Utilisateurs { get; set; }
    public DbSet<MissionRef> MissionsRef { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Facture>(e =>
        {
            e.ToTable("Factures");
            e.HasKey(f => f.IdFacture);
            e.Property(f => f.Statut).HasConversion<string>();
        });

        base.OnModelCreating(mb);
    }
}
