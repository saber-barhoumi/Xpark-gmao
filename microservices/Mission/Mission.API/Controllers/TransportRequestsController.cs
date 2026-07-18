using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mission.Infrastructure.Data;
using Mission.Application.DTOs;
using Mission.Domain.Entities;
using Mission.Application.Interfaces;
using Mission.Application.Services;

namespace Mission.API.Controllers;

/// <summary>
/// Demandes de transport ("devis") du portail client — l'étape AVANT la Mission.
/// Le client crée / consulte / édite / annule SA demande tant qu'elle est
/// PENDING_QUOTATION ; le staff chiffre puis envoie le devis (QUOTATION_SENT) ;
/// le client accepte (→ Mission créée, réutilise IMissionService) ou refuse.
/// Route nichée sous /api/missions/ (déjà autorisée par la passerelle nginx du
/// back office) pour éviter toute modification d'infra.
/// </summary>
[ApiController]
[Route("api/missions/demandes")]
[Authorize]
public class TransportRequestsController(MissionDbContext db, IMissionService missionService) : ControllerBase
{
    private long    CurrentUserId   => long.Parse(User.FindFirst("userId")!.Value);
    private string? CurrentUserName =>
        $"{User.FindFirst("prenom")?.Value} {User.FindFirst("nom")?.Value}".Trim() is { Length: > 0 } n ? n : null;

    // ── Portail client (frontoffice) ────────────────────────────────────────

    /// <summary>Soumission d'une nouvelle demande — aucune Mission créée à ce stade.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTransportRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.VilleDepart) || string.IsNullOrWhiteSpace(dto.VilleArrivee))
            return BadRequest(new { message = "Villes de depart et d'arrivee obligatoires." });
        if (string.IsNullOrWhiteSpace(dto.CargoDescription))
            return BadRequest(new { message = "La description du fret est obligatoire." });

        var (min, max) = AiPriceRangeCalculator.ComputeRange(dto.AiEstimatedPrice);

