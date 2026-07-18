using Alerts.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Alerts.Infrastructure.Data;

public class AlertsDbContext(DbContextOptions<AlertsDbContext> options) : DbContext(options)
{
    public DbSet<Alerte> Alertes { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Alerte>(e =>
        {
            e.ToTable("Alertes");
            e.HasKey(a => a.IdAlerte);
            e.Property(a => a.TypeAlerte).HasConversion<string>();
            e.Property(a => a.Priorite).HasConversion<string>();
            e.Property(a => a.Statut).HasConversion<string>();
        });

        base.OnModelCreating(mb);
    }
}
