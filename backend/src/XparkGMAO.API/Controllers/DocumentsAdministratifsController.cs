using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.API.Controllers;

[ApiController]
[Route("api/documents-administratifs")]
[Authorize]
public class DocumentsAdministratifsController : ControllerBase
{
    private readonly XparkDbContext _context;
    private readonly string _uploadDirectory = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "documents");

    public DocumentsAdministratifsController(XparkDbContext context)
    {
        _context = context;
        if (!Directory.Exists(_uploadDirectory))
        {
            Directory.CreateDirectory(_uploadDirectory);
        }
    }

    [HttpGet("vehicule/{vehiculeId}")]
    public async Task<IActionResult> GetByVehiculeId(long vehiculeId)
    {
        var documents = await _context.DocumentsAdministratifs
            .Where(d => d.VehiculeId == vehiculeId)
            .OrderByDescending(d => d.DateEmission)
            .ToListAsync();
        return Ok(documents);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] TypeDocument typeDocument, [FromForm] string numeroDocument, [FromForm] DateTime dateEmission, [FromForm] DateTime dateExpiration, [FromForm] long vehiculeId, [FromForm] string? observations, IFormFile? file)
    {
        var document = new DocumentAdministratif
        {
            TypeDocument = typeDocument,
            NumeroDocument = numeroDocument,
            DateEmission = dateEmission,
            DateExpiration = dateExpiration,
            VehiculeId = vehiculeId,
            Observations = observations,
            DateCreation = DateTime.UtcNow
        };

        if (file != null && file.Length > 0)
        {
            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(_uploadDirectory, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            document.FichierPath = $"/uploads/documents/{fileName}";
        }

        _context.DocumentsAdministratifs.Add(document);

        // --- BRIDGE LOGIC FOR ASSURANCES ---
        // If the user uploaded an Assurance via the generic document interface, mirror it to the Assurances table
        if (typeDocument == TypeDocument.ASSURANCE)
        {
            var assurance = new Assurance
            {
                Compagnie = "Non définie (Upload Web)", // Placeholder required by DB
                NumeroPolice = numeroDocument,
                DateDebut = dateEmission,
                DateFin = dateExpiration,
                Prime = 0, // Placeholder required by DB
                TypeAssurance = "TOUS_RISQUES", // Default value
                VehiculeId = vehiculeId,
                DateCreation = DateTime.UtcNow,
                Actif = true,
                Observations = observations
            };
            _context.Assurances.Add(assurance);
        }

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetByVehiculeId), new { vehiculeId = document.VehiculeId }, document);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        var document = await _context.DocumentsAdministratifs.FindAsync(id);
        if (document == null) return NotFound();

        // Delete physical file if it exists
        if (!string.IsNullOrEmpty(document.FichierPath))
        {
            var fileName = Path.GetFileName(document.FichierPath);
            var filePath = Path.Combine(_uploadDirectory, fileName);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }

        _context.DocumentsAdministratifs.Remove(document);

        // --- BRIDGE LOGIC FOR ASSURANCES ---
        if (document.TypeDocument == TypeDocument.ASSURANCE)
        {
            // Find the matching Assurance by NumeroPolice and VehiculeId
            var linkedAssurance = await _context.Assurances
                .FirstOrDefaultAsync(a => a.VehiculeId == document.VehiculeId && a.NumeroPolice == document.NumeroDocument);
            
            if (linkedAssurance != null)
            {
                _context.Assurances.Remove(linkedAssurance);
            }
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
