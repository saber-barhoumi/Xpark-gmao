using Maintenance.Application.Interfaces;
using Maintenance.Infrastructure.Data;
using Maintenance.Infrastructure.Repositories;
using Maintenance.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Maintenance.Infrastructure;

/// <summary>
/// Enregistrement DI de la couche Infrastructure de Maintenance
/// (Clean Architecture : unique point de cablage technique).
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddMaintenanceInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<MaintenanceDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IInterventionRepository, InterventionRepository>();
        services.AddScoped<IMaintenanceService, MaintenanceService>();

        return services;
    }
}
