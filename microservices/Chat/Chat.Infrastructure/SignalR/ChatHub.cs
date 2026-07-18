using System.Collections.Concurrent;
using System.Security.Claims;
using Chat.Infrastructure.Data;
using Chat.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Chat.Infrastructure.SignalR;

public class ActiveCallInfo
{
    public long   CallerId       { get; set; }
    public long   CalleeId       { get; set; }
    public string CallType       { get; set; } = "audio";
    public long   ConversationId { get; set; }
    public bool   IsAnswered     { get; set; }
    public DateTime StartedAt   { get; set; }
}

[Authorize]
public class ChatHub(ChatDbContext db, ILogger<ChatHub> logger) : Hub
{
    private static readonly ConcurrentDictionary<long, ActiveCallInfo> _activeCalls = new();

    // ── Connection lifecycle ──────────────────────────────────────────────────

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId > 0)
        {
            await UpdateStatusAsync(userId, StatutEnLigne.ENLIGNE, Context.ConnectionId);
            await Clients.All.SendAsync("UserConnected", userId);
        }
        logger.LogInformation("ChatHub: user {UserId} connected ({ConnId})", userId, Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        await UpdateStatusAsync(userId, StatutEnLigne.HORSLIGNE, null);
        await Clients.All.SendAsync("UserDisconnected", userId);

        // Auto-end any active call on disconnect
        if (_activeCalls.TryRemove(userId, out var call))
        {
            var otherId = call.CallerId == userId ? call.CalleeId : call.CallerId;
            _activeCalls.TryRemove(otherId, out _);
            var status = call.IsAnswered ? "Completed" : "Missed";
            var duration = call.IsAnswered ? (int)(DateTime.UtcNow - call.StartedAt).TotalSeconds : 0;
            await InternalEndCallAsync(otherId, call.CallType, status, duration, call.ConversationId, call.CallerId);
        }

        logger.LogInformation("ChatHub: user {UserId} disconnected", userId);
        await base.OnDisconnectedAsync(exception);
    }

    // ── Messaging ─────────────────────────────────────────────────────────────

    public async Task SendMessage(long conversationId, string contenu, string typeMessage, long? reponseAMessageId = null)
    {
        var userId = GetUserId();

        if (!Enum.TryParse<TypeMessage>(typeMessage, true, out var parsedType))
            parsedType = TypeMessage.TEXTE;

        var message = new Message
        {
            ExpediteurId      = userId,
            ConversationId    = conversationId,
            Contenu           = contenu,
            TypeMessage       = parsedType,
            DateEnvoi         = DateTime.UtcNow,
            EstLu             = false,
            ReponseAMessageId = reponseAMessageId,
        };
        db.ChatMessages.Add(message);

        var conv = await db.Conversations.FindAsync(conversationId);
        if (conv != null) conv.DernierMessageDate = DateTime.UtcNow;

        await db.SaveChangesAsync();

        var saved = await db.ChatMessages
            .Include(m => m.Expediteur)
            .FirstAsync(m => m.IdMessage == message.IdMessage);

        var dto = ToHubDto(saved);

        var participantIds = await db.ConversationParticipants
            .Where(p => p.ConversationId == conversationId)
            .Select(p => p.UtilisateurId.ToString())
            .ToListAsync();

        await Clients.Users(participantIds).SendAsync("ReceiveMessage", dto);
    }

    public async Task Typing(long conversationId, bool isTyping)
    {
        var userId = GetUserId();
        var others = await db.ConversationParticipants
            .Where(p => p.ConversationId == conversationId && p.UtilisateurId != userId)
            .Select(p => p.UtilisateurId.ToString())
            .ToListAsync();

        await Clients.Users(others).SendAsync("UserTyping", new { userId, conversationId, isTyping });
    }

    public async Task MarkAsRead(long conversationId)
    {
        var userId = GetUserId();
        var participant = await db.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UtilisateurId == userId);

        if (participant != null)
        {
            participant.DerniereLecture = DateTime.UtcNow;
            var unread = await db.ChatMessages
                .Where(m => m.ConversationId == conversationId && m.ExpediteurId != userId && !m.EstLu)
                .ToListAsync();
            foreach (var m in unread) { m.EstLu = true; m.DateLecture = DateTime.UtcNow; }
            await db.SaveChangesAsync();
        }

        var participantIds = await db.ConversationParticipants
            .Where(p => p.ConversationId == conversationId)
            .Select(p => p.UtilisateurId.ToString())
            .ToListAsync();

        await Clients.Users(participantIds).SendAsync("MessagesRead", new { userId, conversationId });
    }

    public async Task AddReaction(long messageId, string emoji)
    {
        var userId = GetUserId();
        var exists = await db.MessageReactions
            .AnyAsync(r => r.MessageId == messageId && r.UtilisateurId == userId && r.TypeReaction == emoji);

        if (!exists)
        {
            db.MessageReactions.Add(new MessageReaction
            {
                MessageId = messageId, UtilisateurId = userId,
                TypeReaction = emoji, DateReaction = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        var msg = await db.ChatMessages.FindAsync(messageId);
        if (msg == null) return;

        var participantIds = await db.ConversationParticipants
            .Where(p => p.ConversationId == msg.ConversationId)
            .Select(p => p.UtilisateurId.ToString())
            .ToListAsync();

        await Clients.Users(participantIds).SendAsync("ReactionAdded", new { messageId, userId, emoji });
    }

    public async Task JoinConversation(long conversationId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, $"conv_{conversationId}");

    public async Task LeaveConversation(long conversationId) =>
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conv_{conversationId}");

    // ── WebRTC signaling ──────────────────────────────────────────────────────

    public async Task InitiateCall(long targetUserId, string callType, string offer, long conversationId = 0)
    {
        var callerId = GetUserId();
        if (conversationId > 0)
        {
            var info = new ActiveCallInfo
            {
                CallerId = callerId, CalleeId = targetUserId, CallType = callType,
                ConversationId = conversationId, StartedAt = DateTime.UtcNow,
            };
            _activeCalls[callerId]    = info;
            _activeCalls[targetUserId] = info;
        }
        await Clients.User(targetUserId.ToString()).SendAsync("IncomingCall", callerId, callType, offer);
    }

    public async Task AnswerCall(long callerId, string answer)
    {
        var userId = GetUserId();
        if (_activeCalls.TryGetValue(userId, out var call))
        {
            call.IsAnswered = true;
            call.StartedAt  = DateTime.UtcNow;
        }
        await Clients.User(callerId.ToString()).SendAsync("CallAnswered", answer);
    }

    public async Task SendIceCandidate(long targetUserId, string candidate) =>
        await Clients.User(targetUserId.ToString()).SendAsync("IceCandidate", candidate);

    public async Task EndCall(long targetUserId, string callType = "audio", string status = "Completed",
        int durationSeconds = 0, long conversationId = 0, long actualCallerId = 0)
    {
        var invokerId = GetUserId();
        var callerId  = actualCallerId > 0 ? actualCallerId : invokerId;
        _activeCalls.TryRemove(invokerId,    out _);
        _activeCalls.TryRemove(targetUserId, out _);
        await InternalEndCallAsync(targetUserId, callType, status, durationSeconds, conversationId, callerId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task InternalEndCallAsync(long targetUserId, string callType, string status,
        int durationSeconds, long conversationId, long callerId)
    {
        await Clients.User(targetUserId.ToString()).SendAsync("CallEnded", status, durationSeconds);

        if (conversationId <= 0 || callerId <= 0) return;

        var icon  = callType == "video" ? "video" : "phone";
        var label = callType == "video" ? "Appel vidéo" : "Appel vocal";
        var payload = System.Text.Json.JsonSerializer.Serialize(new
            { callType, status, durationSeconds, callerId, label, icon });

        var message = new Message
        {
            ExpediteurId   = callerId,
            ConversationId = conversationId,
            Contenu        = payload,
            TypeMessage    = TypeMessage.APPEL,
            DateEnvoi      = DateTime.UtcNow,
        };
        db.ChatMessages.Add(message);

        var conv = await db.Conversations.FindAsync(conversationId);
        if (conv != null) conv.DernierMessageDate = DateTime.UtcNow;

        await db.SaveChangesAsync();

        var saved = await db.ChatMessages
            .Include(m => m.Expediteur)
            .FirstAsync(m => m.IdMessage == message.IdMessage);

        var participantIds = await db.ConversationParticipants
            .Where(p => p.ConversationId == conversationId)
            .Select(p => p.UtilisateurId.ToString())
            .ToListAsync();

        await Clients.Users(participantIds).SendAsync("ReceiveMessage", ToHubDto(saved));
    }

    private async Task UpdateStatusAsync(long userId, StatutEnLigne statut, string? connId)
    {
        var s = await db.UtilisateurStatuts.FirstOrDefaultAsync(x => x.UtilisateurId == userId);
        if (s == null)
        {
            db.UtilisateurStatuts.Add(new UtilisateurStatut
            {
                UtilisateurId = userId, Statut = statut,
                DerniereActivite = DateTime.UtcNow, ConnectionId = connId,
            });
        }
        else
        {
            s.Statut = statut; s.DerniereActivite = DateTime.UtcNow; s.ConnectionId = connId;
        }
        await db.SaveChangesAsync();
    }

    private static MessageHubDto ToHubDto(Message m) => new()
    {
        IdMessage         = m.IdMessage,
        ConversationId    = m.ConversationId,
        ExpediteurId      = m.ExpediteurId,
        NomExpediteur     = m.Expediteur != null ? $"{m.Expediteur.Prenom} {m.Expediteur.Nom}".Trim() : "",
        AvatarUrl         = m.Expediteur?.Photo,
        Contenu           = m.Contenu,
        TypeMessage       = m.TypeMessage.ToString(),
        EstLu             = m.EstLu,
        DateEnvoi         = m.DateEnvoi.ToString("o"),
        CheminFichier     = m.CheminFichier,
        NomFichier        = m.NomFichier,
        TailleFichier     = m.TailleFichier,
        ReponseAMessageId = m.ReponseAMessageId,
        Epingle           = m.Epingle,
    };

    private long GetUserId()
    {
        var val = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(val, out var id) ? id : 0;
    }
}
