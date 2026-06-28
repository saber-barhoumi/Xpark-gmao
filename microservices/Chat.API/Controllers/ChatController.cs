using System.Security.Claims;
using Chat.API.Data;
using Chat.API.Entities;
using Chat.API.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Chat.API.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController(
    ChatDbContext db,
    IHubContext<ChatHub> hub,
    IWebHostEnvironment env) : ControllerBase
{
    // ── Conversations ──────────────────────────────────────────────────────────

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        var userId = GetUserId();
        var list = await db.Conversations
            .Where(c => c.Participants.Any(p => p.UtilisateurId == userId) && !c.EstArchivee)
            .Include(c => c.Participants).ThenInclude(p => p.Utilisateur)
            .Include(c => c.Messages.OrderByDescending(m => m.DateEnvoi).Take(1))
                .ThenInclude(m => m.Expediteur)
            .OrderByDescending(c => c.DernierMessageDate)
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("conversations/archived")]
    public async Task<IActionResult> GetArchivedConversations()
    {
        var userId = GetUserId();
        var list = await db.Conversations
            .Where(c => c.Participants.Any(p => p.UtilisateurId == userId) && c.EstArchivee)
            .Include(c => c.Participants).ThenInclude(p => p.Utilisateur)
            .Include(c => c.Messages.OrderByDescending(m => m.DateEnvoi).Take(1))
                .ThenInclude(m => m.Expediteur)
            .OrderByDescending(c => c.DernierMessageDate)
            .ToListAsync();
        return Ok(list);
    }

    [HttpDelete("conversations/{id:long}")]
    public async Task<IActionResult> DeleteConversation(long id)
    {
        var userId = GetUserId();
        var conv = await db.Conversations
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.IdConversation == id);
        if (conv == null) return NotFound();
        if (!conv.Participants.Any(p => p.UtilisateurId == userId)) return Forbid();

        // Clear reply references first to avoid self-FK violation
        var msgs = await db.ChatMessages.Where(m => m.ConversationId == id).ToListAsync();
        foreach (var m in msgs.Where(m => m.ReponseAMessageId != null))
            m.ReponseAMessageId = null;
        await db.SaveChangesAsync();

        // Delete reactions, then messages
        var msgIds = msgs.Select(m => m.IdMessage).ToList();
        var reactions = await db.MessageReactions.Where(r => msgIds.Contains(r.MessageId)).ToListAsync();
        db.MessageReactions.RemoveRange(reactions);
        db.ChatMessages.RemoveRange(msgs);
        await db.SaveChangesAsync();

        db.ConversationParticipants.RemoveRange(conv.Participants);
        db.Conversations.Remove(conv);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("conversations/{id:long}")]
    public async Task<IActionResult> GetConversation(long id)
    {
        var conv = await db.Conversations
            .Include(c => c.Participants).ThenInclude(p => p.Utilisateur)
            .Include(c => c.Messages.OrderByDescending(m => m.DateEnvoi).Take(50))
                .ThenInclude(m => m.Expediteur)
            .FirstOrDefaultAsync(c => c.IdConversation == id);

        if (conv == null) return NotFound();
        return Ok(conv);
    }

    [HttpPost("conversations/private")]
    public async Task<IActionResult> CreatePrivate([FromBody] CreatePrivateConvDto dto)
    {
        if (dto.OtherUserId <= 0) return BadRequest("OtherUserId requis");

        var userId = GetUserId();

        var existing = await db.Conversations
            .Include(c => c.Participants).ThenInclude(p => p.Utilisateur)
            .Where(c => c.TypeConversation == TypeConversation.PRIVEE)
            .Where(c => c.Participants.Count == 2)
            .Where(c => c.Participants.Any(p => p.UtilisateurId == userId))
            .Where(c => c.Participants.Any(p => p.UtilisateurId == dto.OtherUserId))
            .FirstOrDefaultAsync();

        if (existing != null) return Ok(existing);

        var conv = new Conversation
        {
            TypeConversation = TypeConversation.PRIVEE,
            DateCreation     = DateTime.UtcNow,
            CreatedByUserId  = userId,
        };
        db.Conversations.Add(conv);
        await db.SaveChangesAsync();

        await AddParticipantAsync(conv.IdConversation, userId);
        await AddParticipantAsync(conv.IdConversation, dto.OtherUserId);

        var result = await db.Conversations
            .Include(c => c.Participants).ThenInclude(p => p.Utilisateur)
            .FirstAsync(c => c.IdConversation == conv.IdConversation);
        return Ok(result);
    }

    [HttpPost("conversations/group")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupConvDto dto)
    {
        var userId = GetUserId();
        var conv = new Conversation
        {
            Titre            = dto.Titre,
            TypeConversation = TypeConversation.GROUPE,
            DateCreation     = DateTime.UtcNow,
            CreatedByUserId  = userId,
        };
        db.Conversations.Add(conv);
        await db.SaveChangesAsync();

        db.ConversationParticipants.Add(new ConversationParticipant
        {
            ConversationId = conv.IdConversation,
            UtilisateurId  = userId,
            DateAjout      = DateTime.UtcNow,
            EstAdmin       = true,
        });
        await db.SaveChangesAsync();

        foreach (var pid in dto.ParticipantIds.Where(id => id != userId))
            await AddParticipantAsync(conv.IdConversation, pid);

        var result = await db.Conversations
            .Include(c => c.Participants).ThenInclude(p => p.Utilisateur)
            .FirstAsync(c => c.IdConversation == conv.IdConversation);
        return Ok(result);
    }

    // ── Messages ───────────────────────────────────────────────────────────────

    [HttpGet("conversations/{id:long}/messages")]
    public async Task<IActionResult> GetMessages(long id, [FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var msgs = await db.ChatMessages
            .Where(m => m.ConversationId == id && !m.EstSupprime)
            .Include(m => m.Expediteur)
            .Include(m => m.Reactions).ThenInclude(r => r.Utilisateur)
            .OrderByDescending(m => m.DateEnvoi)
            .Skip(skip).Take(take)
            .ToListAsync();
        return Ok(msgs);
    }

    [HttpPost("conversations/{id:long}/upload")]
    public async Task<IActionResult> UploadFile(long id, IFormFile file)
    {
        var userId = GetUserId();
        var uploadDir = Path.Combine(env.ContentRootPath, "wwwroot", "uploads", "chat");
        Directory.CreateDirectory(uploadDir);

        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadDir, fileName);
        await using (var stream = System.IO.File.Create(filePath))
            await file.CopyToAsync(stream);

        var msgType = file.ContentType.StartsWith("image/") ? TypeMessage.IMAGE : TypeMessage.FICHIER;

        var msg = new Message
        {
            ExpediteurId   = userId,
            ConversationId = id,
            Contenu        = file.FileName,
            TypeMessage    = msgType,
            DateEnvoi      = DateTime.UtcNow,
            CheminFichier  = $"/uploads/chat/{fileName}",
            NomFichier     = file.FileName,
            TailleFichier  = file.Length,
        };
        db.ChatMessages.Add(msg);

        var conv = await db.Conversations.FindAsync(id);
        if (conv != null) conv.DernierMessageDate = DateTime.UtcNow;

        await db.SaveChangesAsync();

        var saved = await db.ChatMessages.Include(m => m.Expediteur)
            .FirstAsync(m => m.IdMessage == msg.IdMessage);

        // Notify via SignalR
        var participantIds = await db.ConversationParticipants
            .Where(p => p.ConversationId == id)
            .Select(p => p.UtilisateurId.ToString())
            .ToListAsync();
        await hub.Clients.Users(participantIds).SendAsync("ReceiveMessage", ToHubDto(saved));

        return Ok(saved);
    }

    [HttpDelete("messages/{id:long}")]
    public async Task<IActionResult> DeleteMessage(long id)
    {
        var userId = GetUserId();
        var msg = await db.ChatMessages.FindAsync(id);
        if (msg == null || msg.ExpediteurId != userId) return Forbid();

        msg.EstSupprime = true;
        await db.SaveChangesAsync();

        await hub.Clients.Group($"conv_{msg.ConversationId}")
            .SendAsync("MessageSupprime", new { MessageId = id });
        return NoContent();
    }

    [HttpPut("messages/{id:long}/epingler")]
    public async Task<IActionResult> PinMessage(long id)
    {
        var userId = GetUserId();
        var msg = await db.ChatMessages.FindAsync(id);
        if (msg == null) return NotFound();

        var isParticipant = await db.ConversationParticipants
            .AnyAsync(p => p.ConversationId == msg.ConversationId && p.UtilisateurId == userId);
        if (!isParticipant) return Forbid();

        msg.Epingle = !msg.Epingle;
        await db.SaveChangesAsync();

        await hub.Clients.Group($"conv_{msg.ConversationId}")
            .SendAsync("MessageEpingle", new { MessageId = id, Epingle = msg.Epingle });
        return Ok(new { epingle = msg.Epingle });
    }

    [HttpPost("messages/forward")]
    public async Task<IActionResult> ForwardMessage([FromBody] ForwardMessageDto dto)
    {
        var userId = GetUserId();
        var orig = await db.ChatMessages.FirstOrDefaultAsync(m => m.IdMessage == dto.MessageId);
        if (orig == null) return NotFound();

        var fwd = new Message
        {
            ExpediteurId   = userId,
            ConversationId = dto.TargetConvId,
            Contenu        = dto.Contenu ?? orig.Contenu,
            TypeMessage    = orig.TypeMessage,
            DateEnvoi      = DateTime.UtcNow,
        };
        db.ChatMessages.Add(fwd);

        var conv = await db.Conversations.FindAsync(dto.TargetConvId);
        if (conv != null) conv.DernierMessageDate = DateTime.UtcNow;

        await db.SaveChangesAsync();

        var saved = await db.ChatMessages.Include(m => m.Expediteur)
            .FirstAsync(m => m.IdMessage == fwd.IdMessage);

        var participantIds = await db.ConversationParticipants
            .Where(p => p.ConversationId == dto.TargetConvId)
            .Select(p => p.UtilisateurId.ToString())
            .ToListAsync();
        await hub.Clients.Users(participantIds).SendAsync("ReceiveMessage", ToHubDto(saved));

        return Ok();
    }

    // ── Conversation actions ────────────────────────────────────────────────────

    [HttpPut("conversations/{id:long}/pin")]
    public async Task<IActionResult> TogglePin(long id)
    {
        var userId = GetUserId();
        var p = await db.ConversationParticipants
            .FirstOrDefaultAsync(x => x.ConversationId == id && x.UtilisateurId == userId);
        if (p == null) return NotFound();
        p.EstEpingle = !p.EstEpingle;
        await db.SaveChangesAsync();
        return Ok(new { epingle = p.EstEpingle });
    }

    [HttpPut("conversations/{id:long}/mute")]
    public async Task<IActionResult> ToggleMute(long id)
    {
        var userId = GetUserId();
        var p = await db.ConversationParticipants
            .FirstOrDefaultAsync(x => x.ConversationId == id && x.UtilisateurId == userId);
        if (p == null) return NotFound();
        p.NotificationsActivees = !p.NotificationsActivees;
        await db.SaveChangesAsync();
        return Ok(new { mute = !p.NotificationsActivees });
    }

    [HttpPut("conversations/{id:long}/archive")]
    public async Task<IActionResult> ToggleArchive(long id)
    {
        var userId = GetUserId();
        var conv = await db.Conversations.FindAsync(id);
        if (conv == null) return NotFound();
        var isP = await db.ConversationParticipants
            .AnyAsync(x => x.ConversationId == id && x.UtilisateurId == userId);
        if (!isP) return Forbid();
        conv.EstArchivee = !conv.EstArchivee;
        await db.SaveChangesAsync();
        return Ok(new { archivee = conv.EstArchivee });
    }

    // ── Users ──────────────────────────────────────────────────────────────────

    [HttpGet("users/online")]
    public async Task<IActionResult> GetOnlineUsers()
    {
        var online = await db.UtilisateurStatuts
            .Where(s => s.Statut == StatutEnLigne.ENLIGNE)
            .Include(s => s.Utilisateur)
            .OrderBy(s => s.Utilisateur.Prenom)
            .ToListAsync();
        return Ok(online);
    }

    [HttpGet("users/search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string query = "")
    {
        var userId = GetUserId();
        var q = db.Utilisateurs.AsQueryable();
        if (!string.IsNullOrEmpty(query))
            q = q.Where(u => (u.Prenom + " " + u.Nom).Contains(query) || u.Email.Contains(query));

        var results = await q.Where(u => u.IdUtilisateur != userId && u.Actif).Take(20).ToListAsync();
        return Ok(results);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private async Task AddParticipantAsync(long convId, long userId)
    {
        var exists = await db.ConversationParticipants
            .AnyAsync(p => p.ConversationId == convId && p.UtilisateurId == userId);
        if (!exists)
        {
            db.ConversationParticipants.Add(new ConversationParticipant
            {
                ConversationId = convId, UtilisateurId = userId, DateAjout = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }
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
        var val = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(val, out var id) ? id : 0;
    }
}
