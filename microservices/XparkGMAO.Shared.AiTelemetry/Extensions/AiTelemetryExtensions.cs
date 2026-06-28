using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using XparkGMAO.Shared.AiTelemetry.Clients;
using XparkGMAO.Shared.AiTelemetry.Data;
using XparkGMAO.Shared.AiTelemetry.Services;

namespace XparkGMAO.Shared.AiTelemetry.Extensions;

public static class AiTelemetryExtensions
{
    /// <summary>
    /// Registers the full AI telemetry pipeline:
    ///   - AiTelemetryDbContext  (writes to AiTripTrainingData table)
    ///   - FleetServiceClient    (typed HttpClient → Fleet.API)
    ///   - FinanceServiceClient  (typed HttpClient → Finance.API)
    ///   - AiDataCollectorService
    ///
    /// Call this from Program.cs of any microservice that triggers data collection.
    /// Then call EnsureAiTelemetryTable(app.Services) after app.Build() to create
    /// the table on first run.
    /// </summary>
    public static IServiceCollection AddAiTelemetry(
        this IServiceCollection services,
        string connectionString,
        string fleetApiBaseUrl,
        string financeApiBaseUrl)
    {
        // Separate DbContext so this library stays independent of the host's main DbContext
        services.AddDbContext<AiTelemetryDbContext>(opt =>
            opt.UseNpgsql(connectionString));

        services.AddHttpClient<IFleetServiceClient, FleetServiceClient>(client =>
        {
            client.BaseAddress = new Uri(fleetApiBaseUrl.TrimEnd('/') + "/");
            client.Timeout     = TimeSpan.FromSeconds(5);
        });

        services.AddHttpClient<IFinanceServiceClient, FinanceServiceClient>(client =>
        {
            client.BaseAddress = new Uri(financeApiBaseUrl.TrimEnd('/') + "/");
            client.Timeout     = TimeSpan.FromSeconds(5);
        });

        services.AddScoped<IAiDataCollector, AiDataCollectorService>();

        return services;
    }

    /// <summary>
    /// Creates the AiTripTrainingData table if it does not exist.
    /// Call this from the consuming web app after app.Build() — it takes the
    /// IServiceProvider so it works in both WebApplication and plain Host scenarios.
    /// </summary>
    public static void EnsureAiTelemetryTable(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AiTelemetryDbContext>();
        db.Database.EnsureCreated();
    }
}
