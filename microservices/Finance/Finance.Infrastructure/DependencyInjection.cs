using Finance.Application.Interfaces;
using Finance.Infrastructure.Data;
using Finance.Infrastructure.Repositories;
using Finance.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Finance.Infrastructure;

/// <summary>
/// Enregistrement DI de la couche Infrastructure de Finance
/// (Clean Architecture : unique point de cablage technique).
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddFinanceInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<FinanceDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IFactureRepository, FactureRepository>();
        services.AddScoped<IFacturationService, FacturationService>();
        // NB : la gestion carburant a migré vers Fleet.API — les fichiers
        // CarburantService/ICarburantService ne sont que des marqueurs.

        return services;
    }
}
