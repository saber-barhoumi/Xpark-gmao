using Mission.Application.Interfaces;
using Mission.Infrastructure.Data;
using Mission.Infrastructure.Messaging;
using Mission.Infrastructure.Repositories;
using Mission.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Mission.Infrastructure;

/// <summary>
/// Enregistrement DI de la couche Infrastructure de Mission — unique point de
/// câblage : DbContext, repositories, services, bus xpark.ai et consumer de
/// plans d'optimisation (BackgroundService).
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddMissionInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        // ── Base de données (PostgreSQL partagée) ─────────────────────────────
        services.AddDbContext<MissionDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // ── Repositories ──────────────────────────────────────────────────────
        services.AddScoped<IMissionRepository, MissionRepository>();

        // ── Services applicatifs ──────────────────────────────────────────────
        services.AddScoped<IMissionService, MissionService>();
        services.AddScoped<IHistoricalMigrationService, HistoricalMigrationService>();
        services.AddScoped<IOptimizationService, OptimizationService>();

        // ── OptimisateurFlotteIA : bus + magasin de plans + consumer ──────────
        services.AddSingleton<OptimizationPlanStore>();
        services.AddSingleton<IOptimizerEventBus, OptimizerEventBus>();
        services.AddHostedService<OptimizerPlanConsumer>();

        return services;
    }
}
