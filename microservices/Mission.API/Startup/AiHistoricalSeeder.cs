using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Mission.API.Services;

namespace Mission.API.Startup;

/// <summary>
/// One-time startup seeder that backfills AiTripTrainingData with all historical
/// TERMINEE missions that existed before the AI telemetry package was introduced.
///
/// HOW TO USE
/// ──────────
/// 1. Call AiHistoricalSeeder.MigrateHistoricalMissionsAsync(app.Services)
///    in Program.cs right after app.Services.EnsureAiTelemetryTable().
/// 2. Start the application once — the method is idempotent (already-migrated rows
///    are skipped automatically) so re-running is always safe.
/// 3. Once confirmed in logs, comment the call out (or leave it — it costs only
///    one fast COUNT query on subsequent starts when nothing is left to migrate).
/// </summary>
public static class AiHistoricalSeeder
{
    /// <summary>
    /// Resolves <see cref="IHistoricalMigrationService"/> from the DI container
    /// and runs the full historical backfill inside its own scoped lifetime.
    /// All batching, idempotency, and error isolation are handled by the service.
    /// </summary>
    public static async Task MigrateHistoricalMissionsAsync(
        IServiceProvider  serviceProvider,
        CancellationToken ct = default)
    {
        // Create a fresh DI scope — required because the migration service
        // depends on scoped DbContext instances.
        await using var scope = serviceProvider.CreateAsyncScope();

        var logger = scope.ServiceProvider
            .GetRequiredService<ILogger<IHistoricalMigrationService>>();

        logger.LogInformation(
            "[AiHistoricalSeeder] Starting one-time historical migration...");

        var migrationService = scope.ServiceProvider
            .GetRequiredService<IHistoricalMigrationService>();

        var summary = await migrationService.MigrateHistoricalMissionsAsync(ct);

        if (summary.NewlyMigrated > 0 || summary.Failed > 0)
        {
            logger.LogInformation(
                "[AiHistoricalSeeder] Completed — " +
                "Total={Total} | Skipped={Skip} | Migrated={New} | Failed={Fail} | Duration={Dur}",
                summary.TotalTermineeMissions,
                summary.AlreadyPresent,
                summary.NewlyMigrated,
                summary.Failed,
                summary.Duration);
        }
        else
        {
            logger.LogInformation(
                "[AiHistoricalSeeder] Nothing to migrate ({Total} missions already in dataset).",
                summary.AlreadyPresent);
        }
    }
}
