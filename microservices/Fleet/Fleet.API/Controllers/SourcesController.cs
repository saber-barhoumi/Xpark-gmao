using Fleet.Application.DTOs;
using Fleet.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleet.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SourcesController(ISourceService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await service.GetAllAsync());

    [HttpGet("actives")]
    public async Task<IActionResult> GetActives() => Ok(await service.GetActivesAsync());

    [HttpGet("type/{type}")]
    public async Task<IActionResult> GetByType(string type) => Ok(await service.GetByTypeAsync(type));

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var s = await service.GetByIdAsync(id);
        return s == null ? NotFound(new { message = $"Source {id} introuvable" }) : Ok(s);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Create([FromBody] CreateSourceDto dto)
    {
        var s = await service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = s.IdSource }, s);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateSourceDto dto)
    {
        var s = await service.UpdateAsync(id, dto);
        return s == null ? NotFound(new { message = $"Source {id} introuvable" }) : Ok(s);
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(long id)
    {
        var result = await service.DeleteAsync(id);
        return result ? NoContent() : NotFound(new { message = $"Source {id} introuvable" });
    }
}
