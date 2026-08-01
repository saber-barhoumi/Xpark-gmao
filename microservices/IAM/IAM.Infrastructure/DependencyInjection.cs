using IAM.Application.Interfaces;
using IAM.Infrastructure.Data;
using IAM.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace IAM.Infrastructure;

/// <summary>
/// Enregistrement DI de la couche Infrastructure — l'API n'a connaissance que
/// de cette extension : elle ne référence jamais un service concret directement.
/// (Clean Architecture : les dépendances pointent vers l'intérieur ;
///  c'est ici que les interfaces de l'Application reçoivent leurs implémentations.)
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddIamInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        // ── Base de données (PostgreSQL partagée du système) ──────────────────
        services.AddDbContext<IamDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // ── Implémentations des contrats de l'Application ─────────────────────
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IUserArchiveService, UserArchiveService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<IClientService, ClientService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IMfaService, MfaService>();

        return services;
    }
}
