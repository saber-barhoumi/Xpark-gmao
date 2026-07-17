using IAM.Application.DTOs;
using IAM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Shared.Common;

namespace IAM.API.Controllers;

[Authorize]
[ApiController]
[Route("api/clients")]
public class ClientsController(IClientService clientService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ClientDto>>>> GetAll() =>
        Ok(ApiResponse<List<ClientDto>>.Ok(await clientService.GetAllAsync()));

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ClientDto>>> GetById(long id) =>
        Ok(ApiResponse<ClientDto>.Ok(await clientService.GetByIdAsync(id)));

    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ClientDto>>> Create([FromBody] CreateClientDto dto)
    {
        var result = await clientService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.IdUtilisateur },
            ApiResponse<ClientDto>.Ok(result, "Client créé."));
    }

    [Authorize(Roles = "ADMIN,ADMINISTRATEUR,GESTIONNAIRE")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ClientDto>>> Update(long id, [FromBody] UpdateClientDto dto) =>
        Ok(ApiResponse<ClientDto>.Ok(await clientService.UpdateAsync(id, dto)));

    [Authorize(Roles = "ADMIN,ADMINISTRATEUR")]
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(long id)
    {
        await clientService.DeleteAsync(id);
        return Ok(ApiResponse<string>.Ok("Client supprimé."));
    }
}
