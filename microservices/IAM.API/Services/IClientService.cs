using IAM.API.DTOs;

namespace IAM.API.Services;

public interface IClientService
{
    Task<List<ClientDto>> GetAllAsync();
    Task<ClientDto>       GetByIdAsync(long id);
    Task<ClientDto>       CreateAsync(CreateClientDto dto);
    Task<ClientDto>       UpdateAsync(long id, UpdateClientDto dto);
    Task                  DeleteAsync(long id);
}
