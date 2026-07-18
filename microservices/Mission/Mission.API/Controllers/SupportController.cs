using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mission.Infrastructure.Data;
using Mission.Domain.Entities;

namespace Mission.API.Controllers;

/// <summary>
/// Tickets de support du portail client (feature 🎫 Support).
/// Le client crée / consulte / ferme SES tickets ; le staff répond et change le statut.
/// </summary>
[ApiController]
[Route("api/support")]
[Authorize]
public class SupportController(MissionDbContext db) : ControllerBase
{
    private static readonly string[] CategoriesValides = ["MISSION", "FACTURATION", "TECHNIQUE", "AUTRE"];
    private static readonly string[] StatutsValides    = ["OUVERT", "EN_COURS", "RESOLU", "FERME"];

    private long   CurrentUserId   => long.Parse(User.FindFirst("userId")!.Value);
    private string CurrentUserName =>
        $"{User.FindFirst("prenom")?.Value} {User.FindFirst("nom")?.Value}".Trim();

    // ── Portail client (frontoffice) ──────────────────────────────────────────

    /// <summary>Tickets du client connecté, du plus récent au plus ancien.</summary>
    [HttpGet("my")]
    public async Task<IActionResult> GetMyTickets()
        => Ok(await db.SupportTickets
            .Where(t => t.ClientIdUtilisateur == CurrentUserId)
            .OrderByDescending(t => t.DateCreation)
            .ToListAsync());

    /// <summary>Création d'un ticket par le client.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTicketDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Sujet))
            return BadRequest(new { message = "Le sujet est obligatoire." });
        if (string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { message = "Le message est obligatoire." });

        var categorie = (dto.Categorie ?? "AUTRE").ToUpperInvariant();
        if (!CategoriesValides.Contains(categorie)) categorie = "AUTRE";

        // La mission liée (optionnelle) doit appartenir au client
        if (dto.MissionId is { } mid &&
            !await db.Missions.AnyAsync(m => m.IdMission == mid && m.ClientIdUtilisateur == CurrentUserId))
            return BadRequest(new { message = "Mission liée introuvable." });

        var ticket = new SupportTicket
        {
            ClientIdUtilisateur = CurrentUserId,
            ClientNom           = CurrentUserName,
            Sujet               = dto.Sujet.Trim(),
            Categorie           = categorie,
            Message             = dto.Message.Trim(),
            MissionId           = dto.MissionId,
        };
        db.SupportTickets.Add(ticket);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMyTickets), new { id = ticket.IdTicket }, ticket);
    }

    /// <summary>Le client ferme SON ticket (résolu de son point de vue).</summary>
    [HttpPut("my/{id:long}/close")]
    public async Task<IActionResult> CloseMyTicket(long id)
    {
        var ticket = await db.SupportTickets
            .FirstOrDefaultAsync(t => t.IdTicket == id && t.ClientIdUtilisateur == CurrentUserId);
        if (ticket == null) return NotFound(new { message = "Ticket introuvable." });

        ticket.Statut  = "FERME";
        ticket.DateMaj = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { message = "Ticket fermé." });
    }

    // ── Backoffice (staff) ─────────────────────────────────────────────────────

    /// <summary>Tous les tickets (staff), filtrables par statut.</summary>
    [HttpGet]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> GetAll([FromQuery] string? statut)
    {
        var q = db.SupportTickets.AsQueryable();
        if (!string.IsNullOrEmpty(statut)) q = q.Where(t => t.Statut == statut.ToUpperInvariant());
        return Ok(await q.OrderByDescending(t => t.DateCreation).ToListAsync());
    }

    /// <summary>Réponse du staff + changement de statut.</summary>
    [HttpPut("{id:long}/respond")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> Respond(long id, [FromBody] RespondTicketDto dto)
    {
        var ticket = await db.SupportTickets.FindAsync(id);
        if (ticket == null) return NotFound(new { message = "Ticket introuvable." });

        if (!string.IsNullOrWhiteSpace(dto.Reponse)) ticket.Reponse = dto.Reponse.Trim();
        var statut = (dto.Statut ?? "EN_COURS").ToUpperInvariant();
        if (StatutsValides.Contains(statut)) ticket.Statut = statut;
        ticket.DateMaj = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(ticket);
    }
}

public record CreateTicketDto(string Sujet, string? Categorie, string Message, long? MissionId);
public record RespondTicketDto(string? Reponse, string? Statut);
