using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Application.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using XparkGMAO.API.Hubs;
using XparkGMAO.Core.DTOs.Chat;

namespace XparkGMAO.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;
        private readonly ILogger<ChatController> _logger;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(IChatService chatService, ILogger<ChatController> logger, IHubContext<ChatHub> hubContext)
        {
            _chatService = chatService;
            _logger = logger;
            _hubContext = hubContext;
        }

        /// <summary>
        /// Récupérer conversations de l'utilisateur
        /// </summary>
        [HttpGet("conversations")]
        public async Task<IActionResult> GetUserConversations()
        {
            var userId = GetUserId();
            var conversations = await _chatService.GetUserConversationsAsync(userId);
            return Ok(conversations);
        }

        /// <summary>
        /// Récupérer une conversation par ID
        /// </summary>
        [HttpGet("conversations/{id}")]
        public async Task<IActionResult> GetConversation(long id)
        {
            var conversation = await _chatService.GetConversationByIdAsync(id);
            if (conversation == null) return NotFound();
            return Ok(conversation);
        }

        /// <summary>
        /// Créer conversation privée
        /// </summary>
        [HttpPost("conversations/private")]
        public async Task<IActionResult> CreatePrivateConversation([FromBody] CreatePrivateConversationDto dto)
        {
            _logger.LogInformation("Creating private conversation with user {OtherUserId}", dto.OtherUserId);
            
            if (dto.OtherUserId <= 0) 
            {
                _logger.LogWarning("Invalid OtherUserId: {OtherUserId}", dto.OtherUserId);
                return BadRequest("L'ID de l'autre utilisateur est requis.");
            }
 
            var userId = GetUserId();
            _logger.LogInformation("Current UserId from claims: {UserId}", userId);
 
            if (userId <= 0) 
            {
                _logger.LogWarning("UserId from claims is 0 or less. Claims: {Claims}", 
                    string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
                return Unauthorized();
            }
 
            var conversation = await _chatService.CreatePrivateConversationAsync(userId, dto.OtherUserId);
            return Ok(conversation);
        }

        /// <summary>
        /// Créer conversation groupe
        /// </summary>
        [HttpPost("conversations/group")]
        public async Task<IActionResult> CreateGroupConversation([FromBody] CreateGroupDto dto)
        {
            var userId = GetUserId();
            var conversation = await _chatService.CreateGroupConversationAsync(userId, dto.Titre, dto.ParticipantIds);
            return Ok(conversation);
        }

        /// <summary>
        /// Récupérer messages d'une conversation
        /// </summary>
        [HttpGet("conversations/{id}/messages")]
        public async Task<IActionResult> GetMessages(long id, [FromQuery] int skip = 0, [FromQuery] int take = 50)
        {
            var messages = await _chatService.GetConversationMessagesAsync(id, skip, take);
            return Ok(messages);
        }

        /// <summary>
        /// Envoyer fichier
        /// </summary>
        [HttpPost("conversations/{id}/upload")]
        public async Task<IActionResult> UploadFile(long id, IFormFile file)
        {
            var userId = GetUserId();
            var message = await _chatService.SendFileMessageAsync(userId, id, file);
            return Ok(message);
        }

        /// <summary>
        /// Supprimer message
        /// </summary>
        [HttpDelete("messages/{id}")]
        public async Task<IActionResult> DeleteMessage(long id)
        {
            var userId = GetUserId();
            var message = await _chatService.GetMessageByIdAsync(id);
            if (message == null || message.ExpediteurId != userId)
                return Forbid();

            await _chatService.DeleteMessageAsync(id, userId);

            // Notifier les participants
            await _hubContext.Clients
                .Group($"conv_{message.ConversationId}")
                .SendAsync("MessageSupprime", new { MessageId = id });

            return NoContent();
        }

        /// <summary>
        /// Épingler / Désépingler un message
        /// </summary>
        [HttpPut("messages/{id}/epingler")]
        public async Task<IActionResult> EpinglerMessage(long id)
        {
            var userId = GetUserId();
            var message = await _chatService.BasculerEpingleAsync(id, userId);

            // Notifier les participants
            await _hubContext.Clients
                .Group($"conv_{message.ConversationId}")
                .SendAsync("MessageEpingle", new { 
                    MessageId = id, 
                    Epingle = message.Epingle 
                });

            return Ok(new { epingle = message.Epingle });
        }

        /// <summary>
        /// Récupérer utilisateurs en ligne
        /// </summary>
        [HttpGet("users/online")]
        public async Task<IActionResult> GetOnlineUsers()
        {
            var users = await _chatService.GetOnlineUsersAsync();
            return Ok(users);
        }

        /// <summary>
        /// Rechercher des utilisateurs pour démarrer un chat
        /// </summary>
        [HttpGet("users/search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string query = "")
        {
            var userId = GetUserId();
            var users = await _chatService.SearchUsersAsync(query, userId);
            return Ok(users);
        }

        /// <summary>
        /// Transférer un message vers une autre conversation
        /// </summary>
        [HttpPost("messages/forward")]
        public async Task<IActionResult> ForwardMessage([FromBody] ForwardMessageDto dto)
        {
            var userId = GetUserId();
            var originalMsg = await _chatService.GetMessageByIdAsync(dto.MessageId);
            if (originalMsg == null) return NotFound("Message original introuvable.");

            // Le 'contenu' peut être modifié ou repris tel quel via le DTO
            var newMsg = await _chatService.SendMessageAsync(
                userId, 
                dto.TargetConvId, 
                dto.Contenu ?? originalMsg.Contenu, 
                originalMsg.TypeMessage.ToString()
            );

            // Broadcast SignalR manuel (identique à ChatHub.SendMessage)
            var hubDto = new MessageHubDto
            {
                IdMessage      = newMsg.IdMessage,
                ConversationId = newMsg.ConversationId,
                ExpediteurId   = newMsg.ExpediteurId,
                NomExpediteur  = newMsg.Expediteur != null ? $"{newMsg.Expediteur.Prenom} {newMsg.Expediteur.Nom}".Trim() : "",
                Contenu        = newMsg.Contenu,
                TypeMessage    = newMsg.TypeMessage.ToString(),
                EstLu          = newMsg.EstLu,
                DateEnvoi      = newMsg.DateEnvoi.ToString("o"),
                CheminFichier  = newMsg.CheminFichier,
                NomFichier     = newMsg.NomFichier,
                TailleFichier  = newMsg.TailleFichier
            };

            var participantIds = await _chatService.GetConversationParticipantIdsAsync(dto.TargetConvId);
            await _hubContext.Clients.Users(participantIds.Select(id => id.ToString())).SendAsync("ReceiveMessage", hubDto);

            return Ok();
        }

        private long GetUserId()
        {
            return long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }
    }

    public class ForwardMessageDto
    {
        public long MessageId { get; set; }
        public long TargetConvId { get; set; }
        public string? Contenu { get; set; }
    }

    public class CreatePrivateConversationDto
    {
        [System.Text.Json.Serialization.JsonPropertyName("otherUserId")]
        public long OtherUserId { get; set; }
    }

    public class CreateGroupDto
    {
        public string Titre { get; set; } = string.Empty;
        public List<long> ParticipantIds { get; set; } = new();
    }
}
