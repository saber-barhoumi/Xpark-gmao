using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mission.Application.Interfaces;
using Mission.Application.Services;
using XparkGMAO.Shared.AiTelemetry.Data;
using Microsoft.EntityFrameworkCore;

namespace Mission.API.Controllers;

/// <summary>
/// Admin-only endpoints for AI training-data operations.
/// These routes are intentionally NOT included in the public API surface.
/// </summary>
[ApiController]
[Route("api/ai-data")]
[Authorize(Roles = "ADMIN")]
public class DataMigrationController(
    IHistoricalMigrationService migrationService,
    AiTelemetryDbContext        aiDb) : ControllerBase
{
    /// <summary>
    /// Triggers a full historical backfill.
    /// Idempotent — already-migrated missions are automatically skipped.
    ///
    /// NOTE: For datasets with thousands of missions this request may take
    /// several minutes. Consider calling it from a background job in production.
    /// </summary>
    [HttpPost("migrate-historical")]
    public async Task<IActionResult> MigrateHistorical(CancellationToken ct)
    {
        var summary = await migrationService.MigrateHistoricalMissionsAsync(ct);

        return Ok(new
        {
            message          = "Historical migration completed.",
            totalFound       = summary.TotalTermineeMissions,
            alreadyPresent   = summary.AlreadyPresent,
            newlyMigrated    = summary.NewlyMigrated,
            failed           = summary.Failed,
            durationSeconds  = summary.Duration.TotalSeconds,
        });
    }

    /// <summary>
    /// Returns a quick summary of what is currently stored in AiTripTrainingData —
    /// useful for verifying the migration ran and checking dataset coverage.
    /// </summary>
    [HttpGet("dataset-stats")]
    public async Task<IActionResult> GetDatasetStats(CancellationToken ct)
    {
        var total = await aiDb.AiTripTrainingData.CountAsync(ct);

        var bySeason = await aiDb.AiTripTrainingData
            .GroupBy(x => x.Season)
            .Select(g => new { season = g.Key, count = g.Count() })
            .ToListAsync(ct);

        var byVehicleType = await aiDb.AiTripTrainingData
            .GroupBy(x => x.VehicleType)
            .Select(g => new { vehicleType = g.Key, count = g.Count() })
            .ToListAsync(ct);

        var avgCout = total > 0
            ? await aiDb.AiTripTrainingData.AverageAsync(x => x.ActualCoutTotal, ct)
            : 0;

        return Ok(new
        {
            totalRows       = total,
            averageCoutTotal = Math.Round(avgCout, 2),
            bySeason,
            byVehicleType,
        });
    }
}
