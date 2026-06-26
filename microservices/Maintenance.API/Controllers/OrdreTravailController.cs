using Maintenance.API.Data;
using Maintenance.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Maintenance.API.Controllers;

[ApiController]
[Route("api/ordres-travail")]
[Authorize]
public class OrdreTravailController(MaintenanceDbContext context, ILogger<OrdreTravailController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? statut = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = context.OrdresTravail
            .Include(ot => ot.Interventions)
            .AsQueryable();

        if (!string.IsNullOrEmpty(statut) && Enum.TryParse<StatutOrdreTravail>(statut, true, out var s))
            query = query.Where(ot => ot.Statut == s);

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(ot => ot.Priorite).ThenByDescending(ot => ot.DateCreation)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(ot => new {
                ot.IdOrdreTravail, ot.Reference, ot.DateCreation, ot.DateDebut, ot.DateFin,
                ot.Description, Statut = ot.Statut.ToString(), ot.CoutReel,
                ot.VehiculeId,  VehiculeImmatriculation = (string?)null,
                VehiculeMarque  = (string?)null, VehiculeModele = (string?)null,
                ot.TechnicienId, TechnicienNom = (string?)null, TechnicienPrenom = (string?)null,
                NombreInterventions = ot.Interventions.Count, Priorite = ot.Priorite.ToString()
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var ot = await context.OrdresTravail
            .Include(o => o.Interventions)
            .FirstOrDefaultAsync(o => o.IdOrdreTravail == id);
        if (ot == null) return NotFound(new { message = $"Ordre de travail {id} introuvable" });

        return Ok(new {
            ot.IdOrdreTravail, ot.Reference, ot.DateCreation, ot.DateDebut, ot.DateFin,
            ot.Description, ot.Observations, Statut = ot.Statut.ToString(), ot.CoutReel,
            ot.VehiculeId,  VehiculeImmatriculation = (string?)null,
            VehiculeMarque  = (string?)null, VehiculeModele = (string?)null,
            ot.TechnicienId, TechnicienNom = (string?)null, TechnicienPrenom = (string?)null,
            NombreInterventions = ot.Interventions.Count,
            CoutEstime = ot.Interventions.Sum(i => i.Cout), Priorite = ot.Priorite.ToString()
        });
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Create([FromBody] CreateOrdreTravailRequest dto)
    {
        var reference = string.IsNullOrEmpty(dto.Reference)
            ? $"OT-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}"
            : dto.Reference;

        var ot = new OrdreTravail {
            Reference = reference, Description = dto.Description ?? string.Empty,
            Observations = dto.Observations, VehiculeId = dto.VehiculeId,
            TechnicienId = dto.TechnicienId, DateDebut = dto.DateDebut, DateFin = dto.DateFin,
            Statut = StatutOrdreTravail.PLANIFIE, Priorite = dto.Priorite, DateCreation = DateTime.UtcNow
        };

        context.OrdresTravail.Add(ot);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = ot.IdOrdreTravail }, new { ot.IdOrdreTravail, ot.Reference });
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateOrdreTravailRequest dto)
    {
        var ot = await context.OrdresTravail.FindAsync(id);
        if (ot == null) return NotFound(new { message = $"Ordre de travail {id} introuvable" });

        if ((ot.Statut == StatutOrdreTravail.TERMINE || ot.Statut == StatutOrdreTravail.ANNULE)
            && (dto.Description != null || dto.Observations != null || dto.TechnicienId.HasValue
                || dto.DateDebut.HasValue || dto.DateFin.HasValue || dto.CoutReel.HasValue || dto.Priorite.HasValue))
            return Conflict(new { message = $"Cet ordre de travail est '{ot.Statut}'. Il ne peut plus être modifié." });

        if (dto.Statut == StatutOrdreTravail.ANNULE)
        {
            if (string.IsNullOrWhiteSpace(dto.MotifAnnulation))
                return BadRequest(new { message = "Le motif d'annulation est obligatoire." });
            ot.MotifAnnulation = dto.MotifAnnulation;
        }

        if (dto.Statut == StatutOrdreTravail.EN_COURS && ot.ValideParId == null)
            return Conflict(new { message = "Cet OT doit être validé avant de passer en exécution." });

        if (dto.Statut.HasValue && dto.Statut.Value != ot.Statut)
        {
            context.HistoriqueStatutsOT.Add(new HistoriqueStatutOT {
                OrdreTravailId = id, AncienStatut = ot.Statut.ToString(),
                NouveauStatut  = dto.Statut.Value.ToString(),
                Commentaire    = dto.Statut == StatutOrdreTravail.ANNULE ? dto.MotifAnnulation : null,
                UtilisateurId  = GetUserId(), DateChangement = DateTime.UtcNow
            });
        }

        if (dto.Description != null)  ot.Description  = dto.Description;
        if (dto.Observations != null) ot.Observations = dto.Observations;
        if (dto.TechnicienId.HasValue) ot.TechnicienId = dto.TechnicienId;
        if (dto.DateDebut.HasValue)   ot.DateDebut    = dto.DateDebut;
        if (dto.DateFin.HasValue)     ot.DateFin      = dto.DateFin;
        if (dto.CoutReel.HasValue)    ot.CoutReel     = dto.CoutReel;
        if (dto.Statut.HasValue)      ot.Statut       = dto.Statut.Value;
        if (dto.Priorite.HasValue)    ot.Priorite     = dto.Priorite.Value;

        await context.SaveChangesAsync();
        return Ok(new { message = "Ordre de travail mis à jour" });
    }

    [HttpPatch("{id:long}/valider")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Valider(long id)
    {
        var ot = await context.OrdresTravail.FindAsync(id);
        if (ot == null) return NotFound(new { message = $"Ordre de travail {id} introuvable" });
        if (ot.ValideParId != null) return Conflict(new { message = "Cet OT est déjà validé." });

        var userId = GetUserId();
        ot.ValideParId    = userId;
        ot.DateValidation = DateTime.UtcNow;
        context.HistoriqueStatutsOT.Add(new HistoriqueStatutOT {
            OrdreTravailId = id, AncienStatut = ot.Statut.ToString(), NouveauStatut = ot.Statut.ToString(),
            Commentaire = "OT validé pour exécution", UtilisateurId = userId, DateChangement = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
        return Ok(new { message = "Ordre de travail validé", dateValidation = ot.DateValidation });
    }

    [HttpGet("{id:long}/historique")]
    public async Task<IActionResult> GetHistorique(long id)
    {
        var historique = await context.HistoriqueStatutsOT
            .Where(h => h.OrdreTravailId == id)
            .OrderByDescending(h => h.DateChangement)
            .Select(h => new {
                h.Id, h.AncienStatut, h.NouveauStatut, h.Commentaire,
                Utilisateur   = (string?)null,
                h.UtilisateurId,
                h.DateChangement
            })
            .ToListAsync();
        return Ok(historique);
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(long id)
    {
        var ot = await context.OrdresTravail.FindAsync(id);
        if (ot == null) return NotFound(new { message = $"Ordre de travail {id} introuvable" });
        context.OrdresTravail.Remove(ot);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private long GetUserId() =>
        long.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;
}

public class CreateOrdreTravailRequest
{
    public string?              Reference    { get; set; }
    public string?              Description  { get; set; }
    public string?              Observations { get; set; }
    public long                 VehiculeId   { get; set; }
    public long?                TechnicienId { get; set; }
    public DateTime?            DateDebut    { get; set; }
    public DateTime?            DateFin      { get; set; }
    public PrioriteOrdreTravail Priorite     { get; set; } = PrioriteOrdreTravail.MOYENNE;
}

public class UpdateOrdreTravailRequest
{
    public string?              Description      { get; set; }
    public string?              Observations     { get; set; }
    public long?                TechnicienId     { get; set; }
    public DateTime?            DateDebut        { get; set; }
    public DateTime?            DateFin          { get; set; }
    public double?              CoutReel         { get; set; }
    public StatutOrdreTravail?  Statut           { get; set; }
    public PrioriteOrdreTravail? Priorite        { get; set; }
    public string?              MotifAnnulation  { get; set; }
}
