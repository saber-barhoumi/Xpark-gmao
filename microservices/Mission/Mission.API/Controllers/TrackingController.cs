using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mission.Infrastructure.Data;
using Mission.Domain.Entities;

namespace Mission.API.Controllers;

/// <summary>
/// Suivi GPS temps réel (feature XPARK Driver).
///  - POST /api/tracking/ping           : le chauffeur (app mobile) envoie sa position
///  - GET  /api/tracking/mission/{id}/live    : dernière position (carte client / back-office)
///  - GET  /api/tracking/mission/{id}/history : trace du trajet (fil d'Ariane)
///
/// Sécurité : lecture réservée au client propriétaire de la mission, au
/// chauffeur, ou au staff. Écriture réservée aux chauffeurs/staff.
/// </summary>
[ApiController]
[Route("api/tracking")]
[Authorize]
public class TrackingController(MissionDbContext db) : ControllerBase
{
    private static readonly string[] Staff = ["ADMIN", "ADMINISTRATEUR", "GESTIONNAIRE"];

    private long CurrentUserId => long.Parse(User.FindFirst("userId")!.Value);
    private bool IsStaff => Staff.Any(User.IsInRole);
    private bool IsDriver => User.IsInRole("CHAUFFEUR") || IsStaff;

    // ── Écriture (app mobile chauffeur) ───────────────────────────────────────

    [HttpPost("ping")]
    public async Task<IActionResult> Ping([FromBody] PingDto dto)
    {
        if (!IsDriver) return Forbid();
        if (dto.Latitude is < -90 or > 90 || dto.Longitude is < -180 or > 180)
            return BadRequest(new { message = "Coordonnées invalides." });

        var mission = await db.Missions.FirstOrDefaultAsync(m => m.IdMission == dto.MissionId);
        if (mission == null) return NotFound(new { message = "Mission introuvable." });

        db.LivePositions.Add(new LivePosition
        {
            MissionId  = dto.MissionId,
            DriverId   = CurrentUserId,
            VehiculeId = dto.VehiculeId ?? mission.VehiculeId,
            Latitude   = dto.Latitude,
            Longitude  = dto.Longitude,
            SpeedKmh   = dto.SpeedKmh,
            Heading    = dto.Heading,
            Accuracy   = dto.Accuracy,
            RecordedAt = dto.RecordedAt == default ? DateTime.UtcNow : dto.RecordedAt.ToUniversalTime(),
        });
        await db.SaveChangesAsync();
        return Ok(new { message = "Position enregistrée." });
    }

    // ── Lecture (carte client / back-office) ──────────────────────────────────

    [HttpGet("mission/{missionId:long}/live")]
    public async Task<IActionResult> Live(long missionId)
    {
        var mission = await db.Missions.FirstOrDefaultAsync(m => m.IdMission == missionId);
        if (mission == null) return NotFound(new { message = "Mission introuvable." });
        if (!CanRead(mission)) return Forbid();

        var last = await db.LivePositions
            .Where(p => p.MissionId == missionId)
            .OrderByDescending(p => p.RecordedAt)
            .ThenByDescending(p => p.IdPosition)   // départage les pings de même horodatage
            .FirstOrDefaultAsync();

        if (last == null) return Ok(new { hasFix = false });

        var ageSeconds = (DateTime.UtcNow - last.RecordedAt).TotalSeconds;
        return Ok(new
        {
            hasFix     = true,
            latitude   = last.Latitude,
            longitude  = last.Longitude,
            speedKmh   = last.SpeedKmh,
            heading    = last.Heading,
            accuracy   = last.Accuracy,
            recordedAt = last.RecordedAt,
            ageSeconds = Math.Round(ageSeconds, 1),
            isFresh    = ageSeconds <= 60,   // < 1 min → considéré « en direct »
        });
    }

    [HttpGet("mission/{missionId:long}/history")]
    public async Task<IActionResult> History(long missionId, [FromQuery] int limit = 200)
    {
        var mission = await db.Missions.FirstOrDefaultAsync(m => m.IdMission == missionId);
        if (mission == null) return NotFound(new { message = "Mission introuvable." });
        if (!CanRead(mission)) return Forbid();

        // Les N plus récents (EF ne traduit pas TakeLast) puis remis en ordre chronologique
        var recent = await db.LivePositions
            .Where(p => p.MissionId == missionId)
            .OrderByDescending(p => p.RecordedAt).ThenByDescending(p => p.IdPosition)
            .Take(Math.Clamp(limit, 1, 2000))
            .Select(p => new { p.Latitude, p.Longitude, p.SpeedKmh, p.Heading, p.RecordedAt })
            .ToListAsync();
        recent.Reverse();
        return Ok(recent);
    }

    private bool CanRead(Mission.Domain.Entities.Mission m)
        => IsStaff
        || m.ClientIdUtilisateur == CurrentUserId    // le client propriétaire
        || User.IsInRole("CHAUFFEUR");               // les chauffeurs
}

public record PingDto(
    long MissionId, long? VehiculeId,
    double Latitude, double Longitude,
    double? SpeedKmh, double? Heading, double? Accuracy,
    DateTime RecordedAt);
