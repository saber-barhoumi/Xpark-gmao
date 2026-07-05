using System.Text;
using System.Text.Json;
using RabbitMQ.Client;

namespace Fleet.API.Messaging;

public interface IXparkEventBus
{
    /// <summary>Publishes a business event on the shared xpark.ai topic exchange
    /// (consumed by IntelligentBusinessOwnerAssistant). Best effort — callers
    /// must not fail their main flow if the bus is down.</summary>
    Task PublishAsync(string routingKey, string severity, object eventData,
                      CancellationToken ct = default);
}

/// <summary>
/// Raw RabbitMQ publisher — same pattern as Mission.API OptimizerEventBus:
/// plain JSON on durable topic exchange `xpark.ai`, no MassTransit envelope,
/// so the Python services (IBOA, optimiseur) consume messages directly.
/// </summary>
public class XparkEventBus(IConfiguration config, ILogger<XparkEventBus> logger)
    : IXparkEventBus, IAsyncDisposable
{
    public const string Exchange = "xpark.ai";

    private IConnection? _connection;
    private IChannel?    _channel;
    private readonly SemaphoreSlim _lock = new(1, 1);

    private async Task<IChannel> GetChannelAsync(CancellationToken ct)
    {
        if (_channel is { IsOpen: true }) return _channel;

        await _lock.WaitAsync(ct);
        try
        {
            if (_channel is { IsOpen: true }) return _channel;

            var factory = new ConnectionFactory
            {
                HostName = config["RabbitMQ:Host"]     ?? "localhost",
                UserName = config["RabbitMQ:Username"] ?? "xpark",
                Password = config["RabbitMQ:Password"] ?? "xpark_secret",
            };
            _connection = await factory.CreateConnectionAsync(ct);
            _channel    = await _connection.CreateChannelAsync(cancellationToken: ct);
            await _channel.ExchangeDeclareAsync(Exchange, ExchangeType.Topic,
                durable: true, autoDelete: false, cancellationToken: ct);

            logger.LogInformation("[XparkEventBus] Connected to RabbitMQ ({Host})", factory.HostName);
            return _channel;
        }
        finally { _lock.Release(); }
    }

    public async Task PublishAsync(string routingKey, string severity, object eventData,
                                   CancellationToken ct = default)
    {
        var evt = new
        {
            eventId       = $"evt-{Guid.NewGuid():N}",
            timestamp     = DateTime.UtcNow,
            eventType     = routingKey,
            severity,
            sourceService = "FleetService",
            eventData,
            context       = new { },
            metadata      = new { tags = new[] { "fleet" } },
        };
        var json = JsonSerializer.Serialize(evt);

        var channel = await GetChannelAsync(ct);
        var props = new BasicProperties
        {
            ContentType  = "application/json",
            DeliveryMode = DeliveryModes.Persistent,
        };
        await channel.BasicPublishAsync(Exchange, routingKey, mandatory: false, props,
            Encoding.UTF8.GetBytes(json), ct);

        logger.LogInformation("[XparkEventBus] Published '{Rk}' (severity={Severity})",
            routingKey, severity);
    }

    public async ValueTask DisposeAsync()
    {
        if (_channel    is not null) await _channel.DisposeAsync();
        if (_connection is not null) await _connection.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}
