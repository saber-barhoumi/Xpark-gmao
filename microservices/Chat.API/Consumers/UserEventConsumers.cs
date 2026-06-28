using MassTransit;
using XparkGMAO.Shared.Events;

namespace Chat.API.Consumers;

// Consumes IAM user status change events (presence supplement to SignalR OnConnected/OnDisconnected)
public class UserStatusChangedConsumer(ILogger<UserStatusChangedConsumer> logger) : IConsumer<UserStatusChangedEvent>
{
    public Task Consume(ConsumeContext<UserStatusChangedEvent> context)
    {
        logger.LogInformation("Chat.API: user {UserId} status → {Status}", context.Message.UserId, context.Message.NewStatus);
        return Task.CompletedTask;
    }
}
