using Maintenance.API.Data;
using Maintenance.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Maintenance.API.Controllers;

[ApiController]
[Route("api/pieces-rechange")]
[Authorize]
public class PiecesRechangeController(MaintenanceDbContext context, ILogger<PiecesRechangeController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? categorie = null)
    {
        var query = context.PiecesRechange.Where(p => p.Actif).AsQueryable();
        if (!string.IsNullOrEmpty(categorie) && Enum.TryParse<CategoriePiece>(categorie, true, out var cat))
            query = query.Where(p => p.Categorie == cat);

        var total = await query.CountAsync();
        var pieces = await query
            .OrderBy(p => p.Designation)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new {
                p.IdPiece, p.Reference, p.Designation, Categorie = p.Categorie.ToString(),
                p.StockActuel, p.StockMinimum, p.StockMaximum, p.PrixUnitaire,
                p.Fournisseur, p.Emplacement, p.ImageUrl,
                EstEnRupture = p.StockActuel <= p.StockMinimum,
                p.DateCreation, p.DateDernierApprovisionnement
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, items = pieces });
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var piece = await context.PiecesRechange.FindAsync(id);
        if (piece == null) return NotFound(new { message = $"Pièce {id} introuvable" });
        return Ok(piece);
    }

    [HttpGet("stock-faible")]
    public async Task<IActionResult> GetStockFaible()
    {
        var pieces = await context.PiecesRechange
            .Where(p => p.Actif && p.StockActuel <= p.StockMinimum)
            .OrderBy(p => p.StockActuel)
            .ToListAsync();
        return Ok(pieces);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> Create([FromBody] CreatePieceRequest dto)
    {
        if (!Enum.TryParse<CategoriePiece>(dto.Categorie, true, out var categorie))
            return BadRequest(new { message = $"Catégorie invalide: {dto.Categorie}" });

        if (await context.PiecesRechange.AnyAsync(p => p.Reference == dto.Reference && p.Actif))
            return Conflict(new { message = $"Une pièce avec la référence '{dto.Reference}' existe déjà." });

        if (dto.StockActuel > dto.StockMaximum)
            return BadRequest(new { message = $"Le stock actuel ne peut pas dépasser le maximum ({dto.StockMaximum})" });

        var piece = new PieceRechange {
            Reference = dto.Reference, Designation = dto.Designation, Categorie = categorie,
            StockActuel = dto.StockActuel, StockMinimum = dto.StockMinimum, StockMaximum = dto.StockMaximum,
            PrixUnitaire = dto.PrixUnitaire, Fournisseur = dto.Fournisseur, ImageUrl = dto.ImageUrl,
            Actif = true, DateCreation = DateTime.UtcNow
        };

        context.PiecesRechange.Add(piece);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = piece.IdPiece }, piece);
    }

    [HttpPost("{id:long}/stock")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> AjouterStock(long id, [FromBody] AjusterStockRequest req)
    {
        var piece = await context.PiecesRechange.FindAsync(id);
        if (piece == null) return NotFound(new { message = $"Pièce {id} introuvable" });

        if (piece.StockActuel + req.Quantite > piece.StockMaximum)
            return BadRequest(new { message = $"Le stock total dépasserait le maximum ({piece.StockMaximum})" });

        piece.StockActuel = Math.Max(0, piece.StockActuel + req.Quantite);
        piece.DateDernierApprovisionnement = DateTime.UtcNow;
        await context.SaveChangesAsync();
        return Ok(new { message = $"Stock mis à jour", stockActuel = piece.StockActuel });
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdatePieceRequest dto)
    {
        var piece = await context.PiecesRechange.FindAsync(id);
        if (piece == null) return NotFound(new { message = $"Pièce {id} introuvable" });

        if (dto.Designation  != null) piece.Designation  = dto.Designation;
        if (dto.StockMinimum.HasValue) piece.StockMinimum = dto.StockMinimum.Value;
        if (dto.StockMaximum.HasValue)
        {
            if (piece.StockActuel > dto.StockMaximum.Value)
                return BadRequest(new { message = $"Impossible de réduire le maximum à {dto.StockMaximum.Value} (stock actuel: {piece.StockActuel})" });
            piece.StockMaximum = dto.StockMaximum.Value;
        }
        if (dto.PrixUnitaire.HasValue) piece.PrixUnitaire = dto.PrixUnitaire.Value;
        if (dto.Fournisseur  != null) piece.Fournisseur  = dto.Fournisseur;
        if (dto.Emplacement  != null) piece.Emplacement  = dto.Emplacement;
        if (dto.ImageUrl     != null) piece.ImageUrl     = dto.ImageUrl;

        await context.SaveChangesAsync();
        return Ok(new { message = "Pièce mise à jour" });
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Delete(long id)
    {
        var piece = await context.PiecesRechange.FindAsync(id);
        if (piece == null) return NotFound(new { message = $"Pièce {id} introuvable" });
        piece.Actif = false;
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("upload")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Fichier vide" });

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLower();
        if (!allowedExtensions.Contains(extension))
            return BadRequest(new { message = "Format d'image non supporté" });

        var uploadsPath = Path.Combine("/app/wwwroot/uploads/pieces");
        Directory.CreateDirectory(uploadsPath);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsPath, fileName);
        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return Ok(new { imageUrl = $"/uploads/pieces/{fileName}" });
    }
}

public class CreatePieceRequest
{
    public string Reference { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Categorie { get; set; } = string.Empty;
    public int StockActuel { get; set; }
    public int StockMinimum { get; set; }
    public int StockMaximum { get; set; }
    public double PrixUnitaire { get; set; }
    public string? Fournisseur { get; set; }
    public string? ImageUrl { get; set; }
}

public class AjusterStockRequest { public int Quantite { get; set; } }

public class UpdatePieceRequest
{
    public string? Designation { get; set; }
    public int? StockMinimum { get; set; }
    public int? StockMaximum { get; set; }
    public double? PrixUnitaire { get; set; }
    public string? Fournisseur { get; set; }
    public string? Emplacement { get; set; }
    public string? ImageUrl { get; set; }
}
