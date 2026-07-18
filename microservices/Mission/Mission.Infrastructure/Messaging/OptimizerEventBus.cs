using System.Text;
using RabbitMQ.Client;

using Mission.Application.Interfaces;

namespace Mission.Infrastructure.Messaging;

/// <summary>
/// Publisher for the OptimisateurFlotteIA event flow (FICHE §2.3).
/// Topic exchange `xpark.ai` — plain JSON payloads (no MassTransit envelope)
/// so the Python service consumes them directly.
/// </summary>
public class OptimizerEventBus(IConfiguration config, ILogger<OptimizerEventBus> logger)
    : IOptimizerEventBus, IAsyncDisposable
{
    public const string Exchange  = "xpark.ai";
    public const string RkRequest = "xpark.missions.ready-for-optimization";
    public const string RkPlan    = "xpark.optimization.plan-generated";

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

            logger.LogInformation("[OptimizerEventBus] Connected to RabbitMQ ({Host})",
                factory.HostName);
            return _channel;
        }
        finally { _lock.Release(); }
    }

    public Task PublishOptimizationRequestedAsync(string payloadJson, CancellationToken ct = default)
        => PublishAsync(RkRequest, payloadJson, ct);

    public async Task PublishAsync(string routingKey, string payloadJson, CancellationToken ct = default)
    {
        var channel = await GetChannelAsync(ct);
        var props = new BasicProperties
        {
            ContentType  = "application/json",
            DeliveryMode = DeliveryModes.Persistent,
        };
        await channel.BasicPublishAsync(Exchange, routingKey, mandatory: false, props,
            Encoding.UTF8.GetBytes(payloadJson), ct);

        logger.LogInformation("[OptimizerEventBus] Published event '{Rk}' ({Size} bytes)",
            routingKey, payloadJson.Length);
    }

    public async ValueTask DisposeAsync()
    {
        if (_channel    is not null) await _channel.DisposeAsync();
        if (_connection is not null) await _connection.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}
