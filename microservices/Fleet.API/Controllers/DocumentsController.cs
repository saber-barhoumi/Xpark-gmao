using Fleet.API.DTOs;
using Fleet.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleet.API.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentsController(IDocumentService service) : ControllerBase
{
    [HttpGet("vehicule/{vehiculeId:long}")]
    public async Task<IActionResult> GetByVehicule(long vehiculeId)
        => Ok(await service.GetByVehiculeAsync(vehiculeId));

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var d = await service.GetByIdAsync(id);
        return d == null ? NotFound(new { message = $"Document {id} introuvable" }) : Ok(d);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Create([FromBody] CreateDocumentDto dto)
    {
        var d = await service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = d.IdDocument }, d);
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await service.DeleteAsync(id);
        return result ? NoContent() : NotFound(new { message = $"Document {id} introuvable" });
    }
}
