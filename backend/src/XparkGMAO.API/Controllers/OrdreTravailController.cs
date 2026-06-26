using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.GestionMaintenance;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Infrastructure.Data;
using Microsoft.AspNetCore.SignalR;
using XparkGMAO.API.Hubs;
using System.Security.Claims;
using XparkGMAO.Core.Entities.Security;
using XparkGMAO.Core.Entities.GestionOperations;
using XparkGMAO.Core.Entities.GestionAdministrative;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/ordres-travail")]
[Authorize]
public class OrdreTravailController : ControllerBase
{
    private readonly XparkDbContext _context;
    private readonly ILogger<OrdreTravailController> _logger;
    private readonly IHubContext<KanbanHub> _hubContext;

    public OrdreTravailController(XparkDbContext context, ILogger<OrdreTravailController> logger, IHubContext<KanbanHub> hubContext)
    {
        _context = context;
        _logger = logger;
        _hubContext = hubContext;
    }

    /// <summary>Obtenir tous les ordres de travail</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? statut = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.OrdresTravail
            .Include(ot => ot.Vehicule)
            .Include(ot => ot.Technicien)
            .Include(ot => ot.Interventions)
            .AsQueryable();

        if (!string.IsNullOrEmpty(statut) && Enum.TryParse<StatutOrdreTravail>(statut, true, out var s))
            query = query.Where(ot => ot.Statut == s);

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(ot => ot.Priorite) // CRITIQUE=0, HAUTE=1, MOYENNE=2, BASSE=3
            .ThenByDescending(ot => ot.DateCreation)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ot => new
            {
                ot.IdOrdreTravail,
                ot.Reference,
                ot.DateCreation,
                ot.DateDebut,
                ot.DateFin,
                ot.Description,
                Statut = ot.Statut.ToString(),
                ot.CoutReel,
                ot.VehiculeId,
                VehiculeImmatriculation = ot.Vehicule.Immatriculation,
                VehiculeMarque = ot.Vehicule.Marque,
                VehiculeModele = ot.Vehicule.Modele,
                ot.TechnicienId,
                TechnicienNom = ot.Technicien != null ? ot.Technicien.Nom : null,
                TechnicienPrenom = ot.Technicien != null ? ot.Technicien.Prenom : null,
                NombreInterventions = ot.Interventions.Count,
                Priorite = ot.Priorite.ToString()
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>Obtenir un ordre de travail par ID</summary>
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var ot = await _context.OrdresTravail
            .Include(o => o.Vehicule)
            .Include(o => o.Technicien)
            .Include(o => o.Interventions)
            .FirstOrDefaultAsync(o => o.IdOrdreTravail == id);

        if (ot == null) return NotFound(new { message = $"Ordre de travail {id} introuvable" });

        return Ok(new
        {
            ot.IdOrdreTravail,
            ot.Reference,
            ot.DateCreation,
            ot.DateDebut,
            ot.DateFin,
            ot.Description,
            ot.Observations,
            Statut = ot.Statut.ToString(),
            ot.CoutReel,
            ot.VehiculeId,
            VehiculeImmatriculation = ot.Vehicule.Immatriculation,
            VehiculeMarque = ot.Vehicule.Marque,
            VehiculeModele = ot.Vehicule.Modele,
            ot.TechnicienId,
            TechnicienNom = ot.Technicien?.Nom,
            TechnicienPrenom = ot.Technicien?.Prenom,
            NombreInterventions = ot.Interventions.Count,
            CoutEstime = ot.Interventions.Sum(i => i.Cout),
            Priorite = ot.Priorite.ToString()
        });
    }

