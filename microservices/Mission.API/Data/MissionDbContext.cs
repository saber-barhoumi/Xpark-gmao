using Microsoft.EntityFrameworkCore;
using Mission.API.Entities;
using MissionEntity = Mission.API.Entities.Mission;

namespace Mission.API.Data;

public class MissionDbContext(DbContextOptions<MissionDbContext> options) : DbContext(options)
{
    public DbSet<MissionEntity>     Missions => Set<MissionEntity>();
    public DbSet<SupportTicket>     SupportTickets => Set<SupportTicket>();
    public DbSet<LivePosition>      LivePositions => Set<LivePosition>();
    public DbSet<TransportRequest>  TransportRequests => Set<TransportRequest>();

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

        mb.Entity<LivePosition>(e =>
        {
            e.ToTable("LivePositions");
            e.HasKey(p => p.IdPosition);
        });

        mb.Entity<TransportRequest>(e =>
        {
            e.ToTable("TransportRequests");
            e.HasKey(t => t.IdTransportRequest);
            e.Property(t => t.Statut).HasConversion<string>();
            e.Property(t => t.PricingMethod).HasConversion<string>();
        });

        base.OnModelCreating(mb);
    }
}
