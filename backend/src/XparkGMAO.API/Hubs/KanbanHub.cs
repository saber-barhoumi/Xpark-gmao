using Microsoft.AspNetCore.SignalR;

namespace XparkGMAO.API.Hubs
{
    public class KanbanHub : Hub
    {
        public async Task JoinKanban()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "KanbanBoard");
        }

        public async Task LeaveKanban()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "KanbanBoard");
        }
    }
}