    /// <summary>Créer un ordre de travail</summary>
    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Create([FromBody] CreateOrdreTravailRequest dto)
    {
        if (!await _context.Vehicules.AnyAsync(v => v.IdVehicule == dto.VehiculeId))
            return BadRequest(new { message = "Véhicule introuvable" });

        // Générer référence automatique si non fournie
        var reference = string.IsNullOrEmpty(dto.Reference)
            ? $"OT-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}"
            : dto.Reference;

        var ot = new OrdreTravail
        {
            Reference = reference,
            Description = dto.Description ?? string.Empty,
            Observations = dto.Observations,
            VehiculeId = dto.VehiculeId,
            TechnicienId = dto.TechnicienId,
            DateDebut = dto.DateDebut,
            DateFin = dto.DateFin,
            Statut = StatutOrdreTravail.PLANIFIE,
            Priorite = dto.Priorite,
            DateCreation = DateTime.UtcNow
        };

        _context.OrdresTravail.Add(ot);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Ordre de travail créé : {Reference}", ot.Reference);
        return CreatedAtAction(nameof(GetById), new { id = ot.IdOrdreTravail }, new { ot.IdOrdreTravail, ot.Reference });
    }
    /// <summary>Mettre à jour un ordre de travail</summary>
    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateOrdreTravailRequest dto)
    {
        var ot = await _context.OrdresTravail.FindAsync(id);
        if (ot == null) return NotFound(new { message = $"Ordre de travail {id} introuvable" });

        // Règle métier : un OT terminé ou annulé ne peut plus être modifié librement
        if (ot.Statut == StatutOrdreTravail.TERMINE || ot.Statut == StatutOrdreTravail.ANNULE)
        {
            var hasNonStatutChanges = dto.Description != null || dto.Observations != null
                || dto.TechnicienId.HasValue || dto.DateDebut.HasValue || dto.DateFin.HasValue
                || dto.CoutReel.HasValue || dto.Priorite.HasValue;

            if (hasNonStatutChanges)
                return Conflict(new { message = $"Cet ordre de travail est '{ot.Statut}'. Il ne peut plus être modifié." });
        }

        // Règle métier : annulation avec motif obligatoire
        if (dto.Statut == StatutOrdreTravail.ANNULE)
        {
            if (string.IsNullOrWhiteSpace(dto.MotifAnnulation))
                return BadRequest(new { message = "Le motif d'annulation est obligatoire." });
            ot.MotifAnnulation = dto.MotifAnnulation;
        }

        // Règle métier : validation obligatoire avant passage EN_COURS
        if (dto.Statut == StatutOrdreTravail.EN_COURS && ot.ValideParId == null)
        {
            return Conflict(new { message = "Cet OT doit être validé par un responsable avant de passer en exécution. Utilisez l'endpoint de validation." });
        }

        // Historique des changements de statut
        if (dto.Statut.HasValue && dto.Statut.Value != ot.Statut)
        {
            _context.HistoriqueStatutsOT.Add(new HistoriqueStatutOT
            {
                OrdreTravailId = id,
                AncienStatut = ot.Statut.ToString(),
                NouveauStatut = dto.Statut.Value.ToString(),
                Commentaire = dto.Statut == StatutOrdreTravail.ANNULE ? dto.MotifAnnulation : null,
                UtilisateurId = GetUserId(),
                DateChangement = DateTime.UtcNow
            });
        }

        if (dto.Description != null) ot.Description = dto.Description;
        if (dto.Observations != null) ot.Observations = dto.Observations;
        if (dto.TechnicienId.HasValue) ot.TechnicienId = dto.TechnicienId;
        if (dto.DateDebut.HasValue) ot.DateDebut = dto.DateDebut;
        if (dto.DateFin.HasValue) ot.DateFin = dto.DateFin;
        if (dto.CoutReel.HasValue) ot.CoutReel = dto.CoutReel;
        if (dto.Statut.HasValue) ot.Statut = dto.Statut.Value;
        if (dto.Priorite.HasValue) ot.Priorite = dto.Priorite.Value;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Ordre de travail mis à jour" });
    }

    /// <summary>Valider un OT avant exécution (ADMIN/GESTIONNAIRE uniquement)</summary>
    [HttpPatch("{id:long}/valider")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Valider(long id)
    {
        var ot = await _context.OrdresTravail.FindAsync(id);
        if (ot == null) return NotFound(new { message = $"Ordre de travail {id} introuvable" });

        if (ot.ValideParId != null)
            return Conflict(new { message = "Cet OT est déjà validé." });

        var userId = GetUserId();
        ot.ValideParId = userId;
        ot.DateValidation = DateTime.UtcNow;

        _context.HistoriqueStatutsOT.Add(new HistoriqueStatutOT
        {
            OrdreTravailId = id,
            AncienStatut = ot.Statut.ToString(),
            NouveauStatut = ot.Statut.ToString(),
            Commentaire = "OT validé pour exécution",
            UtilisateurId = userId,
            DateChangement = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Ordre de travail validé avec succès", dateValidation = ot.DateValidation });
    }

    /// <summary>Historique des changements de statut d'un OT</summary>
    [HttpGet("{id:long}/historique")]
    public async Task<IActionResult> GetHistorique(long id)
    {
        var historique = await _context.HistoriqueStatutsOT
            .Where(h => h.OrdreTravailId == id)
            .Include(h => h.Utilisateur)
            .OrderByDescending(h => h.DateChangement)
            .Select(h => new
            {
                h.Id,
                h.AncienStatut,
                h.NouveauStatut,
                h.Commentaire,
                Utilisateur = h.Utilisateur != null ? $"{h.Utilisateur.Prenom} {h.Utilisateur.Nom}" : null,
                h.DateChangement
            })
            .ToListAsync();

        return Ok(historique);
    }

    /// <summary>Supprimer un ordre de travail</summary>
    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(long id)
    {
        var ot = await _context.OrdresTravail.FindAsync(id);
        if (ot == null) return NotFound(new { message = $"Ordre de travail {id} introuvable" });

        _context.OrdresTravail.Remove(ot);
        await _context.SaveChangesAsync();
        
        await _hubContext.Clients.Group("KanbanBoard").SendAsync("CardDeleted", id.ToString());
        
        return NoContent();
    }

    // ── KANBAN DYNAMIQUE ────────────────────────────────────────

    [HttpGet("kanban/metadata")]
    public async Task<IActionResult> GetKanbanMetadata()
    {
        var techniciens = await _context.Utilisateurs
            .Where(u => u.Role == Role.TECHNICIEN && u.Statut == StatutUtilisateur.ACTIF)
            .Select(u => new { u.IdUtilisateur, NomComplet = $"{u.Prenom} {u.Nom}", u.Photo })
            .ToListAsync();

        var vehicules = await _context.Vehicules
            .Where(v => v.Actif)
            .Select(v => new { v.IdVehicule, Affichage = $"{v.Immatriculation} - {v.Marque} {v.Modele}" })
            .ToListAsync();

        return Ok(new { techniciens, vehicules });
    }

    [HttpGet("kanban")]
    public async Task<IActionResult> GetKanban()
    {
        var userId = GetUserId();
        var roles = User.FindAll(ClaimTypes.Role).Select(r => r.Value);
        var isAdminOrManager = roles.Contains("ADMIN") || roles.Contains("GESTIONNAIRE");

        // 1. Fetch OTs
        var otQuery = isAdminOrManager
            ? _context.OrdresTravail.AsQueryable()
            : _context.OrdresTravail.Where(o => o.TechnicienId == userId);

        var ordres = await otQuery
            .Include(o => o.Technicien)
            .Include(o => o.Vehicule)
            .Include(o => o.Attachments)
            .Include(o => o.Commentaires)
            .Include(o => o.Interventions)
                .ThenInclude(i => i.InterventionPieces)
            .OrderByDescending(o => o.DateCreation)
            .Select(o => new KanbanCardDto
            {
                Id = "OT_" + o.IdOrdreTravail,
                Type = "OT",
                Reference = o.Reference,
                Titre = o.Description.Length > 50 ? o.Description.Substring(0, 50) + "..." : o.Description,
                Description = o.Description,
                Priorite = o.Priorite.ToString(),
                Statut = o.Statut.ToString(),
                DateCreation = o.DateCreation,
                DateEcheance = o.DateFin,
                Technicien = o.Technicien != null ? $"{o.Technicien.Prenom} {o.Technicien.Nom}" : "Non assigné",
                TechnicienAvatar = o.Technicien != null ? o.Technicien.Photo : null,
                Equipement = o.Vehicule != null ? $"{o.Vehicule.Immatriculation} ({o.Vehicule.Marque})" : "N/A",
                HasAttachments = o.Attachments.Any(),
                CommentsCount = o.Commentaires.Count,
                HasSpareParts = o.Interventions.Any(i => i.InterventionPieces.Any()),
                Tags = new List<string> { "MAINTENANCE" }
            })
            .ToListAsync();

        // 2. Fetch Missions
        var missionQuery = isAdminOrManager
            ? _context.Missions.AsQueryable()
            : _context.Missions.Where(m => m.EmployeeId == userId);

        var missions = await missionQuery
            .Include(m => m.Employee)
            .Include(m => m.Vehicule)
            .OrderByDescending(m => m.DateCreation)
            .Select(m => new KanbanCardDto
            {
                Id = "MS_" + m.IdMission,
                Type = "MISSION",
                Reference = "MS-" + m.DateCreation.ToString("yyyyMMdd") + "-" + m.IdMission,
                Titre = m.ObjetMission + " (" + m.Destination + ")",
                Description = m.ObjetMission,
                Priorite = "NORMALE",
                Statut = m.Statut == StatutMission.EN_ATTENTE ? "PLANIFIE" :
                         m.Statut == StatutMission.EN_COURS ? "EN_COURS" :
                         m.Statut == StatutMission.TERMINEE ? "TERMINE" : "ANNULE",
                DateCreation = m.DateCreation,
                DateEcheance = m.DateRetour,
                Technicien = m.Employee != null ? $"{m.Employee.Prenom} {m.Employee.Name}" : "Non assigné",
                TechnicienAvatar = null,
                Equipement = m.Vehicule != null ? $"{m.Vehicule.Immatriculation} ({m.Vehicule.Marque})" : "N/A",
                HasAttachments = false,
                CommentsCount = 0,
                HasSpareParts = false,
                Tags = new List<string> { "LOGISTIQUE" }
            })
            .ToListAsync();

        // 3. Fetch Interventions
        var interventionQuery = isAdminOrManager
            ? _context.Interventions.AsQueryable()
            : _context.Interventions.Where(i => i.TechnicienId == userId);

        var interventions = await interventionQuery
            .Include(i => i.Vehicule)
            .Include(i => i.InterventionPieces)
            .OrderByDescending(i => i.DateCreation)
            .Select(i => new KanbanCardDto
            {
                Id = "IN_" + i.IdIntervention,
                Type = "INTERVENTION",
                Reference = "IV-" + i.DateCreation.ToString("yyyyMMdd") + "-" + i.IdIntervention,
                Titre = i.Description,
                Description = i.Observations,
                Priorite = "HAUTE", // Default for interventions
                Statut = i.Statut == StatutIntervention.PLANIFIEE ? "PLANIFIE" :
                         i.Statut == StatutIntervention.EN_ATTENTE ? "PLANIFIE" :
                         i.Statut == StatutIntervention.EN_COURS ? "EN_COURS" :
                         i.Statut == StatutIntervention.TERMINEE ? "TERMINE" : "ANNULE",
                DateCreation = i.DateCreation,
                DateEcheance = i.DateFinIntervention,
                Technicien = "Technicien", // Will be enriched if needed
                TechnicienAvatar = null,
                Equipement = i.Vehicule != null ? $"{i.Vehicule.Immatriculation}" : "N/A",
                HasAttachments = false,
                CommentsCount = 0,
                HasSpareParts = i.InterventionPieces.Any(),
                Tags = new List<string> { "INTERV" }
            })
            .ToListAsync();

        var allItems = ordres.Concat(missions).Concat(interventions).OrderByDescending(x => x.DateCreation).ToList();

        var kanban = new Dictionary<string, List<KanbanCardDto>>
        {
            ["PLANIFIE"] = allItems.Where(o => o.Statut == "PLANIFIE").ToList(),
            ["EN_COURS"] = allItems.Where(o => o.Statut == "EN_COURS").ToList(),
            ["TERMINE"] = allItems.Where(o => o.Statut == "TERMINE").ToList(),
            ["ANNULE"] = allItems.Where(o => o.Statut == "ANNULE").ToList(),
        };

        return Ok(kanban);
    }

    [HttpPut("{id}/statut")]
    public async Task<IActionResult> UpdateStatut(string id, [FromBody] UpdateStatutDto dto)
    {
        if (string.IsNullOrEmpty(id)) return BadRequest();

        if (id.StartsWith("OT_"))
        {
            var otId = long.Parse(id.Substring(3));
            var ordre = await _context.OrdresTravail.FindAsync(otId);
            if (ordre == null) return NotFound();

            if (!Enum.TryParse<StatutOrdreTravail>(dto.Statut, true, out var newStatut))
                return BadRequest("Statut OT invalide");

            ordre.Statut = newStatut;
            await _context.SaveChangesAsync();
        }
        else if (id.StartsWith("MS_"))
        {
            var msId = long.Parse(id.Substring(3));
            var mission = await _context.Missions.FindAsync(msId);
            if (mission == null) return NotFound();

            StatutMission newStatut = dto.Statut switch
            {
                "PLANIFIE" => StatutMission.EN_ATTENTE,
                "EN_COURS" => StatutMission.EN_COURS,
                "TERMINE" => StatutMission.TERMINEE,
                "ANNULE" => StatutMission.ANNULEE,
                _ => throw new ArgumentException("Statut Mission invalide")
            };

            mission.Statut = newStatut;
            await _context.SaveChangesAsync();
        }
        else if (id.StartsWith("IN_"))
        {
            var inId = long.Parse(id.Substring(3));
            var intervention = await _context.Interventions.FindAsync(inId);
            if (intervention == null) return NotFound();

            StatutIntervention newStatut = dto.Statut switch
            {
                "PLANIFIE" => StatutIntervention.PLANIFIEE,
                "EN_COURS" => StatutIntervention.EN_COURS,
                "TERMINE" => StatutIntervention.TERMINEE,
                "ANNULE" => StatutIntervention.ANNULEE,
                _ => throw new ArgumentException("Statut Intervention invalide")
            };

            intervention.Statut = newStatut;
            await _context.SaveChangesAsync();
        }

        // Notification SignalR
        await _hubContext.Clients.Group("KanbanBoard").SendAsync("CardMoved", new { id, statut = dto.Statut });

        return Ok(new { id, statut = dto.Statut });
    }

    [HttpDelete("kanban/clear/{statut}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> ClearSection(string statut)
    {
        if (!Enum.TryParse<StatutOrdreTravail>(statut, true, out var s))
            return BadRequest("Statut invalide");

        var query = _context.OrdresTravail.Where(o => o.Statut == s);
        
        var count = await query.CountAsync();
        _context.OrdresTravail.RemoveRange(query);
        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group("KanbanBoard").SendAsync("SectionCleared", statut);

        return Ok(new { message = $"{count} ordres de travail supprimés", statut });
    }

    // ── VIEW-DETAILS DYNAMIQUE ──────────────────────────────────

    [HttpGet("{id:long}/detail")]
    public async Task<IActionResult> GetDetail(long id)
    {
        var ordre = await _context.OrdresTravail
            .Include(o => o.Technicien)
            .Include(o => o.Vehicule)
            .Include(o => o.Attachments)
            .Include(o => o.Commentaires)
                .ThenInclude(c => c.Auteur)
            .FirstOrDefaultAsync(o => o.IdOrdreTravail == id);

        if (ordre == null) return NotFound();

        return Ok(new
        {
            Id = ordre.IdOrdreTravail,
            Titre = ordre.Reference,
            Description = ordre.Description,
            Priorite = ordre.Priorite.ToString(),
            Statut = ordre.Statut.ToString(),
            DateCreation = ordre.DateCreation,
            DateEcheance = ordre.DateFin,
            Technicien = ordre.Technicien != null ? $"{ordre.Technicien.Prenom} {ordre.Technicien.Nom}" : null,
            Equipement = ordre.Vehicule?.Immatriculation,
            Tags = new List<string> { ordre.Priorite.ToString() },
            Attachments = ordre.Attachments.Select(a => new {
                a.Id, a.Nom, a.Url, a.Taille, a.Type, a.CreatedAt
            }),
            Commentaires = ordre.Commentaires.OrderByDescending(c => c.CreatedAt).Select(c => new {
                c.Id, c.Contenu, Auteur = $"{c.Auteur.Prenom} {c.Auteur.Nom}", c.CreatedAt
            })
        });
    }

    [HttpPost("{id:long}/commentaires")]
    public async Task<IActionResult> AddCommentaire(long id, [FromBody] AddCommentaireDto dto)
    {
        var userId = GetUserId();
        var commentaire = new Commentaire
        {
            OrdreId = id,
            Contenu = dto.Contenu,
            AuteurId = userId,
            CreatedAt = DateTime.UtcNow
        };
        _context.Commentaires.Add(commentaire);
        await _context.SaveChangesAsync();

        await _context.Entry(commentaire).Reference(c => c.Auteur).LoadAsync();

        return Ok(new
        {
            Id = commentaire.Id,
            commentaire.Contenu,
            Auteur = $"{commentaire.Auteur.Prenom} {commentaire.Auteur.Nom}",
            commentaire.CreatedAt
        });
    }

    private long GetUserId() =>
        long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
}

public class KanbanCardDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = "OT"; // OT or MISSION
    public string Reference { get; set; } = string.Empty;
    public string Titre { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priorite { get; set; } = string.Empty;
    public string Statut { get; set; } = string.Empty;
    public DateTime DateCreation { get; set; }
    public DateTime? DateEcheance { get; set; }
    public string? Technicien { get; set; }
    public string? TechnicienAvatar { get; set; }
    public string? Equipement { get; set; }
    public bool HasAttachments { get; set; }
    public int CommentsCount { get; set; }
    public bool HasSpareParts { get; set; }
    public List<string> Tags { get; set; } = new();
}

public class UpdateStatutDto { public string Statut { get; set; } = string.Empty; }
public class AddCommentaireDto { public string Contenu { get; set; } = string.Empty; }

// DTOs locaux
public class CreateOrdreTravailRequest
{
    public string? Reference { get; set; }
    public string? Description { get; set; }
    public string? Observations { get; set; }
    public long VehiculeId { get; set; }
    public long? TechnicienId { get; set; }
    public DateTime? DateDebut { get; set; }
    public DateTime? DateFin { get; set; }
    public PrioriteOrdreTravail Priorite { get; set; } = PrioriteOrdreTravail.MOYENNE;
}

public class UpdateOrdreTravailRequest
{
    public string? Description { get; set; }
    public string? Observations { get; set; }
    public long? TechnicienId { get; set; }
    public DateTime? DateDebut { get; set; }
    public DateTime? DateFin { get; set; }
    public double? CoutReel { get; set; }
    public StatutOrdreTravail? Statut { get; set; }
    public PrioriteOrdreTravail? Priorite { get; set; }
    /// <summary>Obligatoire si Statut = ANNULE</summary>
    public string? MotifAnnulation { get; set; }
}
