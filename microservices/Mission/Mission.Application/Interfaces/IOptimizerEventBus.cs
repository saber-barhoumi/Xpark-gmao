namespace Mission.Application.Interfaces;

/// <summary>Port de publication vers le bus xpark.ai (OptimisateurFlotteIA +
/// IBOA, JSON brut consommé par les services Python). Extrait de
/// OptimizerEventBus.cs — l'implémentation RabbitMQ reste dans
/// Mission.Infrastructure.Messaging.</summary>
public interface IOptimizerEventBus
{
    Task PublishOptimizationRequestedAsync(string payloadJson, CancellationToken ct = default);

    /// <summary>Publishes any business event on the shared xpark.ai topic exchange
    /// (consumed by IntelligentBusinessOwnerAssistant — routing keys xpark.*).</summary>
    Task PublishAsync(string routingKey, string payloadJson, CancellationToken ct = default);
}
