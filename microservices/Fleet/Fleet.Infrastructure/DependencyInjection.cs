using Fleet.Application.Interfaces;
using Fleet.Infrastructure.Data;
using Fleet.Infrastructure.Messaging;
using Fleet.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Fleet.Infrastructure;

/// <summary>
/// Enregistrement DI de la couche Infrastructure de Fleet — unique point de
/// câblage technique (DbContext, services, bus d'événements RabbitMQ).
/// L'API n'appelle que cette extension et n'instancie jamais un détail.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddFleetInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        // ── Base de données (PostgreSQL partagée du système) ──────────────────
        services.AddDbContext<FleetDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // ── Bus d'événements xpark.ai (singleton : connexion RabbitMQ durable) ─
        services.AddSingleton<IXparkEventBus, XparkEventBus>();

        // ── Implémentations des contrats de l'Application ─────────────────────
        services.AddScoped<IVehiculeService, VehiculeService>();
        services.AddScoped<IAssuranceService, AssuranceService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<ICarburantService, CarburantService>();
        services.AddScoped<ISourceService, SourceService>();

        return services;
    }
}
