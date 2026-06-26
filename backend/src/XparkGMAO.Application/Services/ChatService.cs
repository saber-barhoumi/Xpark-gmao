using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.Chat;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Application.Services
{
    public class ChatService : IChatService
    {
        private readonly XparkDbContext _context;

        public ChatService(XparkDbContext context)
        {
            _context = context;
        }

        // ========== CONVERSATIONS ==========

        public async Task<List<Conversation>> GetUserConversationsAsync(long userId)
        {
            return await _context.Conversations
                .Where(c => c.Participants.Any(p => p.UtilisateurId == userId) && !c.EstArchivee)
                .Include(c => c.Participants)
                    .ThenInclude(p => p.Utilisateur)
                .Include(c => c.Messages.OrderByDescending(m => m.DateEnvoi).Take(1))
                    .ThenInclude(m => m.Expediteur)
                .OrderByDescending(c => c.DernierMessageDate)
                .ToListAsync();
        }

        public async Task<Conversation?> GetConversationByIdAsync(long id)
        {
            return await _context.Conversations
                .Include(c => c.Participants)
                    .ThenInclude(p => p.Utilisateur)
                .Include(c => c.Messages.OrderByDescending(m => m.DateEnvoi).Take(50))
                    .ThenInclude(m => m.Expediteur)
                .FirstOrDefaultAsync(c => c.IdConversation == id);
        }

        public async Task<Conversation> CreatePrivateConversationAsync(long userId1, long userId2)
        {
            // Vérifier si conversation existe déjà (exactement ces deux là)
            var existing = await _context.Conversations
                .Include(c => c.Participants)
                    .ThenInclude(p => p.Utilisateur)
                .Where(c => c.TypeConversation == TypeConversation.PRIVEE)
                .Where(c => c.Participants.Count == 2)
                .Where(c => c.Participants.Any(p => p.UtilisateurId == userId1))
                .Where(c => c.Participants.Any(p => p.UtilisateurId == userId2))
                .FirstOrDefaultAsync();

            if (existing != null)
                return existing;

            // Créer nouvelle conversation
            var conversation = new Conversation
            {
                TypeConversation = TypeConversation.PRIVEE,
                DateCreation = DateTime.UtcNow,
                CreatedByUserId = userId1
            };

            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

            // Ajouter participants
            await AddParticipantAsync(conversation.IdConversation, userId1);
            await AddParticipantAsync(conversation.IdConversation, userId2);

            // Recharger avec relations
            return (await GetConversationByIdAsync(conversation.IdConversation))!;
        }

        public async Task<Conversation> CreateGroupConversationAsync(long creatorId, string titre, List<long> participantIds)
        {
            var conversation = new Conversation
            {
                Titre = titre,
                TypeConversation = TypeConversation.GROUPE,
                DateCreation = DateTime.UtcNow,
                CreatedByUserId = creatorId
            };

            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

            // Ajouter créateur comme admin
            var creatorParticipant = new ConversationParticipant
            {
                ConversationId = conversation.IdConversation,
                UtilisateurId = creatorId,
                DateAjout = DateTime.UtcNow,
                EstAdmin = true
            };
            _context.ConversationParticipants.Add(creatorParticipant);
            await _context.SaveChangesAsync();

            // Ajouter autres participants
            foreach (var userId in participantIds.Where(id => id != creatorId))
            {
                await AddParticipantAsync(conversation.IdConversation, userId);
            }

            return (await GetConversationByIdAsync(conversation.IdConversation))!;
        }

        // ========== MESSAGES ==========

        public async Task<List<Message>> GetConversationMessagesAsync(long conversationId, int skip = 0, int take = 50)
        {
            return await _context.ChatMessages
                .Where(m => m.ConversationId == conversationId && !m.EstSupprime)
                .Include(m => m.Expediteur)
                .Include(m => m.Reactions)
                    .ThenInclude(r => r.Utilisateur)
                .OrderByDescending(m => m.DateEnvoi)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<Message> SendMessageAsync(long userId, long conversationId, string contenu, string typeMessage, long? reponseAMessageId = null)
        {
            var message = new Message
            {
                ExpediteurId = userId,
                ConversationId = conversationId,
                Contenu = contenu,
                TypeMessage = Enum.Parse<TypeMessage>(typeMessage),
                DateEnvoi = DateTime.UtcNow,
                EstLu = false,
                ReponseAMessageId = reponseAMessageId
            };

            _context.ChatMessages.Add(message);

            // Mettre à jour dernière date message conversation
            var conversation = await _context.Conversations.FindAsync(conversationId);
            if (conversation != null)
            {
                conversation.DernierMessageDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Recharger avec relations
            return (await _context.ChatMessages
                .Include(m => m.Expediteur)
                .FirstOrDefaultAsync(m => m.IdMessage == message.IdMessage))!;
        }

        public async Task<Message?> GetMessageByIdAsync(long messageId)
        {
            return await _context.ChatMessages
                .Include(m => m.Expediteur)
                .Include(m => m.Conversation)
                .FirstOrDefaultAsync(m => m.IdMessage == messageId);
        }

        public async Task DeleteMessageAsync(long messageId, long userId)
        {
            var message = await _context.ChatMessages.FindAsync(messageId);
            if (message != null && message.ExpediteurId == userId)
            {
                message.EstSupprime = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Message> BasculerEpingleAsync(long messageId, long userId)
        {
            var message = await _context.ChatMessages.FindAsync(messageId);
            if (message == null) throw new KeyNotFoundException("Message introuvable");

            // Optionnel : vérifier si l'utilisateur fait partie de la conversation
            var participant = await _context.ConversationParticipants
                .FirstOrDefaultAsync(p => p.ConversationId == message.ConversationId && p.UtilisateurId == userId);
                
            if (participant == null) throw new UnauthorizedAccessException("Action non autorisée");

            message.Epingle = !message.Epingle;
            await _context.SaveChangesAsync();
            
            return message;
        }

        // ========== PARTICIPANTS ==========

        public async Task<List<long>> GetConversationParticipantIdsAsync(long conversationId)
        {
            return await _context.ConversationParticipants
                .Where(cp => cp.ConversationId == conversationId)
                .Select(cp => cp.UtilisateurId)
                .ToListAsync();
        }

        public async Task AddParticipantAsync(long conversationId, long userId)
        {
            var existing = await _context.ConversationParticipants
                .AnyAsync(cp => cp.ConversationId == conversationId && cp.UtilisateurId == userId);

            if (!existing)
            {
                var participant = new ConversationParticipant
                {
                    ConversationId = conversationId,
                    UtilisateurId = userId,
                    DateAjout = DateTime.UtcNow,
                    EstAdmin = false
                };

                _context.ConversationParticipants.Add(participant);
                await _context.SaveChangesAsync();
            }
        }

        public async Task RemoveParticipantAsync(long conversationId, long userId)
        {
            var participant = await _context.ConversationParticipants
                .FirstOrDefaultAsync(cp => cp.ConversationId == conversationId && cp.UtilisateurId == userId);

            if (participant != null)
            {
                _context.ConversationParticipants.Remove(participant);
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarkConversationAsReadAsync(long userId, long conversationId)
        {
            var participant = await _context.ConversationParticipants
                .FirstOrDefaultAsync(cp => cp.ConversationId == conversationId && cp.UtilisateurId == userId);

            if (participant != null)
            {
                participant.DerniereLecture = DateTime.UtcNow;

                // Marquer messages comme lus
                var messages = await _context.ChatMessages
                    .Where(m => m.ConversationId == conversationId &&
                               m.ExpediteurId != userId &&
                               !m.EstLu)
                    .ToListAsync();

                foreach (var message in messages)
                {
                    message.EstLu = true;
                    message.DateLecture = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
            }
        }

        // ========== RÉACTIONS ==========

        public async Task<MessageReaction> AddReactionAsync(long userId, long messageId, string emoji)
        {
            var existing = await _context.MessageReactions
                .FirstOrDefaultAsync(r => r.MessageId == messageId &&
                                        r.UtilisateurId == userId &&
                                        r.TypeReaction == emoji);

            if (existing != null)
                return existing;

            var reaction = new MessageReaction
            {
                MessageId = messageId,
                UtilisateurId = userId,
                TypeReaction = emoji,
                DateReaction = DateTime.UtcNow
            };

            _context.MessageReactions.Add(reaction);
            await _context.SaveChangesAsync();

            return (await _context.MessageReactions
                .Include(r => r.Utilisateur)
                .FirstOrDefaultAsync(r => r.IdReaction == reaction.IdReaction))!;
        }

        public async Task RemoveReactionAsync(long userId, long messageId)
        {
            var reaction = await _context.MessageReactions
                .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UtilisateurId == userId);

            if (reaction != null)
            {
                _context.MessageReactions.Remove(reaction);
                await _context.SaveChangesAsync();
            }
        }

        // ========== STATUT ==========

        public async Task UpdateUserStatusAsync(long userId, StatutEnLigne statut, string? connectionId)
        {
            var userStatut = await _context.UtilisateurStatuts
                .FirstOrDefaultAsync(s => s.UtilisateurId == userId);

            if (userStatut == null)
            {
                userStatut = new UtilisateurStatut
                {
                    UtilisateurId = userId,
                    Statut = statut,
                    DerniereActivite = DateTime.UtcNow,
                    ConnectionId = connectionId
                };
                _context.UtilisateurStatuts.Add(userStatut);
            }
            else
            {
                userStatut.Statut = statut;
                userStatut.DerniereActivite = DateTime.UtcNow;
                userStatut.ConnectionId = connectionId;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<UtilisateurStatut?> GetUserStatusAsync(long userId)
        {
            return await _context.UtilisateurStatuts
                .FirstOrDefaultAsync(s => s.UtilisateurId == userId);
        }

        public async Task<List<UtilisateurStatut>> GetOnlineUsersAsync()
        {
            return await _context.UtilisateurStatuts
                .Where(s => s.Statut == StatutEnLigne.ENLIGNE)
                .Include(s => s.Utilisateur)
                .OrderBy(s => s.Utilisateur.Prenom)
                .ToListAsync();
        }

        public async Task<List<XparkGMAO.Core.Entities.Security.Utilisateur>> SearchUsersAsync(string query, long currentUserId)
        {
            var q = _context.Utilisateurs.AsQueryable();
            if (!string.IsNullOrEmpty(query))
            {
                q = q.Where(u => (u.Prenom + " " + u.Nom).Contains(query) || u.Email.Contains(query));
            }
            return await q.Where(u => u.IdUtilisateur != currentUserId && u.Actif)
                .Take(20)
                .ToListAsync();
        }

        // ========== FICHIERS ==========

        public async Task<Message> SendFileMessageAsync(long userId, long conversationId, IFormFile file)
        {
            // Upload fichier
            var uploadDir = Path.Combine("wwwroot", "uploads", "chat");
            Directory.CreateDirectory(uploadDir);

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Déterminer type
            var typeMessage = file.ContentType.StartsWith("image/") ? TypeMessage.IMAGE :
                            file.ContentType.StartsWith("video/") ? TypeMessage.VIDEO :
                            file.ContentType.StartsWith("audio/") ? TypeMessage.AUDIO :
                            TypeMessage.FICHIER;

            var message = new Message
            {
                ExpediteurId = userId,
                ConversationId = conversationId,
                Contenu = file.FileName,
                TypeMessage = typeMessage,
                DateEnvoi = DateTime.UtcNow,
                CheminFichier = $"/uploads/chat/{fileName}",
                NomFichier = file.FileName,
                TailleFichier = file.Length
            };

            _context.ChatMessages.Add(message);

            // Mettre à jour dernière date message conversation
            var conversation = await _context.Conversations.FindAsync(conversationId);
            if (conversation != null)
            {
                conversation.DernierMessageDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return (await GetMessageByIdAsync(message.IdMessage))!;
        }
    }
}
