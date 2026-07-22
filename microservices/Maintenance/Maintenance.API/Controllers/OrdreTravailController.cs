using Maintenance.Infrastructure.Data;
using Maintenance.Domain.Entities;
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

    [HttpGet("kanban")]
    public async Task<IActionResult> GetKanban()
    {
        var items = await context.OrdresTravail
            .Include(ot => ot.Interventions)
            .OrderBy(ot => ot.Priorite).ThenByDescending(ot => ot.DateCreation)
            .ToListAsync();

        // Compteurs réels (2 requêtes agrégées, pas de N+1) : le kanban et la page
        // de détail doivent montrer les mêmes chiffres.
        var nbPiecesJointes = await context.Attachments
            .GroupBy(a => a.OrdreId)
            .Select(g => new { OrdreId = g.Key, Nb = g.Count() })
            .ToDictionaryAsync(x => x.OrdreId, x => x.Nb);

        var nbCommentaires = await context.Commentaires
            .GroupBy(c => c.OrdreId)
            .Select(g => new { OrdreId = g.Key, Nb = g.Count() })
            .ToDictionaryAsync(x => x.OrdreId, x => x.Nb);

        // OT ayant au moins une pièce détachée consommée (via ses interventions).
        var otAvecPieces = (await context.InterventionPieces
            .Where(ip => ip.Intervention!.OrdreTravailId != null)
            .Select(ip => ip.Intervention!.OrdreTravailId!.Value)
            .Distinct()
            .ToListAsync()).ToHashSet();

        var result = new Dictionary<string, object>();
        foreach (var col in new[] { "PLANIFIE", "EN_COURS", "TERMINE", "ANNULE" })
            result[col] = new List<object>();

        foreach (var g in items.GroupBy(ot => ot.Statut.ToString()))
        {
            result[g.Key] = g.Select(ot => (object)new {
                id               = ot.IdOrdreTravail.ToString(),
                type             = "OT",
                reference        = ot.Reference,
                titre            = ot.Description ?? ot.Reference,
                description      = ot.Observations,
                priorite         = ot.Priorite.ToString(),
                statut           = ot.Statut.ToString(),
                dateCreation     = ot.DateCreation,
                dateEcheance     = ot.DateFin,
                technicienId     = ot.TechnicienId,
                vehiculeId       = ot.VehiculeId,
                hasAttachments   = nbPiecesJointes.GetValueOrDefault(ot.IdOrdreTravail) > 0,
                commentsCount    = nbCommentaires.GetValueOrDefault(ot.IdOrdreTravail),
                hasSpareParts    = otAvecPieces.Contains(ot.IdOrdreTravail),
                tags             = ot.Interventions.Select(i => i.TypeIntervention.ToString())
                                     .Distinct().ToArray()
            }).ToList();
        }

        return Ok(result);
    }

    [HttpGet("kanban/metadata")]
    public async Task<IActionResult> GetKanbanMetadata()
    {
        var vehiculeIds = await context.OrdresTravail
            .Where(ot => ot.VehiculeId != 0)
            .Select(ot => ot.VehiculeId)
            .Distinct().ToListAsync();

        var technicienIds = await context.OrdresTravail
            .Where(ot => ot.TechnicienId.HasValue)
            .Select(ot => ot.TechnicienId!.Value)
            .Distinct().ToListAsync();

        // Query the shared DB for vehicle immatriculations
        var vehicules = new List<object>();
        if (vehiculeIds.Any())
        {
            var idList = string.Join(",", vehiculeIds);
            var rows = await context.Database
                .SqlQueryRaw<VehiculeMetaRow>($"SELECT \"IdVehicule\" as id, \"Immatriculation\" as immatriculation FROM \"Vehicules\" WHERE \"IdVehicule\" IN ({idList})")
                .ToListAsync();
            vehicules = rows.Select(r => (object)new {
                idVehicule = r.Id,
                affichage  = r.Immatriculation ?? r.Id.ToString()
            }).ToList();
        }

        // Query the shared DB for technician names
        var techniciens = new List<object>();
        if (technicienIds.Any())
        {
            var idList = string.Join(",", technicienIds);
            var rows = await context.Database
                .SqlQueryRaw<TechnicienMetaRow>($"SELECT \"IdUtilisateur\" as id, \"Nom\" as nom, \"Prenom\" as prenom FROM \"Utilisateurs\" WHERE \"IdUtilisateur\" IN ({idList})")
                .ToListAsync();
            techniciens = rows.Select(r => (object)new {
                idUtilisateur = r.Id,
                nomComplet    = $"{r.Prenom} {r.Nom}".Trim()
            }).ToList();
        }

        return Ok(new { vehicules, techniciens });
    }

    [HttpPut("{id:long}/statut")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> UpdateStatut(long id, [FromBody] UpdateStatutRequest dto)
    {
        var ot = await context.OrdresTravail.FindAsync(id);
        if (ot == null) return NotFound(new { message = $"Ordre de travail {id} introuvable" });

        if (!Enum.TryParse<StatutOrdreTravail>(dto.Statut, true, out var newStatut))
            return BadRequest(new { message = $"Statut invalide: {dto.Statut}" });

        context.HistoriqueStatutsOT.Add(new HistoriqueStatutOT {
            OrdreTravailId = id, AncienStatut = ot.Statut.ToString(),
            NouveauStatut  = newStatut.ToString(), UtilisateurId = GetUserId(),
            DateChangement = DateTime.UtcNow
        });
        ot.Statut = newStatut;
        await context.SaveChangesAsync();
        return Ok(new { message = "Statut mis à jour" });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Page « Détails de la tâche » (/tasks/view-details)
    // Les entités Attachment et Commentaire ainsi que leurs tables existaient
    // déjà ; seule la couche API manquait, d'où une page systématiquement en
    // « Ordre de travail introuvable ».
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>Vue complète d'un OT : entête + pièces jointes + commentaires.</summary>
    [HttpGet("{id:long}/detail")]
    public async Task<IActionResult> GetDetail(long id)
    {
        var ot = await context.OrdresTravail
            .Include(o => o.Interventions)
            .FirstOrDefaultAsync(o => o.IdOrdreTravail == id);
        if (ot == null) return NotFound(new { message = $"Ordre de travail {id} introuvable" });

        var attachments = await context.Attachments
            .Where(a => a.OrdreId == id)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new { a.Id, a.Nom, a.Url, a.Taille, a.Type, a.CreatedAt })
            .ToListAsync();

        var commentaires = await context.Commentaires
            .Where(c => c.OrdreId == id)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new { c.Id, c.Contenu, c.AuteurId, c.CreatedAt })
            .ToListAsync();

        // Enrichissement des noms : même approche que kanban/metadata — Maintenance
        // ne projette volontairement pas Vehicule/Utilisateur (voir les stubs du
        // Domain : « use FK only »), on lit donc la base partagée en SQL brut.
        var auteurs = await ResoudreNomsUtilisateurs(
            commentaires.Select(c => c.AuteurId)
                        .Concat(ot.TechnicienId.HasValue ? [ot.TechnicienId.Value] : [])
                        .Distinct().ToList());

        var immatriculation = (await ResoudreImmatriculations([ot.VehiculeId]))
            .GetValueOrDefault(ot.VehiculeId);

        return Ok(new {
            id           = ot.IdOrdreTravail,
            titre        = string.IsNullOrWhiteSpace(ot.Reference) ? ot.Description : ot.Reference,
            description  = string.IsNullOrWhiteSpace(ot.Description) ? ot.Observations : ot.Description,
            priorite     = ot.Priorite.ToString(),
            statut       = ot.Statut.ToString(),
            dateCreation = ot.DateCreation,
            dateEcheance = ot.DateFin,
            technicien   = ot.TechnicienId.HasValue
                             ? auteurs.GetValueOrDefault(ot.TechnicienId.Value)
                             : null,
            equipement   = immatriculation,
            // Pas de colonne « tags » en base : on expose une information réelle
            // et utile — les types d'intervention rattachés à cet OT.
            tags         = ot.Interventions.Select(i => i.TypeIntervention.ToString())
                             .Distinct().ToArray(),
            attachments  = attachments.Select(a => new {
                             a.Id, a.Nom, a.Url, a.Taille, a.Type, a.CreatedAt }),
            commentaires = commentaires.Select(c => new {
                             c.Id, c.Contenu,
                             auteur = auteurs.GetValueOrDefault(c.AuteurId) ?? $"Utilisateur #{c.AuteurId}",
                             c.CreatedAt }),
        });
    }

    /// <summary>Ajoute un commentaire à l'OT (auteur = utilisateur authentifié).</summary>
    [HttpPost("{id:long}/commentaires")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> AddCommentaire(long id, [FromBody] AddCommentaireRequest dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Contenu))
            return BadRequest(new { message = "Le commentaire ne peut pas être vide." });

        if (!await context.OrdresTravail.AnyAsync(o => o.IdOrdreTravail == id))
            return NotFound(new { message = $"Ordre de travail {id} introuvable" });

        var auteurId = GetUserId();
        var commentaire = new Commentaire {
            OrdreId   = id,
            Contenu   = dto.Contenu.Trim(),
            AuteurId  = auteurId,
            CreatedAt = DateTime.UtcNow,
        };
        context.Commentaires.Add(commentaire);
        await context.SaveChangesAsync();

        var noms = await ResoudreNomsUtilisateurs([auteurId]);
        return Ok(new {
            id        = commentaire.Id,
            contenu   = commentaire.Contenu,
            auteur    = noms.GetValueOrDefault(auteurId) ?? $"Utilisateur #{auteurId}",
            createdAt = commentaire.CreatedAt,
        });
    }

    /// <summary>Téléverse une pièce jointe (volume partagé ./data/uploads).</summary>
    [HttpPost("{id:long}/attachments")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> UploadAttachment(long id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Fichier vide" });

        const long tailleMax = 20 * 1024 * 1024; // 20 Mo
        if (file.Length > tailleMax)
            return BadRequest(new { message = "Fichier trop volumineux (max 20 Mo)" });

        var extensionsAutorisees = new[] {
            ".jpg", ".jpeg", ".png", ".gif", ".webp",
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!extensionsAutorisees.Contains(extension))
            return BadRequest(new { message = $"Format non supporté : {extension}" });

        if (!await context.OrdresTravail.AnyAsync(o => o.IdOrdreTravail == id))
            return NotFound(new { message = $"Ordre de travail {id} introuvable" });

        var uploadsPath = Path.Combine("/app/wwwroot/uploads/ordres-travail");
        Directory.CreateDirectory(uploadsPath);

        var fileName = $"{Guid.NewGuid()}{extension}";
        await using (var stream = new FileStream(Path.Combine(uploadsPath, fileName), FileMode.Create))
            await file.CopyToAsync(stream);

        var attachment = new Attachment {
            OrdreId   = id,
            Nom       = Path.GetFileName(file.FileName),
            Url       = $"/uploads/ordres-travail/{fileName}",
            Taille    = file.Length,
            Type      = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            CreatedAt = DateTime.UtcNow,
        };
        context.Attachments.Add(attachment);
        await context.SaveChangesAsync();

        return Ok(new {
            id = attachment.Id, nom = attachment.Nom, url = attachment.Url,
            taille = attachment.Taille, type = attachment.Type, createdAt = attachment.CreatedAt,
        });
    }

    // ── Helpers de résolution cross-service (base partagée, lecture seule) ────
    private async Task<Dictionary<long, string>> ResoudreNomsUtilisateurs(List<long> ids)
    {
        var valides = ids.Where(i => i > 0).Distinct().ToList();
        if (valides.Count == 0) return [];

        var rows = await context.Database
            .SqlQueryRaw<TechnicienMetaRow>(
                $"SELECT \"IdUtilisateur\" as id, \"Nom\" as nom, \"Prenom\" as prenom " +
                $"FROM \"Utilisateurs\" WHERE \"IdUtilisateur\" IN ({string.Join(",", valides)})")
            .ToListAsync();

        return rows.ToDictionary(r => r.Id, r => $"{r.Prenom} {r.Nom}".Trim());
    }

    private async Task<Dictionary<long, string>> ResoudreImmatriculations(List<long> ids)
    {
        var valides = ids.Where(i => i > 0).Distinct().ToList();
        if (valides.Count == 0) return [];

        var rows = await context.Database
            .SqlQueryRaw<VehiculeMetaRow>(
                $"SELECT \"IdVehicule\" as id, \"Immatriculation\" as immatriculation " +
                $"FROM \"Vehicules\" WHERE \"IdVehicule\" IN ({string.Join(",", valides)})")
            .ToListAsync();

        return rows.Where(r => r.Immatriculation != null)
                   .ToDictionary(r => r.Id, r => r.Immatriculation!);
    }

    private long GetUserId() =>
        long.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;
}

public class AddCommentaireRequest
{
    public string Contenu { get; set; } = string.Empty;
}

// Raw SQL projection types for cross-service reads from the shared DB
public class VehiculeMetaRow   { public long Id { get; set; } public string? Immatriculation { get; set; } }
public class TechnicienMetaRow { public long Id { get; set; } public string? Nom { get; set; }  public string? Prenom { get; set; } }

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
