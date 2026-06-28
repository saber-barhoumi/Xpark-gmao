namespace Mission.API.Services;

public interface IHistoricalMigrationService
{
    /// <summary>
    /// Scans all missions with Statut == TERMINEE, skips rows already present in
    /// AiTripTrainingData, and writes the missing ones in batches.
    /// Safe to call multiple times — idempotent by design.
    /// </summary>
    Task<MigrationSummary> MigrateHistoricalMissionsAsync(CancellationToken ct = default);
}

/// <summary>
/// Returned after the migration completes — use this to build a status response
/// or write a structured log entry.
/// </summary>
public sealed record MigrationSummary(
    int      TotalTermineeMissions,
    int      AlreadyPresent,
    int      NewlyMigrated,
    int      Failed,
    TimeSpan Duration
)
{
    public override string ToString() =>
        $"Total={TotalTermineeMissions} | Skipped={AlreadyPresent} | " +
        $"New={NewlyMigrated} | Failed={Failed} | Duration={Duration:mm\\:ss\\.fff}";
}
