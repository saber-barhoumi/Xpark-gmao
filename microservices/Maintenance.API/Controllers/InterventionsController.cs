using Maintenance.API.Data;
using Maintenance.API.DTOs;
using Maintenance.API.Entities;
using Maintenance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Maintenance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InterventionsController(MaintenanceDbContext context, IMaintenanceService maintenanceService, ILogger<InterventionsController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? statut = null, [FromQuery] string? type = null, [FromQuery] long? vehiculeId = null)
    {
        var query = context.Interventions
            .Include(i => i.InterventionPieces).ThenInclude(ip => ip.Piece)
            .AsQueryable();

        if (!string.IsNullOrEmpty(statut) && Enum.TryParse<StatutIntervention>(statut, true, out var s))
            query = query.Where(i => i.Statut == s);
        if (!string.IsNullOrEmpty(type) && Enum.TryParse<TypeIntervention>(type, true, out var t))
            query = query.Where(i => i.TypeIntervention == t);
        if (vehiculeId.HasValue)
            query = query.Where(i => i.VehiculeId == vehiculeId.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.DateIntervention)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new {
                i.IdIntervention, i.DateIntervention, i.DateFinIntervention,
                i.Description, i.Cout, i.CoutMainOeuvre, i.CoutPieces,
                i.KilometrageIntervention, i.DureeMinutes, i.TypePeriodicite,
                Statut = i.Statut.ToString(), TypeIntervention = i.TypeIntervention.ToString(),
                i.VehiculeId, VehiculeImmatriculation = (string?)null,
                i.TechnicienId, i.OrdreTravailId, i.Prestataire, i.Observations,
                NombrePieces = i.InterventionPieces.Count
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var i = await context.Interventions
            .Include(x => x.InterventionPieces).ThenInclude(ip => ip.Piece)
            .FirstOrDefaultAsync(x => x.IdIntervention == id);
        if (i == null) return NotFound(new { message = $"Intervention {id} introuvable" });

        return Ok(new {
            i.IdIntervention, i.DateIntervention, i.DateFinIntervention,
            i.Description, i.Cout, i.CoutMainOeuvre, i.CoutPieces,
            i.KilometrageIntervention, i.DureeMinutes, i.TypePeriodicite,
            i.Observations, i.Prestataire,
            Statut = i.Statut.ToString(), TypeIntervention = i.TypeIntervention.ToString(),
            i.VehiculeId, VehiculeImmatriculation = (string?)null,
            i.TechnicienId, i.OrdreTravailId,
            PiecesUtilisees = i.InterventionPieces.Select(ip => new {
                ip.IdInterventionPiece, ip.PieceId, ip.Piece.Reference, ip.Piece.Designation,
                ip.Quantite, ip.PrixUnitaire, PrixTotal = ip.Quantite * ip.PrixUnitaire
            })
        });
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> Create([FromBody] CreateInterventionDto dto)
    {
        try
        {
            var result = await maintenanceService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.IdIntervention }, result);
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (ArgumentException ex)         { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateInterventionRequest dto)
    {
        var intervention = await context.Interventions.FindAsync(id);
        if (intervention == null) return NotFound(new { message = $"Intervention {id} introuvable" });

        if (dto.DateIntervention.HasValue)          intervention.DateIntervention        = dto.DateIntervention.Value;
        if (dto.Description   != null)              intervention.Description             = dto.Description;
        if (dto.Observations  != null)              intervention.Observations            = dto.Observations;
        if (dto.Cout.HasValue)                      intervention.Cout                    = dto.Cout.Value;
        if (dto.CoutMainOeuvre.HasValue)            intervention.CoutMainOeuvre          = dto.CoutMainOeuvre;
        if (dto.KilometrageIntervention.HasValue)   intervention.KilometrageIntervention = dto.KilometrageIntervention.Value;
        if (dto.DureeMinutes.HasValue)              intervention.DureeMinutes            = dto.DureeMinutes;
        if (dto.TypePeriodicite != null)            intervention.TypePeriodicite         = dto.TypePeriodicite;
        if (dto.TechnicienId.HasValue)              intervention.TechnicienId            = dto.TechnicienId;
        if (dto.OrdreTravailId.HasValue)            intervention.OrdreTravailId          = dto.OrdreTravailId;

        if (dto.Statut.HasValue)
            await maintenanceService.UpdateStatutAsync(id, dto.Statut.Value);
        else
            await context.SaveChangesAsync();

        return Ok(new { message = "Intervention mise à jour" });
    }

    [HttpPatch("{id:long}/statut")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> UpdateStatut(long id, [FromBody] UpdateStatutRequest req)
    {
        if (!Enum.TryParse<StatutIntervention>(req.Statut, true, out var statut))
            return BadRequest(new { message = "Statut invalide" });
        var result = await maintenanceService.UpdateStatutAsync(id, statut);
        if (!result) return NotFound(new { message = $"Intervention {id} introuvable" });
        return Ok(new { message = "Statut mis à jour" });
    }

    [HttpPost("{id:long}/pieces")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> AddPiece(long id, [FromBody] AddPieceRequest dto)
    {
        var intervention = await context.Interventions.FindAsync(id);
        if (intervention == null) return NotFound(new { message = $"Intervention {id} introuvable" });

        var piece = await context.PiecesRechange.FindAsync(dto.PieceId);
        if (piece == null) return NotFound(new { message = "Pièce introuvable" });
        if (piece.StockActuel < dto.Quantite)
            return BadRequest(new { message = $"Stock insuffisant. Stock disponible: {piece.StockActuel}" });

        var existing = await context.InterventionPieces
            .FirstOrDefaultAsync(ip => ip.InterventionId == id && ip.PieceId == dto.PieceId);

        if (existing != null) existing.Quantite += dto.Quantite;
        else context.InterventionPieces.Add(new InterventionPiece {
            InterventionId = id, PieceId = dto.PieceId, Quantite = dto.Quantite, PrixUnitaire = piece.PrixUnitaire
        });

        piece.StockActuel -= dto.Quantite;
        await context.SaveChangesAsync();
        return Ok(new { message = "Pièce ajoutée à l'intervention" });
    }

    [HttpDelete("{id:long}/pieces/{pieceId:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> RemovePiece(long id, long pieceId)
    {
        var ip = await context.InterventionPieces
            .Include(x => x.Piece)
            .FirstOrDefaultAsync(x => x.InterventionId == id && x.PieceId == pieceId);
        if (ip == null) return NotFound(new { message = "Pièce non trouvée dans cette intervention" });

        ip.Piece.StockActuel += ip.Quantite;
        context.InterventionPieces.Remove(ip);
        await context.SaveChangesAsync();
        return Ok(new { message = "Pièce retirée de l'intervention" });
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await maintenanceService.DeleteAsync(id);
        if (!result) return NotFound(new { message = $"Intervention {id} introuvable" });
        return NoContent();
    }
}

public class UpdateInterventionRequest
{
    public DateTime?           DateIntervention        { get; set; }
    public string?             Description             { get; set; }
    public string?             Observations            { get; set; }
    public double?             Cout                    { get; set; }
    public double?             CoutMainOeuvre          { get; set; }
    public double?             KilometrageIntervention { get; set; }
    public int?                DureeMinutes            { get; set; }
    public string?             TypePeriodicite         { get; set; }
    public long?               TechnicienId            { get; set; }
    public long?               OrdreTravailId          { get; set; }
    public StatutIntervention? Statut                  { get; set; }
}

public class UpdateStatutRequest { public string Statut { get; set; } = string.Empty; }
public class AddPieceRequest     { public long PieceId { get; set; } public int Quantite { get; set; } }
