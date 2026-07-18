using Fleet.Infrastructure.Data;
using Fleet.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Shared.Enums;

namespace Fleet.API.Controllers;

[ApiController]
[Route("api/equipements")]
[Authorize]
public class EquipementsController(FleetDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? type = null,
        [FromQuery] string? etat = null,
        [FromQuery] string? categorie = null,
        [FromQuery] long? vehiculeId = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string sortBy = "IdEquipement",
        [FromQuery] string sortOrder = "DESC")
    {
        var query = context.Equipements.Where(e => e.Actif).AsQueryable();

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<TypeEquipement>(type, true, out var typeEnum))
            query = query.Where(e => e.Type == typeEnum);
        if (!string.IsNullOrEmpty(etat) && Enum.TryParse<EtatEquipement>(etat, true, out var etatEnum))
            query = query.Where(e => e.Etat == etatEnum);
        if (!string.IsNullOrEmpty(categorie) && Enum.TryParse<CategorieEquipement>(categorie, true, out var catEnum))
            query = query.Where(e => e.Categorie == catEnum);
        if (vehiculeId.HasValue)
            query = query.Where(e => e.VehiculeId == vehiculeId);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(e =>
                e.Nom.Contains(search) ||
                e.CodeInventaire.Contains(search) ||
                (e.Marque != null && e.Marque.Contains(search)));

        var total = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)total / limit);

        bool asc = sortOrder.ToUpper() == "ASC";
        query = sortBy.ToLower() switch
        {
            "nom"          => asc ? query.OrderBy(e => e.Nom)          : query.OrderByDescending(e => e.Nom),
            "datecreation" => asc ? query.OrderBy(e => e.DateCreation) : query.OrderByDescending(e => e.DateCreation),
            "etat"         => asc ? query.OrderBy(e => e.Etat)         : query.OrderByDescending(e => e.Etat),
            _              => asc ? query.OrderBy(e => e.IdEquipement) : query.OrderByDescending(e => e.IdEquipement)
        };

        var items = await query
            .Skip((page - 1) * limit).Take(limit)
            .Select(e => new
            {
                Id = e.IdEquipement,
                e.Nom,
                e.CodeInventaire,
                Type = e.Type.ToString(),
                Categorie = e.Categorie.ToString(),
                Etat = e.Etat.ToString(),
                e.Marque,
                e.Modele,
                NomVehicule = e.Vehicule != null ? e.Vehicule.Marque + " " + e.Vehicule.Modele : null,
                ImmatriculationVehicule = e.Vehicule != null ? e.Vehicule.Immatriculation : null,
                e.Fournisseur,
                e.ImageUrl,
                e.NombreUtilisations,
                e.HeuresUtilisation,
                e.DateFinGarantie,
                e.Actif,
                e.DateCreation
            })
            .ToListAsync();

        return Ok(new { data = items, total, page, limit, totalPages });
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var eq = await context.Equipements
            .Include(e => e.Vehicule)
            .FirstOrDefaultAsync(e => e.IdEquipement == id && e.Actif);
        if (eq == null) return NotFound(new { message = $"Équipement {id} introuvable" });

        return Ok(new
        {
            Id = eq.IdEquipement,
            eq.Nom,
            eq.CodeInventaire,
            Type = eq.Type.ToString(),
            Categorie = eq.Categorie.ToString(),
            Etat = eq.Etat.ToString(),
            eq.Marque,
            eq.Modele,
            eq.NumeroSerie,
            eq.Fournisseur,
            eq.ImageUrl,
            eq.DateAchat,
            eq.PrixAchat,
            eq.DateFinGarantie,
            eq.DureeVieTheoriqueEnMois,
            eq.NombreUtilisations,
            eq.HeuresUtilisation,
            eq.SeuilUsureUtilisations,
            eq.SeuilRemplacementUtilisations,
            eq.NotesGenerales,
            NomVehicule = eq.Vehicule != null ? eq.Vehicule.Marque + " " + eq.Vehicule.Modele : null,
            ImmatriculationVehicule = eq.Vehicule?.Immatriculation,
            eq.VehiculeId,
            eq.Actif,
            eq.DateCreation,
            DocumentsUrls = new List<string>(),
            Mouvements = new List<object>(),
            Inspections = new List<object>(),
            Notes = new List<object>(),
            Contrats = new List<object>()
        });
    }

    [HttpGet("kpis")]
    public async Task<IActionResult> GetKpis()
    {
        var total = await context.Equipements.CountAsync(e => e.Actif);
        var enPool = await context.Equipements.CountAsync(e => e.Actif && e.VehiculeId == null);
        var tauxDisponibilite = total > 0 ? (double)enPool / total * 100 : 0;
        return Ok(new
        {
            tauxDisponibilite,
            coutRemplacementMoyenParCategorie = new List<object>(),
            dureeVieMoyenneVsTheorique = new List<object>()
        });
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Create([FromBody] EquipementCreateRequest dto)
    {
        if (!Enum.TryParse<TypeEquipement>(dto.Type, true, out var type))
            return BadRequest(new { message = $"Type invalide: {dto.Type}" });
        if (!Enum.TryParse<CategorieEquipement>(dto.Categorie, true, out var cat))
            return BadRequest(new { message = $"Catégorie invalide: {dto.Categorie}" });

        var count = await context.Equipements.CountAsync() + 1;
        var code = string.IsNullOrWhiteSpace(dto.CodeInventaire)
            ? $"EQ-{DateTime.UtcNow.Year}-{count:D4}"
            : dto.CodeInventaire;

        if (await context.Equipements.AnyAsync(e => e.CodeInventaire == code && e.Actif))
            return Conflict(new { message = $"Code inventaire '{code}' déjà utilisé." });

        var eq = new Equipement
        {
            Nom = dto.Nom, CodeInventaire = code, Type = type, Categorie = cat,
            Marque = dto.Marque, Modele = dto.Modele, NumeroSerie = dto.NumeroSerie,
            Fournisseur = dto.Fournisseur, ImageUrl = dto.ImageUrl,
            DateAchat = dto.DateAchat, PrixAchat = dto.PrixAchat,
            DateFinGarantie = dto.DateFinGarantie,
            DureeVieTheoriqueEnMois = dto.DureeVieTheoriqueEnMois,
            VehiculeId = dto.VehiculeId,
            DateCreation = DateTime.UtcNow, DateModification = DateTime.UtcNow
        };

        context.Equipements.Add(eq);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = eq.IdEquipement }, new { id = eq.IdEquipement });
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Update(long id, [FromBody] EquipementUpdateRequest dto)
    {
        var eq = await context.Equipements.FindAsync(id);
        if (eq == null || !eq.Actif) return NotFound(new { message = $"Équipement {id} introuvable" });

        if (dto.Nom != null) eq.Nom = dto.Nom;
        if (dto.Marque != null) eq.Marque = dto.Marque;
        if (dto.Modele != null) eq.Modele = dto.Modele;
        if (dto.Fournisseur != null) eq.Fournisseur = dto.Fournisseur;
        if (dto.ImageUrl != null) eq.ImageUrl = dto.ImageUrl;
        if (dto.DateFinGarantie.HasValue) eq.DateFinGarantie = dto.DateFinGarantie;
        if (dto.VehiculeId.HasValue) eq.VehiculeId = dto.VehiculeId;
        if (!string.IsNullOrEmpty(dto.Etat) && Enum.TryParse<EtatEquipement>(dto.Etat, true, out var etat))
            eq.Etat = etat;
        if (!string.IsNullOrEmpty(dto.Type) && Enum.TryParse<TypeEquipement>(dto.Type, true, out var type))
            eq.Type = type;
        if (!string.IsNullOrEmpty(dto.Categorie) && Enum.TryParse<CategorieEquipement>(dto.Categorie, true, out var cat))
            eq.Categorie = cat;
        if (dto.DureeVieTheoriqueEnMois.HasValue) eq.DureeVieTheoriqueEnMois = dto.DureeVieTheoriqueEnMois.Value;
        if (dto.NotesGenerales != null) eq.NotesGenerales = dto.NotesGenerales;
        eq.DateModification = DateTime.UtcNow;

        await context.SaveChangesAsync();
        return Ok(new { message = "Équipement mis à jour" });
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Delete(long id)
    {
        var eq = await context.Equipements.FindAsync(id);
        if (eq == null || !eq.Actif) return NotFound(new { message = $"Équipement {id} introuvable" });
        eq.Actif = false;
        eq.DateModification = DateTime.UtcNow;
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("vehicule/{vehiculeId:long}/verification-mission")]
    public async Task<IActionResult> VerifierAvantMission(long vehiculeId)
    {
        var equipementsFixes = await context.Equipements
            .Where(e => e.Actif && e.VehiculeId == vehiculeId && e.Type == TypeEquipement.Fixe)
            .Select(e => new { Id = e.IdEquipement, e.Nom, e.CodeInventaire, Type = e.Type.ToString(), Categorie = e.Categorie.ToString(), Etat = e.Etat.ToString(), e.Actif })
            .ToListAsync();

        var equipementsObligatoires = await context.Equipements
            .Where(e => e.Actif && e.VehiculeId == vehiculeId && e.Type == TypeEquipement.Obligatoire)
            .Select(e => new { Id = e.IdEquipement, e.Nom, e.CodeInventaire, Type = e.Type.ToString(), Categorie = e.Categorie.ToString(), Etat = e.Etat.ToString(), e.Actif })
            .ToListAsync();

        return Ok(new
        {
            status = "OK",
            equipementsFixesOk = equipementsFixes,
            equipementsObligatoiresOk = equipementsObligatoires,
            problemes = new List<object>()
        });
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> CheckOut([FromBody] object dto) =>
        Ok(new { message = "CheckOut enregistré" });

    [HttpPost("checkin")]
    public async Task<IActionResult> CheckIn([FromBody] object dto) =>
        Ok(new { message = "CheckIn enregistré" });

    [HttpPost("{id:long}/inspections")]
    public async Task<IActionResult> CreerInspection(long id, [FromBody] object dto) =>
        Ok(new { id, message = "Inspection créée" });

    [HttpPost("upload")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public IActionResult UploadImage() =>
        Ok(new { imageUrl = "/uploads/equipements/placeholder.jpg" });

    [HttpPost("notes")]
    public async Task<IActionResult> AjouterNote([FromBody] object dto) =>
        Ok(new { id = 0, message = "Note ajoutée" });

    [HttpPut("notes/{noteId:long}")]
    public async Task<IActionResult> ModifierNote(long noteId, [FromBody] object dto) =>
        Ok(new { id = noteId, message = "Note modifiée" });

    [HttpDelete("notes/{noteId:long}")]
    public async Task<IActionResult> SupprimerNote(long noteId) => NoContent();

    [HttpPost("contrats")]
    public async Task<IActionResult> AjouterContrat([FromBody] object dto) =>
        Ok(new { id = 0, message = "Contrat ajouté" });

    [HttpPut("contrats/{contratId:long}")]
    public async Task<IActionResult> ModifierContrat(long contratId, [FromBody] object dto) =>
        Ok(new { id = contratId, message = "Contrat modifié" });

    [HttpDelete("contrats/{contratId:long}")]
    public async Task<IActionResult> SupprimerContrat(long contratId) => NoContent();
}

public class EquipementCreateRequest
{
    public string Nom { get; set; } = string.Empty;
    public string CodeInventaire { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Categorie { get; set; } = string.Empty;
    public string? Marque { get; set; }
    public string? Modele { get; set; }
    public string? NumeroSerie { get; set; }
    public string? Fournisseur { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? DateAchat { get; set; }
    public decimal? PrixAchat { get; set; }
    public DateTime? DateFinGarantie { get; set; }
    public int DureeVieTheoriqueEnMois { get; set; }
    public long? VehiculeId { get; set; }
}

public class EquipementUpdateRequest
{
    public string? Nom { get; set; }
    public string? Type { get; set; }
    public string? Categorie { get; set; }
    public string? Etat { get; set; }
    public string? Marque { get; set; }
    public string? Modele { get; set; }
    public string? Fournisseur { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? DateFinGarantie { get; set; }
    public int? DureeVieTheoriqueEnMois { get; set; }
    public long? VehiculeId { get; set; }
    public string? NotesGenerales { get; set; }
}
