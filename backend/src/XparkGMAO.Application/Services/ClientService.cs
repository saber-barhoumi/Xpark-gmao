using AutoMapper;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.Security;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.Application.Services;

/// <summary>
/// Service de gestion des clients
/// </summary>
public class ClientService : IClientService
{
    private readonly IClientRepository _clientRepository;
    private readonly IMapper _mapper;

    public ClientService(IClientRepository clientRepository, IMapper mapper)
    {
        _clientRepository = clientRepository;
        _mapper = mapper;
    }

    public async Task<PaginatedResponseDto<ClientResponseDto>> GetAllAsync(int page = 1, int pageSize = 10)
    {
        var all = await _clientRepository.GetAllAsync();
        var list = all.ToList();
        var total = list.Count;
        var data = list
            .OrderBy(c => c.Nom)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => _mapper.Map<ClientResponseDto>(c));

        return new PaginatedResponseDto<ClientResponseDto>
        {
            Data = data,
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<ClientResponseDto?> GetByIdAsync(long id)
    {
        var client = await _clientRepository.GetByIdAsync(id);
        return client == null ? null : _mapper.Map<ClientResponseDto>(client);
    }

    public async Task<ClientResponseDto> CreateAsync(CreateClientDto dto)
    {
        var existing = await _clientRepository.GetByEmailAsync(dto.Email);
        if (existing != null)
            throw new ArgumentException("Un client avec cet email existe déjà");

        var client = new Client
        {
            Nom = dto.Nom,
            Prenom = dto.Prenom,
            Email = dto.Email,
            MotDePasse = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Telephone = dto.Telephone,
            NomSociete = dto.NomSociete,
            SecteurActivite = dto.SecteurActivite,
            Adresse = dto.Adresse,
            Ville = dto.Ville,
            EstEntreprise = dto.EstEntreprise,
            Role = Role.CLIENT,
            Actif = true,
            DateCreation = DateTime.UtcNow
        };

        var created = await _clientRepository.AddAsync(client);
        return _mapper.Map<ClientResponseDto>(created);
    }

    public async Task<ClientResponseDto?> UpdateAsync(long id, CreateClientDto dto)
    {
        var client = await _clientRepository.GetByIdAsync(id);
        if (client == null) return null;

        client.Nom = dto.Nom;
        client.Prenom = dto.Prenom;
        client.Telephone = dto.Telephone;
        client.NomSociete = dto.NomSociete;
        client.SecteurActivite = dto.SecteurActivite;
        client.Adresse = dto.Adresse;
        client.Ville = dto.Ville;
        client.EstEntreprise = dto.EstEntreprise;

        await _clientRepository.UpdateAsync(client);
        return _mapper.Map<ClientResponseDto>(client);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var exists = await _clientRepository.ExistsAsync(id);
        if (!exists) return false;

        await _clientRepository.DeleteAsync(id);
        return true;
    }
}
