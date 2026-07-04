using Microsoft.EntityFrameworkCore;
using XparkGMAO.Shared.AiTelemetry.Entities;

namespace XparkGMAO.Shared.AiTelemetry.Data;

public class AiTelemetryDbContext(DbContextOptions<AiTelemetryDbContext> options) : DbContext(options)
{
    public DbSet<AiTripTrainingData> AiTripTrainingData => Set<AiTripTrainingData>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<AiTripTrainingData>(e =>
        {
            e.ToTable("AiTripTrainingData");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).UseIdentityAlwaysColumn();

            // String lengths — match what CSV headers will hold
            e.Property(x => x.Destination).HasMaxLength(255).IsRequired();
            e.Property(x => x.Season).HasMaxLength(10).IsRequired();
            e.Property(x => x.VehicleType).HasMaxLength(30).IsRequired();
            e.Property(x => x.DataSourceVersion).HasMaxLength(30).HasDefaultValue("v1");

            // Precision for double columns (PostgreSQL defaults to float8 — explicit for clarity)
            e.Property(x => x.DistanceKm).HasColumnType("float8");
            e.Property(x => x.EstimatedTollCostDt).HasColumnType("float8");
            e.Property(x => x.FuelConsumptionPer100Km).HasColumnType("float8");
            e.Property(x => x.DriverTripAllowanceDt).HasColumnType("float8");
            e.Property(x => x.ActualCoutTotal).HasColumnType("float8");

            // NO foreign key constraints — this table is append-only analytical data
            e.HasIndex(x => x.MissionId).HasDatabaseName("IX_AiTripTrainingData_MissionId");
            e.HasIndex(x => x.LoggedAt).HasDatabaseName("IX_AiTripTrainingData_LoggedAt");
            e.HasIndex(x => x.Season).HasDatabaseName("IX_AiTripTrainingData_Season");
        });

        base.OnModelCreating(mb);
    }
}
