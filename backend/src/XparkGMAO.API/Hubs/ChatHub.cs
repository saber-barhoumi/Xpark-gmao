using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using XparkGMAO.Application.Services;
using XparkGMAO.Core.Entities.Chat;
using XparkGMAO.Core.DTOs.Chat;
using System.Security.Claims;
using System.Collections.Concurrent;

namespace XparkGMAO.API.Hubs
{
    public class ActiveCallInfo
    {
        public long CallerId { get; set; }
        public long CalleeId { get; set; }
        public string CallType { get; set; } = "audio";
        public long ConversationId { get; set; }
        public bool IsAnswered { get; set; }
        public DateTime StartedAt { get; set; }
    }

    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;
        private readonly ILogger<ChatHub> _logger;

        // Tracks active calls by userId (both caller and callee ID point to the same call)
        private static readonly ConcurrentDictionary<long, ActiveCallInfo> _activeCalls = new();

        public ChatHub(IChatService chatService, ILogger<ChatHub> logger)
        {
            _chatService = chatService;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            var connectionId = Context.ConnectionId;
            
            _logger.LogInformation("SignalR: User {UserId} connected", userId);
            
            if (userId > 0) 
            {
                await _chatService.UpdateUserStatusAsync(userId, StatutEnLigne.ENLIGNE, connectionId);
                await Clients.All.SendAsync("UserConnected", userId);
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            await _chatService.UpdateUserStatusAsync(userId, StatutEnLigne.HORSLIGNE, null);
            await Clients.All.SendAsync("UserDisconnected", userId);

            // Handle disconnection during an active call to prevent hanging UI
            if (_activeCalls.TryRemove(userId, out var callInfo))
            {
                var otherUserId = callInfo.CallerId == userId ? callInfo.CalleeId : callInfo.CallerId;
                _activeCalls.TryRemove(otherUserId, out _); // clean up the other side too

                var status = callInfo.IsAnswered ? "Completed" : "Missed";
                var duration = callInfo.IsAnswered ? (int)(DateTime.UtcNow - callInfo.StartedAt).TotalSeconds : 0;

                _logger.LogInformation("User {UserId} disconnected during call. Auto-ending call. Status: {Status}", userId, status);
                
                await InternalEndCall(otherUserId, callInfo.CallType, status, duration, callInfo.ConversationId, callInfo.CallerId);
            }

            _logger.LogInformation("User {UserId} disconnected", userId);
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Envoyer un message — retourne un DTO plat, jamais l'entité EF
        /// </summary>
        public async Task SendMessage(long conversationId, string contenu, string typeMessage, long? reponseAMessageId = null)
        {
            var userId = GetUserId();

            var message = await _chatService.SendMessageAsync(userId, conversationId, contenu, typeMessage, reponseAMessageId);

            // Mapper vers un DTO plat pour éviter les cycles JSON
            var dto = new MessageHubDto
            {
                IdMessage      = message.IdMessage,
                ConversationId = message.ConversationId,
                ExpediteurId   = message.ExpediteurId,
                NomExpediteur  = message.Expediteur != null
                    ? $"{message.Expediteur.Prenom} {message.Expediteur.Nom}".Trim()
                    : "",
                Contenu        = message.Contenu,
                TypeMessage    = message.TypeMessage.ToString(),
                EstLu          = message.EstLu,
                DateEnvoi      = message.DateEnvoi.ToString("o"),
                CheminFichier  = message.CheminFichier,
                NomFichier     = message.NomFichier,
                TailleFichier  = message.TailleFichier,
                ReponseAMessageId = message.ReponseAMessageId
            };

            // Récupérer les IDs des participants
            var participantIds = await _chatService.GetConversationParticipantIdsAsync(conversationId);

            // Envoyer le DTO plat à tous les participants
            await Clients.Users(participantIds.Select(id => id.ToString())).SendAsync("ReceiveMessage", dto);
        }

        /// <summary>
        /// Indiquer qu'on est en train d'écrire
        /// </summary>
        public async Task Typing(long conversationId, bool isTyping)
        {
            var userId = GetUserId();
            var participantIds = await _chatService.GetConversationParticipantIdsAsync(conversationId);

            await Clients.Users(participantIds.Where(id => id != userId).Select(id => id.ToString()))
                .SendAsync("UserTyping", new { userId, conversationId, isTyping });
        }

        /// <summary>
        /// Marquer messages comme lus
        /// </summary>
        public async Task MarkAsRead(long conversationId)
        {
            var userId = GetUserId();
            await _chatService.MarkConversationAsReadAsync(userId, conversationId);

            var participantIds = await _chatService.GetConversationParticipantIdsAsync(conversationId);
            await Clients.Users(participantIds.Select(id => id.ToString()))
                .SendAsync("MessagesRead", new { userId, conversationId });
        }

        /// <summary>
        /// Ajouter une réaction à un message
        /// </summary>
        public async Task AddReaction(long messageId, string emoji)
        {
            var userId = GetUserId();
            var reaction = await _chatService.AddReactionAsync(userId, messageId, emoji);

            var message = await _chatService.GetMessageByIdAsync(messageId);
            if (message != null)
            {
                var participantIds = await _chatService.GetConversationParticipantIdsAsync(message.ConversationId);
                await Clients.Users(participantIds.Select(id => id.ToString()))
                    .SendAsync("ReactionAdded", reaction);
            }
        }

        /// <summary>
        /// Rejoindre une conversation (groupe SignalR)
        /// </summary>
        public async Task JoinConversation(long conversationId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        }

        /// <summary>
        /// Quitter une conversation
        /// </summary>
        public async Task LeaveConversation(long conversationId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        }

        // ========== WEBRTC CALL SIGNALING ==========

        /// <summary>
        /// Initiateur envoie une offre d'appel
        /// </summary>
        public async Task InitiateCall(long targetUserId, string callType, string offer, long conversationId = 0)
        {
            var callerId = GetUserId();
            _logger.LogInformation("Call initiated: {CallerId} -> {TargetUserId} ({CallType})", callerId, targetUserId, callType);

            if (conversationId > 0)
            {
                var callInfo = new ActiveCallInfo
                {
                    CallerId = callerId,
                    CalleeId = targetUserId,
                    CallType = callType,
                    ConversationId = conversationId,
                    StartedAt = DateTime.UtcNow
                };
                
                _activeCalls[callerId] = callInfo;
                _activeCalls[targetUserId] = callInfo;
            }

            await Clients.User(targetUserId.ToString())
                .SendAsync("IncomingCall", callerId, callType, offer);
        }

        /// <summary>
        /// Récepteur accepte l'appel
        /// </summary>
        public async Task AnswerCall(long callerId, string answer)
        {
            var userId = GetUserId();
            _logger.LogInformation("Call answered: {UserId} -> {CallerId}", userId, callerId);

            if (_activeCalls.TryGetValue(userId, out var callInfo))
            {
                callInfo.IsAnswered = true;
                callInfo.StartedAt = DateTime.UtcNow; // reset start time to actual answer time
            }

            await Clients.User(callerId.ToString())
                .SendAsync("CallAnswered", answer);
        }

        /// <summary>
        /// Échange de candidats ICE
        /// </summary>
        public async Task SendIceCandidate(long targetUserId, string candidate)
        {
            await Clients.User(targetUserId.ToString())
                .SendAsync("IceCandidate", candidate);
        }

        /// <summary>
        /// Raccrocher l'appel — enregistre l'historique d'appel comme message APPEL
        /// </summary>
        public async Task EndCall(long targetUserId, string callType = "audio", string status = "Completed", int durationSeconds = 0, long conversationId = 0, long actualCallerId = 0)
        {
            var invokerId = GetUserId();
            var callerId = actualCallerId > 0 ? actualCallerId : invokerId;

            _logger.LogInformation("Call ended manually: Invoker={InvokerId}, Caller={CallerId} -> Target={TargetUserId} ({CallType}, {Status}, {Duration}s)",
                invokerId, callerId, targetUserId, callType, status, durationSeconds);

            // Retirer du dictionnaire actif
            _activeCalls.TryRemove(invokerId, out _);
            _activeCalls.TryRemove(targetUserId, out _);

            await InternalEndCall(targetUserId, callType, status, durationSeconds, conversationId, callerId);
        }

        private async Task InternalEndCall(long targetUserId, string callType, string status, int durationSeconds, long conversationId, long actualCallerId)
        {
            // Notifier l'autre participant
            await Clients.User(targetUserId.ToString())
                .SendAsync("CallEnded", status, durationSeconds);

            // Sauvegarder le message d'historique si on a le conversationId
            if (conversationId > 0 && actualCallerId > 0)
            {
                string icon  = callType == "video" ? "video" : "phone";
                string label = callType == "video" ? "Appel vidéo" : "Appel vocal";

                var callData = System.Text.Json.JsonSerializer.Serialize(new
                {
                    callType,
                    status,
                    durationSeconds,
                    callerId = actualCallerId,
                    label,
                    icon,
                });

                // The message sender is forced to the actual initiator of the call
                var message = await _chatService.SendMessageAsync(
                    actualCallerId, conversationId, callData, "APPEL");

                var hubDto = new MessageHubDto
                {
                    IdMessage      = message.IdMessage,
                    ConversationId = message.ConversationId,
                    ExpediteurId   = message.ExpediteurId,
                    NomExpediteur  = message.Expediteur != null
                        ? $"{message.Expediteur.Prenom} {message.Expediteur.Nom}".Trim()
                        : "",
                    Contenu        = message.Contenu,
                    TypeMessage    = "APPEL",
                    DateEnvoi      = message.DateEnvoi.ToString("o"),
                    EstLu          = false,
                };

                var participantIds = await _chatService
                    .GetConversationParticipantIdsAsync(conversationId);

                await Clients
                    .Users(participantIds.Select(id => id.ToString()))
                    .SendAsync("ReceiveMessage", hubDto);
            }
        }

        private long GetUserId()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return long.Parse(userIdClaim ?? "0");
        }
    }
}
