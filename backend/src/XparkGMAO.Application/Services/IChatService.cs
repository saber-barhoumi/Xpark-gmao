using XparkGMAO.Core.Entities.Chat;
using XparkGMAO.Core.Entities.Security;
using Microsoft.AspNetCore.Http;

namespace XparkGMAO.Application.Services
{
    public interface IChatService
    {
        // Conversations
        Task<List<Conversation>> GetUserConversationsAsync(long userId);
        Task<Conversation?> GetConversationByIdAsync(long id);
        Task<Conversation> CreatePrivateConversationAsync(long userId1, long userId2);
        Task<Conversation> CreateGroupConversationAsync(long creatorId, string titre, List<long> participantIds);

        // Messages
        Task<List<Message>> GetConversationMessagesAsync(long conversationId, int skip = 0, int take = 50);
        Task<Message> SendMessageAsync(long userId, long conversationId, string contenu, string typeMessage, long? reponseAMessageId = null);
        Task<Message?> GetMessageByIdAsync(long messageId);
        Task DeleteMessageAsync(long messageId, long userId);
        Task<Message> BasculerEpingleAsync(long messageId, long userId);

        // Participants
        Task<List<long>> GetConversationParticipantIdsAsync(long conversationId);
        Task AddParticipantAsync(long conversationId, long userId);
        Task RemoveParticipantAsync(long conversationId, long userId);
        Task MarkConversationAsReadAsync(long userId, long conversationId);

        // Réactions
        Task<MessageReaction> AddReactionAsync(long userId, long messageId, string emoji);
        Task RemoveReactionAsync(long userId, long messageId);

        // Statut
        Task UpdateUserStatusAsync(long userId, StatutEnLigne statut, string? connectionId);
        Task<UtilisateurStatut?> GetUserStatusAsync(long userId);
        Task<List<UtilisateurStatut>> GetOnlineUsersAsync();
        Task<List<Utilisateur>> SearchUsersAsync(string query, long currentUserId);

        // Upload fichiers
        Task<Message> SendFileMessageAsync(long userId, long conversationId, IFormFile file);
    }
}
