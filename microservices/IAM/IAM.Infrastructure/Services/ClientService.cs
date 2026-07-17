using IAM.Infrastructure.Data;
using IAM.Application.DTOs;
using IAM.Domain.Entities;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Shared.Events;

namespace IAM.Infrastructure.Services;

public class ClientService(IamDbContext db, IPublishEndpoint bus) : IClientService
{
    public async Task<List<ClientDto>> GetAllAsync() =>
        (await db.Clients.ToListAsync()).Select(ToDto).ToList();

    public async Task<ClientDto> GetByIdAsync(long id)
    {
        var c = await db.Clients.FindAsync(id)
            ?? throw new KeyNotFoundException("Client introuvable.");
        return ToDto(c);
    }

    public async Task<ClientDto> CreateAsync(CreateClientDto dto)
    {
        var exists = await db.Utilisateurs.AnyAsync(u => u.Email == dto.Email.ToLower());
        if (exists) throw new InvalidOperationException("Email déjà utilisé.");

        var client = new Client
        {
            Nom             = dto.Nom,
            Prenom          = dto.Prenom,
            Email           = dto.Email.ToLower(),
            MotDePasse      = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
            Telephone       = dto.Telephone ?? "",
            NomSociete      = dto.NomSociete,
            SecteurActivite = dto.SecteurActivite,
            Adresse         = dto.Adresse,
            Ville           = dto.Ville,
            EstEntreprise   = dto.EstEntreprise,
            NumeroFiscal    = dto.NumeroFiscal,
            Role            = XparkGMAO.Shared.Enums.Role.CLIENT,
            Statut          = XparkGMAO.Shared.Enums.StatutUtilisateur.ACTIF,
            EmailConfirmed  = true,
        };

        db.Clients.Add(client);
        await db.SaveChangesAsync();

        await bus.Publish(new ClientCreatedEvent(client.IdUtilisateur, client.Nom, client.Email));
        return ToDto(client);
    }

    public async Task<ClientDto> UpdateAsync(long id, UpdateClientDto dto)
    {
        var client = await db.Clients.FindAsync(id)
            ?? throw new KeyNotFoundException("Client introuvable.");

        if (dto.Nom            is not null) client.Nom            = dto.Nom;
        if (dto.Prenom         is not null) client.Prenom         = dto.Prenom;
        if (dto.Telephone      is not null) client.Telephone      = dto.Telephone;
        if (dto.NomSociete     is not null) client.NomSociete     = dto.NomSociete;
        if (dto.SecteurActivite is not null) client.SecteurActivite = dto.SecteurActivite;
        if (dto.Adresse        is not null) client.Adresse        = dto.Adresse;
        if (dto.Ville          is not null) client.Ville          = dto.Ville;
        if (dto.NumeroFiscal   is not null) client.NumeroFiscal   = dto.NumeroFiscal;
        client.DateModification = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return ToDto(client);
    }

    public async Task DeleteAsync(long id)
    {
        var client = await db.Clients.FindAsync(id)
            ?? throw new KeyNotFoundException("Client introuvable.");
        client.Actif = false;
        await db.SaveChangesAsync();
    }

    private static ClientDto ToDto(Client c) => new(
        c.IdUtilisateur, c.Nom, c.Prenom, c.Email, c.Telephone,
        c.NomSociete, c.SecteurActivite, c.Adresse, c.Ville,
        c.EstEntreprise, c.NumeroFiscal, c.DateCreation);
}
