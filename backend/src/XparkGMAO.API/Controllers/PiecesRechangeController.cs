using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Core.Entities.GestionMaintenance;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PiecesRechangeController : ControllerBase
{
    private readonly XparkDbContext _context;
    private readonly ILogger<PiecesRechangeController> _logger;

    public PiecesRechangeController(XparkDbContext context, ILogger<PiecesRechangeController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>Obtenir toutes les pièces de rechange</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? categorie = null)
    {
        var query = _context.PiecesRechange.Where(p => p.Actif).AsQueryable();

        if (!string.IsNullOrEmpty(categorie) && Enum.TryParse<CategoriePiece>(categorie, true, out var cat))
            query = query.Where(p => p.Categorie == cat);

        var total = await query.CountAsync();
        var pieces = await query
            .OrderBy(p => p.Designation)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new {
                p.IdPiece, p.Reference, p.Designation,
                Categorie = p.Categorie.ToString(),
                p.StockActuel, p.StockMinimum, p.StockMaximum,
                p.PrixUnitaire, p.Fournisseur, p.Emplacement, p.ImageUrl,
                EstEnRupture = p.StockActuel <= p.StockMinimum,
                p.DateCreation, p.DateDernierApprovisionnement
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, items = pieces });
    }

    /// <summary>Obtenir une pièce par ID</summary>
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var piece = await _context.PiecesRechange.FindAsync(id);
        if (piece == null) return NotFound(new { message = $"Pièce {id} introuvable" });
        return Ok(piece);
    }

    /// <summary>Obtenir les pièces en stock faible</summary>
    [HttpGet("stock-faible")]
    public async Task<IActionResult> GetStockFaible()
    {
        var pieces = await _context.PiecesRechange
            .Where(p => p.Actif && p.StockActuel <= p.StockMinimum)
            .OrderBy(p => p.StockActuel)
            .ToListAsync();
        return Ok(pieces);
    }

    /// <summary>Créer une nouvelle pièce de rechange</summary>
    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> Create([FromBody] CreatePieceRechangeDto dto)
    {
        if (!Enum.TryParse<CategoriePiece>(dto.Categorie, true, out var categorie))
            return BadRequest(new { message = $"Catégorie invalide: {dto.Categorie}" });

        // Vérification des doublons sur la référence
        var doublon = await _context.PiecesRechange
            .AnyAsync(p => p.Reference == dto.Reference && p.Actif);
        if (doublon)
            return Conflict(new { message = $"Une pièce avec la référence '{dto.Reference}' existe déjà." });

        if (dto.StockActuel > dto.StockMaximum)
            return BadRequest(new { message = $"Le stock actuel ({dto.StockActuel}) ne peut pas dépasser le stock maximum ({dto.StockMaximum})" });

        var piece = new PieceRechange
        {
            Reference = dto.Reference,
            Designation = dto.Designation,
            Categorie = categorie,
            StockActuel = dto.StockActuel,
            StockMinimum = dto.StockMinimum,
            StockMaximum = dto.StockMaximum,
            PrixUnitaire = dto.PrixUnitaire,
            Fournisseur = dto.Fournisseur,
            ImageUrl = dto.ImageUrl,
            Actif = true,
            DateCreation = DateTime.UtcNow
        };

        _context.PiecesRechange.Add(piece);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = piece.IdPiece }, piece);
    }

    /// <summary>Ajouter du stock à une pièce</summary>
    [HttpPost("{id:long}/stock")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> AjouterStock(long id, [FromBody] AjusterStockRequest req)
    {
        var piece = await _context.PiecesRechange.FindAsync(id);
        if (piece == null) return NotFound(new { message = $"Pièce {id} introuvable" });

        if (piece.StockActuel + req.Quantite > piece.StockMaximum)
            return BadRequest(new { message = $"Mouvement impossible : le stock total ({piece.StockActuel + req.Quantite}) dépasserait le maximum autorisé ({piece.StockMaximum})" });

        piece.StockActuel += req.Quantite;
        if (piece.StockActuel < 0) piece.StockActuel = 0;
        piece.DateDernierApprovisionnement = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Stock mis à jour: {piece.StockActuel} unités", stockActuel = piece.StockActuel });
    }

    /// <summary>Mettre à jour une pièce de rechange</summary>
    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdatePieceRechangeRequest dto)
    {
        var piece = await _context.PiecesRechange.FindAsync(id);
        if (piece == null) return NotFound(new { message = $"Pièce {id} introuvable" });

        if (dto.Designation != null) piece.Designation = dto.Designation;
        if (dto.StockMinimum.HasValue) piece.StockMinimum = dto.StockMinimum.Value;
        
        if (dto.StockMaximum.HasValue)
        {
            if (piece.StockActuel > dto.StockMaximum.Value)
                return BadRequest(new { message = $"Impossible de réduire le maximum à {dto.StockMaximum.Value} car le stock actuel est de {piece.StockActuel}" });
            piece.StockMaximum = dto.StockMaximum.Value;
        }

        if (dto.PrixUnitaire.HasValue) piece.PrixUnitaire = dto.PrixUnitaire.Value;
        if (dto.Fournisseur != null) piece.Fournisseur = dto.Fournisseur;
        if (dto.Emplacement != null) piece.Emplacement = dto.Emplacement;
        if (dto.ImageUrl != null) piece.ImageUrl = dto.ImageUrl;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Pièce mise à jour" });
    }

    /// <summary>Désactiver une pièce (soft delete)</summary>
    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Delete(long id)
    {
        var piece = await _context.PiecesRechange.FindAsync(id);
        if (piece == null) return NotFound(new { message = $"Pièce {id} introuvable" });

        piece.Actif = false;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Uploader une image pour une pièce</summary>
    [HttpPost("upload")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE,TECHNICIEN")]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Fichier vide" });

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
        var extension = Path.GetExtension(file.FileName).ToLower();
        if (!allowedExtensions.Contains(extension))
            return BadRequest(new { message = "Format d'image non supporté" });

        var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "pieces");
        if (!Directory.Exists(uploadsPath))
            Directory.CreateDirectory(uploadsPath);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var imageUrl = $"/uploads/pieces/{fileName}";
        return Ok(new { imageUrl });
    }
}

// DTOs locaux
public class AjusterStockRequest
{
    public int Quantite { get; set; } // Peut être négatif pour retirer du stock
}

public class UpdatePieceRechangeRequest
{
    public string? Designation { get; set; }
    public int? StockMinimum { get; set; }
    public int? StockMaximum { get; set; }
    public double? PrixUnitaire { get; set; }
    public string? Fournisseur { get; set; }
    public string? Emplacement { get; set; }
    public string? ImageUrl { get; set; }
}