        var req = new TransportRequest
        {
            ClientIdUtilisateur      = CurrentUserId,
            ClientNom                = CurrentUserName,
            DateSouhaitee            = DateTime.SpecifyKind(dto.DateSouhaitee, DateTimeKind.Utc),
            VilleDepart              = dto.VilleDepart,
            VilleArrivee             = dto.VilleArrivee,
            CargoDescription         = dto.CargoDescription,
            CargoWeightKg            = dto.CargoWeightKg,
            PassengerCount           = dto.PassengerCount,
            VehicleTypeRequested     = dto.VehicleTypeRequested,
            DistanceKm               = dto.DistanceKm,
            AiEstimatedPrice         = dto.AiEstimatedPrice,
            AiPriceRangeMin          = min,
            AiPriceRangeMax          = max,
            AiVehicleTypeRecommended = dto.AiVehicleTypeRecommended,
            Statut                   = StatutDemandeTransport.PENDING_QUOTATION,
        };
        db.TransportRequests.Add(req);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMyRequest), new { id = req.IdTransportRequest }, req);
    }

    /// <summary>Demandes du client connecté, du plus récent au plus ancien.</summary>
    [HttpGet("my")]
    public async Task<IActionResult> GetMyRequests()
        => Ok(await db.TransportRequests
            .Where(r => r.ClientIdUtilisateur == CurrentUserId)
            .OrderByDescending(r => r.DateCreation)
            .ToListAsync());

    [HttpGet("my/{id:long}")]
    public async Task<IActionResult> GetMyRequest(long id)
    {
        var req = await FindOwnedAsync(id);
        if (req == null) return NotFound(new { message = "Demande introuvable." });
        return Ok(req);
    }

    /// <summary>Édition tant que la demande est PENDING_QUOTATION.</summary>
    [HttpPut("my/{id:long}")]
    public async Task<IActionResult> EditMyRequest(long id, [FromBody] EditTransportRequestDto dto)
    {
        var req = await FindOwnedAsync(id);
        if (req == null) return NotFound(new { message = "Demande introuvable." });
        if (req.Statut != StatutDemandeTransport.PENDING_QUOTATION)
            return BadRequest(new { message = "Cette demande ne peut plus être modifiée (devis déjà envoyé)." });
        if (string.IsNullOrWhiteSpace(dto.VilleDepart) || string.IsNullOrWhiteSpace(dto.VilleArrivee))
            return BadRequest(new { message = "Villes de depart et d'arrivee obligatoires." });

        req.DateSouhaitee            = DateTime.SpecifyKind(dto.DateSouhaitee, DateTimeKind.Utc);
        req.VilleDepart              = dto.VilleDepart;
        req.VilleArrivee             = dto.VilleArrivee;
        req.CargoDescription         = dto.CargoDescription;
        req.CargoWeightKg            = dto.CargoWeightKg;
        req.PassengerCount           = dto.PassengerCount;
        req.VehicleTypeRequested     = dto.VehicleTypeRequested;
        req.DistanceKm               = dto.DistanceKm;
        req.AiEstimatedPrice         = dto.AiEstimatedPrice;
        (req.AiPriceRangeMin, req.AiPriceRangeMax) = AiPriceRangeCalculator.ComputeRange(dto.AiEstimatedPrice);
        req.AiVehicleTypeRecommended = dto.AiVehicleTypeRecommended;
        req.DateMaj                  = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(req);
    }

    /// <summary>Le client retire SA demande tant qu'elle est PENDING_QUOTATION.</summary>
    [HttpPut("my/{id:long}/cancel")]
    public async Task<IActionResult> CancelMyRequest(long id, [FromBody] ReasonDto? dto)
    {
        var req = await FindOwnedAsync(id);
        if (req == null) return NotFound(new { message = "Demande introuvable." });
        if (req.Statut != StatutDemandeTransport.PENDING_QUOTATION)
            return BadRequest(new { message = "Cette demande ne peut plus être annulée (devis déjà envoyé — vous pouvez le refuser)." });

        req.Statut             = StatutDemandeTransport.CANCELLED;
        req.ClientCancelReason = dto?.Reason;
        req.DateClientReponse  = DateTime.UtcNow;
        req.DateMaj             = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(req);
    }

    /// <summary>Acceptation du devis → crée la Mission (réutilise IMissionService), seul point d'entrée du cycle Mission.</summary>
    [HttpPut("my/{id:long}/accept")]
    public async Task<IActionResult> AcceptQuotation(long id)
    {
        var req = await FindOwnedAsync(id);
        if (req == null) return NotFound(new { message = "Demande introuvable." });
        if (req.Statut != StatutDemandeTransport.QUOTATION_SENT || req.FinalPrice is null)
            return BadRequest(new { message = "Aucun devis en attente d'acceptation pour cette demande." });

        var missionDto = new ClientMissionRequestDto
        {
            DateDepart         = req.DateSouhaitee,
            VilleDepart        = req.VilleDepart,
            VilleArrivee       = req.VilleArrivee,
            ObjetMission       = req.CargoDescription,
            DistanceKm         = req.DistanceKm,
            CoutEstime         = req.FinalPrice.Value,   // prix CONVENU, pas l'estimation IA brute
            AiVehiculeTypeUsed = req.AiVehicleTypeRecommended,
        };

        MissionResponseDto mission;
        try { mission = await missionService.CreateMissionFromAcceptedRequestAsync(CurrentUserId, CurrentUserName, missionDto); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }

        req.Statut             = StatutDemandeTransport.ACCEPTED;
        req.MissionId           = mission.IdMission;
        req.DateClientReponse   = DateTime.UtcNow;
        req.DateMaj              = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(mission);
    }

    /// <summary>Refus du devis — aucune Mission créée.</summary>
    [HttpPut("my/{id:long}/reject")]
    public async Task<IActionResult> RejectQuotation(long id, [FromBody] ReasonDto? dto)
    {
        var req = await FindOwnedAsync(id);
        if (req == null) return NotFound(new { message = "Demande introuvable." });
        if (req.Statut != StatutDemandeTransport.QUOTATION_SENT)
            return BadRequest(new { message = "Aucun devis en attente pour cette demande." });

        req.Statut                = StatutDemandeTransport.REJECTED;
        req.ClientRejectionReason = dto?.Reason;
        req.DateClientReponse     = DateTime.UtcNow;
        req.DateMaj                = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(req);
    }

    private Task<TransportRequest?> FindOwnedAsync(long id) => db.TransportRequests
        .FirstOrDefaultAsync(r => r.IdTransportRequest == id && r.ClientIdUtilisateur == CurrentUserId);

    // ── Backoffice (staff) ──────────────────────────────────────────────────

    /// <summary>Toutes les demandes (staff), filtrables par statut.</summary>
    [HttpGet]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> GetAll([FromQuery] string? statut)
    {
        var q = db.TransportRequests.AsQueryable();
        if (!string.IsNullOrEmpty(statut) && Enum.TryParse<StatutDemandeTransport>(statut, true, out var s))
            q = q.Where(r => r.Statut == s);
        return Ok(await q.OrderByDescending(r => r.DateCreation).ToListAsync());
    }

    [HttpGet("{id:long}")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> GetById(long id)
    {
        var req = await db.TransportRequests.FindAsync(id);
        if (req == null) return NotFound(new { message = "Demande introuvable." });
        return Ok(req);
    }

    /// <summary>Suppression d'une demande (staff). Même convention que Alerts.API.</summary>
    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> Delete(long id)
    {
        var req = await db.TransportRequests.FindAsync(id);
        if (req == null) return NotFound(new { message = "Demande introuvable." });
        db.TransportRequests.Remove(req);
        await db.SaveChangesAsync();
        return Ok(new { message = "Demande supprimée." });
    }

    /// <summary>Suppression en masse (staff) — miroir de POST /alertes/supprimer.</summary>
    [HttpPost("supprimer")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> DeleteMany([FromBody] DeleteManyDto dto)
    {
        if (dto.Ids is not { Length: > 0 })
            return BadRequest(new { message = "Aucun identifiant fourni." });
        var count = await db.TransportRequests
            .Where(r => dto.Ids.Contains(r.IdTransportRequest))
            .ExecuteDeleteAsync();
        return Ok(new { count });
    }

    /// <summary>Le staff chiffre et envoie le devis → QUOTATION_SENT.</summary>
    [HttpPut("{id:long}/quote")]
    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    public async Task<IActionResult> SendQuotation(long id, [FromBody] SendQuotationDto dto)
    {
        var req = await db.TransportRequests.FindAsync(id);
        if (req == null) return NotFound(new { message = "Demande introuvable." });
        if (req.Statut != StatutDemandeTransport.PENDING_QUOTATION)
            return BadRequest(new { message = "Un devis a déjà été envoyé pour cette demande." });
        if (dto.FinalPrice <= 0)
            return BadRequest(new { message = "Le prix doit être positif." });

        req.FinalPrice           = dto.FinalPrice;
        req.PricingMethod        = dto.PricingMethod;
        req.AdminNote            = dto.AdminNote;
        req.QuotedByUserId       = CurrentUserId;
        req.QuotedByName         = CurrentUserName;
        req.DateQuotationEnvoyee = DateTime.UtcNow;
        req.Statut               = StatutDemandeTransport.QUOTATION_SENT;
        req.DateMaj              = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(req);
    }
}

public record CreateTransportRequestDto(
    DateTime DateSouhaitee, string VilleDepart, string VilleArrivee, string CargoDescription,
    double CargoWeightKg, int PassengerCount, string? VehicleTypeRequested,
    double DistanceKm, double AiEstimatedPrice, string? AiVehicleTypeRecommended);

public record EditTransportRequestDto(
    DateTime DateSouhaitee, string VilleDepart, string VilleArrivee, string CargoDescription,
    double CargoWeightKg, int PassengerCount, string? VehicleTypeRequested,
    double DistanceKm, double AiEstimatedPrice, string? AiVehicleTypeRecommended);

public record SendQuotationDto(
    double FinalPrice,
    [property: System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))] MethodePrix PricingMethod,
    string? AdminNote);
public record ReasonDto(string? Reason);
public record DeleteManyDto(long[] Ids);
