using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.API.Workers;

/// <summary>
/// Background service that runs daily alert checks at startup and then every 30 minutes.
/// </summary>
public class AlertCheckerBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AlertCheckerBackgroundService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(30);

    public AlertCheckerBackgroundService(IServiceScopeFactory scopeFactory, ILogger<AlertCheckerBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AlertCheckerBackgroundService started. Running initial check...");

        // Run immediately at startup
        await RunChecksAsync();

        // Then every 30 minutes
        using var timer = new PeriodicTimer(Interval);
        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunChecksAsync();
        }
    }

    private async Task RunChecksAsync()
    {
        try
        {
            // IDailyAlertCheckerService is Scoped, so we create a scope per run
            using var scope = _scopeFactory.CreateScope();
            var checker = scope.ServiceProvider.GetRequiredService<IDailyAlertCheckerService>();
            await checker.RunAllChecksAsync();
            _logger.LogInformation("[AlertChecker] Checks completed at {Time}", DateTime.Now);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AlertChecker] Error during background alert check.");
        }
    }
}
