using Chat.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Chat.Infrastructure;

/// <summary>Enregistrement DI de la couche Infrastructure du chat.
/// SignalR et MassTransit restent configures dans Program.cs : ce sont des
/// elements du pipeline d'hote (mapping du hub, connexion au bus).</summary>
public static class DependencyInjection
{
    public static IServiceCollection AddChatInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ChatDbContext>(opt =>
            opt.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));
        return services;
    }
}
