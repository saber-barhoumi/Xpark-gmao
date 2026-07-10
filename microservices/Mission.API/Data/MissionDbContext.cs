using Microsoft.EntityFrameworkCore;
using Mission.API.Entities;
using MissionEntity = Mission.API.Entities.Mission;

namespace Mission.API.Data;

public class MissionDbContext(DbContextOptions<MissionDbContext> options) : DbContext(options)
{
    public DbSet<MissionEntity> Missions => Set<MissionEntity>();
    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<MissionEntity>(e =>
        {
            e.ToTable("Missions");
            e.HasKey(m => m.IdMission);
            e.Property(m => m.Statut).HasConversion<string>();
        });

        mb.Entity<SupportTicket>(e =>
        {
            e.ToTable("SupportTickets");
            e.HasKey(t => t.IdTicket);
        });

        base.OnModelCreating(mb);
    }
}
