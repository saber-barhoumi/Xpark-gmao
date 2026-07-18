using Alerts.Application.Interfaces;
using Alerts.Infrastructure.Data;
using Alerts.Infrastructure.Repositories;
using Alerts.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Alerts.Infrastructure;

/// <summary>Enregistrement DI de la couche Infrastructure d'Alerts.</summary>
public static class DependencyInjection
{
    public static IServiceCollection AddAlertsInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AlertsDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IAlertRepository, AlerteRepository>();
        services.AddScoped<IAlertService, AlerteService>();

        return services;
    }
}
