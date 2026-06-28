using Microsoft.EntityFrameworkCore;
using MissionEntity = Mission.API.Entities.Mission;

namespace Mission.API.Data;

public class MissionDbContext(DbContextOptions<MissionDbContext> options) : DbContext(options)
{
    public DbSet<MissionEntity> Missions => Set<MissionEntity>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<MissionEntity>(e =>
        {
            e.ToTable("Missions");
            e.HasKey(m => m.IdMission);
            e.Property(m => m.Statut).HasConversion<string>();
        });

        base.OnModelCreating(mb);
    }
}
