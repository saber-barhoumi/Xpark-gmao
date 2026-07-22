using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PredictionPanne.Infrastructure.Data;
using PredictionPanne.Infrastructure.Engine;
using PredictionPanne.Infrastructure.Services;

namespace PredictionPanne.Infrastructure;

/// <summary>
/// Enregistrement DI de l'Infrastructure de PredictionPanne — unique point de
/// câblage technique. L'API n'appelle que cette extension.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddPredictionPanneInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        // ── Base de données partagée du système ──────────────────────────────
        services.AddDbContext<PredictionDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // ══════════════════════════════════════════════════════════════════════
        // MOTEUR DE PRÉDICTION — unique ligne à changer pour passer au ML.
        //
        // Aujourd'hui : règles métier explicables, opérationnelles sans jeu
        // d'entraînement. Demain, une fois un modèle entraîné sur l'historique
        // accumulé dans PredictionsPanne :
        //     services.AddScoped<IPredictionEngine, MlPredictionEngine>();
        // Rien d'autre ne bouge (ni contrôleur, ni DTO, ni schéma).
        // ══════════════════════════════════════════════════════════════════════
        services.AddScoped<IPredictionEngine, RuleBasedPredictionEngine>();

        services.AddScoped<IPredictionService, PredictionService>();

        return services;
    }
}
