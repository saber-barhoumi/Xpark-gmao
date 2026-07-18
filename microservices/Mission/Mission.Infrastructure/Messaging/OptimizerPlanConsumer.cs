using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Mission.Infrastructure.Messaging;

/// <summary>
/// Background consumer of `xpark.optimization.plan-generated` (published by
/// OptimisateurFlotteIA). Stores each received plan in the
/// <see cref="OptimizationPlanStore"/> keyed by batchId; reconnects forever
/// if RabbitMQ is unavailable.
/// </summary>
public class OptimizerPlanConsumer(
    IConfiguration config,
    OptimizationPlanStore store,
    ILogger<OptimizerPlanConsumer> logger) : BackgroundService
{
    private const string Queue = "mission.plan-generated";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = config["RabbitMQ:Host"]     ?? "localhost",
                    UserName = config["RabbitMQ:Username"] ?? "xpark",
                    Password = config["RabbitMQ:Password"] ?? "xpark_secret",
                };
                await using var connection = await factory.CreateConnectionAsync(stoppingToken);
                await using var channel    = await connection.CreateChannelAsync(cancellationToken: stoppingToken);

                await channel.ExchangeDeclareAsync(OptimizerEventBus.Exchange, ExchangeType.Topic,
                    durable: true, autoDelete: false, cancellationToken: stoppingToken);
                await channel.QueueDeclareAsync(Queue, durable: true, exclusive: false,
                    autoDelete: false, cancellationToken: stoppingToken);
                await channel.QueueBindAsync(Queue, OptimizerEventBus.Exchange,
                    OptimizerEventBus.RkPlan, cancellationToken: stoppingToken);

                var consumer = new AsyncEventingBasicConsumer(channel);
                consumer.ReceivedAsync += async (_, ea) =>
                {
                    try
                    {
                        var json = Encoding.UTF8.GetString(ea.Body.ToArray());
                        using var doc = JsonDocument.Parse(json);
                        var batchId = doc.RootElement.TryGetProperty("batchId", out var b)
                            ? b.GetString() ?? "unknown"
                            : "unknown";

                        store.Store(batchId, json);
                        logger.LogInformation(
                            "[OptimizerPlanConsumer] Plan received for batch={BatchId} ({Size} bytes)",
                            batchId, json.Length);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "[OptimizerPlanConsumer] Failed to process plan message");
                    }
                    await channel.BasicAckAsync(ea.DeliveryTag, multiple: false);
                };

                await channel.BasicConsumeAsync(Queue, autoAck: false, consumer,
                    cancellationToken: stoppingToken);

                logger.LogInformation("[OptimizerPlanConsumer] Listening on '{Rk}'",
                    OptimizerEventBus.RkPlan);

                await Task.Delay(Timeout.Infinite, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning("[OptimizerPlanConsumer] RabbitMQ unavailable ({Message}) — retry in 5s",
                    ex.Message);
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }
}
