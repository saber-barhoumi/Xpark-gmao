namespace Fleet.Application.Interfaces;

/// <summary>
/// Port de publication d'événements métier (bus xpark.ai, consommé par IBOA
/// et l'optimisateur Python). Interface extraite de XparkEventBus.cs lors du
/// passage en Clean Architecture — le « quoi » appartient à l'Application,
/// l'implémentation RabbitMQ reste dans Fleet.Infrastructure.Messaging.
/// </summary>
public interface IXparkEventBus
{
    /// <summary>Publishes a business event on the shared xpark.ai topic exchange
    /// (consumed by IntelligentBusinessOwnerAssistant). Best effort — callers
    /// must not fail their main flow if the bus is down.</summary>
    Task PublishAsync(string routingKey, string severity, object eventData,
                      CancellationToken ct = default);
}
