using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Mission.Infrastructure.Data;
using Mission.Domain.Entities;
using XparkGMAO.Shared.AiTelemetry.Clients;
using XparkGMAO.Shared.AiTelemetry.Data;
using XparkGMAO.Shared.AiTelemetry.Entities;

namespace Mission.Infrastructure.Services;

/// <summary>
/// One-time (idempotent) historical backfill:
///   1. Reads all TERMINEE missions from MissionDbContext.
///   2. Skips any MissionId already present in AiTripTrainingData.
///   3. For each remaining mission: fires parallel HttpClient calls to
///      Fleet.API and Finance.API to enrich vehicle/driver features.
///   4. Saves in configurable batches (default 100) to keep memory flat.
///
/// External-service failures per row are isolated: the row is skipped and
/// logged, the rest of the batch continues unaffected.
/// </summary>
public sealed class HistoricalMigrationService(
    MissionDbContext                    missionDb,
    AiTelemetryDbContext                aiDb,
    IFleetServiceClient                 fleetClient,
    IFinanceServiceClient               financeClient,
    ILogger<HistoricalMigrationService> logger) : IHistoricalMigrationService
{
    private const int    BatchSize        = 100;
    private const double TollCostDt       = 12.0;   // flat DT per autoroute trip
    private const string SchemaVersion    = "v1-historical";

    public async Task<MigrationSummary> MigrateHistoricalMissionsAsync(CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();

        // ── 1. Load candidate missions (read-only, no EF tracking overhead) ──
        var missions = await missionDb.Missions
            .Where(m => m.Statut == StatutMission.TERMINEE)
            .AsNoTracking()
            .OrderBy(m => m.DateDepart)   // deterministic order for debugging
            .ToListAsync(ct);

        int totalTerminee = missions.Count;

        if (totalTerminee == 0)
        {
            logger.LogInformation("[HistoricalMigration] No TERMINEE missions found. Nothing to do.");
            return new MigrationSummary(0, 0, 0, 0, sw.Elapsed);
        }

        // ── 2. Identify already-migrated IDs in one round-trip ───────────────
        // HashSet<long> for O(1) lookup during filtering
        var existingIds = (await aiDb.AiTripTrainingData
            .Select(x => x.MissionId)
            .ToListAsync(ct))
            .ToHashSet();

        var pending = missions
            .Where(m => !existingIds.Contains(m.IdMission))
            .ToList();

        int alreadyPresent = totalTerminee - pending.Count;

        logger.LogInformation(
            "[HistoricalMigration] {Total} TERMINEE missions found. " +
            "{Skip} already in dataset. {Process} to process.",
            totalTerminee, alreadyPresent, pending.Count);

        if (pending.Count == 0)
        {
            return new MigrationSummary(totalTerminee, alreadyPresent, 0, 0, sw.Elapsed);
        }

        // ── 3. Process in batches ─────────────────────────────────────────────
        int newlyMigrated = 0;
        int failed        = 0;

        foreach (var batch in pending.Chunk(BatchSize))
        {
            var rows = new List<AiTripTrainingData>(batch.Length);

            foreach (var mission in batch)
            {
                if (ct.IsCancellationRequested) break;

                try
                {
                    var row = await BuildRowAsync(mission, ct);
                    rows.Add(row);
                }
                catch (Exception ex)
                {
                    // Isolate per-row failures — log and continue
                    failed++;
                    logger.LogWarning(ex,
                        "[HistoricalMigration] MissionId={Id} failed. Skipping.",
                        mission.IdMission);
                }
            }

            if (rows.Count > 0)
            {
                // ── 4. Batch save ─────────────────────────────────────────
                await aiDb.AiTripTrainingData.AddRangeAsync(rows, ct);
                await aiDb.SaveChangesAsync(ct);

                // Detach all tracked entities so memory stays flat across batches
                aiDb.ChangeTracker.Clear();

                newlyMigrated += rows.Count;

                logger.LogInformation(
                    "[HistoricalMigration] Batch saved: +{BatchCount} rows | " +
                    "Running total: {Total} migrated, {Fail} failed.",
                    rows.Count, newlyMigrated, failed);
            }
        }

        sw.Stop();
        var summary = new MigrationSummary(totalTerminee, alreadyPresent, newlyMigrated, failed, sw.Elapsed);
        logger.LogInformation("[HistoricalMigration] Done — {Summary}", summary);

        return summary;
    }

    // ── Private: builds one AiTripTrainingData row from one mission ───────────

    private async Task<AiTripTrainingData> BuildRowAsync(
        Mission.Domain.Entities.Mission mission,
        CancellationToken ct)
    {
        // Fire both external calls concurrently — they are independent
        var vehicleTask   = fleetClient.GetVehicleInfoAsync(mission.VehiculeId ?? 0, ct);
        var allowanceTask = financeClient.GetDriverAllowanceAsync(mission.EmployeeId ?? 0, ct);
        await Task.WhenAll(vehicleTask, allowanceTask);

        var vehicle   = vehicleTask.Result;
        var allowance = allowanceTask.Result;

        // ── Local feature extraction ─────────────────────────────────────────
        double distance    = Math.Max(0, mission.KilometrageRetour - mission.KilometrageDepart);
        int dayOfWeekIso   = mission.DateDepart.DayOfWeek == DayOfWeek.Sunday
                                 ? 7
                                 : (int)mission.DateDepart.DayOfWeek;
        int    hourOfDay   = mission.DateDepart.Hour;
        string season      = ResolveSeason(mission.DateDepart.Month);
        double tollCostDt  = mission.CarteAutorouteRemise ? TollCostDt : 0.0;

        return new AiTripTrainingData
        {
            MissionId               = mission.IdMission,
            Destination             = mission.Destination,
            DateDepart              = mission.DateDepart,
            DistanceKm              = distance,
            DayOfWeekIso            = dayOfWeekIso,
            HourOfDay               = hourOfDay,
            Season                  = season,
            HasAutoroute            = mission.CarteAutorouteRemise,
            EstimatedTollCostDt     = tollCostDt,
            VehiculeId              = mission.VehiculeId ?? 0,
            VehicleType             = vehicle.VehicleType,
            FuelConsumptionPer100Km = vehicle.FuelConsumptionPer100Km,
            EmployeeId              = mission.EmployeeId ?? 0,
            DriverTripAllowanceDt   = allowance.TripAllowanceDt,
            ActualCoutTotal         = mission.CoutTotal,
            LoggedAt                = DateTime.UtcNow,
            DataSourceVersion       = SchemaVersion,
        };
    }

    private static string ResolveSeason(int month) => month switch
    {
        3 or 4 or 5   => "Spring",
        6 or 7 or 8   => "Summer",
        9 or 10 or 11 => "Autumn",
        _             => "Winter",
    };
}
