using AutoMapper;
using Finance.Infrastructure.Data;
using Finance.Application.DTOs;
using Finance.Domain.Entities;
using Finance.Application.Interfaces;
using Finance.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Finance.Infrastructure.Services;

public class FacturationService(IFactureRepository repo, IMapper mapper, FinanceDbContext db) : IFacturationService
{
    /// <summary>Complète les DTOs avec le nom/email du client et la référence de
    /// mission (base partagée, lecture seule) — indispensable au document imprimable.</summary>
    private async Task EnrichAsync(IEnumerable<FactureResponseDto> dtos)
    {
        var list = dtos.ToList();
        if (list.Count == 0) return;

        var clientIds = list.Select(f => f.ClientId).Distinct().ToList();
        var clients = await db.Utilisateurs.AsNoTracking()
            .Where(u => clientIds.Contains(u.IdUtilisateur))
            .ToDictionaryAsync(u => u.IdUtilisateur);

        var missionIds = list.Where(f => f.MissionId.HasValue).Select(f => f.MissionId!.Value).Distinct().ToList();
        var missions = missionIds.Count == 0
            ? new Dictionary<long, MissionRef>()
            : await db.MissionsRef.AsNoTracking()
                .Where(m => missionIds.Contains(m.IdMission))
                .ToDictionaryAsync(m => m.IdMission);

        foreach (var f in list)
        {
            if (clients.TryGetValue(f.ClientId, out var c))
            {
                f.ClientNom = c.Nom; f.ClientPrenom = c.Prenom; f.ClientEmail = c.Email;
            }
            if (f.MissionId.HasValue && missions.TryGetValue(f.MissionId.Value, out var m))
                f.MissionReference = $"{m.VilleDepart} → {m.VilleArrivee ?? m.Destination}";
        }
    }

    public async Task<PaginatedResponseDto<FactureResponseDto>> GetAllAsync(int page, int pageSize, string? statut = null)
    {
        var (items, total) = await repo.GetPaginatedAsync(page, pageSize, statut);
        var dtos = mapper.Map<List<FactureResponseDto>>(items);
        await EnrichAsync(dtos);
        return new PaginatedResponseDto<FactureResponseDto>
        {
            Total = total, Page = page, PageSize = pageSize,
            Items = dtos
        };
    }

    public async Task<FactureResponseDto?> GetByIdAsync(long id)
    {
        var facture = await repo.GetByIdAsync(id);
        if (facture == null) return null;
        var dto = mapper.Map<FactureResponseDto>(facture);
        await EnrichAsync([dto]);
        return dto;
    }

    public async Task<IEnumerable<FactureResponseDto>> GetByClientAsync(long clientId)
    {
        var factures = await repo.GetByClientAsync(clientId);
        return mapper.Map<IEnumerable<FactureResponseDto>>(factures);
    }

    public async Task<IEnumerable<FactureResponseDto>> GetImpayeesAsync()
    {
        var factures = await repo.GetImpayeesAsync();
        return mapper.Map<IEnumerable<FactureResponseDto>>(factures);
    }

    /// <summary>
    /// Missions déjà facturées. Une facture ANNULÉE ne compte pas : la mission
    /// redevient facturable (c'est justement l'usage de l'annulation).
    /// </summary>
    public async Task<IEnumerable<long>> GetMissionsFactureesAsync()
        => await db.Factures
            .AsNoTracking()
            .Where(f => f.MissionId != null && f.Statut != StatutFacture.ANNULEE)
            .Select(f => f.MissionId!.Value)
            .Distinct()
            .ToListAsync();

    public async Task<FactureResponseDto> CreateAsync(CreateFactureDto dto)
    {
        // Anti-doublon : une prestation ne se facture qu'une fois. Contrôle
        // côté serveur (autorité) et pas seulement dans l'écran de saisie.
        if (dto.MissionId is > 0)
        {
            var dejaFacturee = await db.Factures.AnyAsync(f =>
                f.MissionId == dto.MissionId && f.Statut != StatutFacture.ANNULEE);
            if (dejaFacturee)
                throw new InvalidOperationException(
                    $"La mission #{dto.MissionId} est déjà facturée. Annulez la facture existante pour la refacturer.");
        }

        var numero = await repo.GenerateNumeroFactureAsync();
        var mttc   = dto.Montant * (1 + dto.TauxTVA / 100);

        var facture = new Facture
        {
            NumeroFacture = numero,
            DateFacture   = DateTime.UtcNow,
            DateEcheance  = dto.DateEcheance,
            Montant       = dto.Montant,
            MontantTVA    = dto.Montant * dto.TauxTVA / 100,
            MontantTTC    = mttc,
            TauxTVA       = dto.TauxTVA,
            Description   = dto.Description,
            ClientId      = dto.ClientId,
            MissionId     = dto.MissionId,
            Statut        = StatutFacture.EN_ATTENTE,
            DateCreation  = DateTime.UtcNow
        };

        await repo.AddAsync(facture);
        await repo.SaveChangesAsync();
        return mapper.Map<FactureResponseDto>(facture);
    }

    public async Task<bool> MarquerPayeeAsync(long id, string? methodePaiement = null)
    {
        var facture = await repo.GetByIdAsync(id);
        if (facture == null) return false;
        if (facture.Statut == StatutFacture.PAYEE)
            throw new InvalidOperationException("Cette facture est déjà marquée comme payée.");
        if (facture.Statut == StatutFacture.ANNULEE)
            throw new InvalidOperationException("Impossible de marquer une facture annulée comme payée.");

        facture.Statut       = StatutFacture.PAYEE;
        facture.DatePaiement = DateTime.UtcNow;
        repo.Update(facture);
        await repo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AnnulerAsync(long id, string motif)
    {
        var facture = await repo.GetByIdAsync(id);
        if (facture == null) return false;
        if (facture.Statut == StatutFacture.PAYEE)
            throw new InvalidOperationException("Impossible d'annuler une facture déjà payée.");
        if (facture.Statut == StatutFacture.ANNULEE)
            throw new InvalidOperationException("Cette facture est déjà annulée.");

        facture.Statut          = StatutFacture.ANNULEE;
        facture.MotifAnnulation = motif;
        repo.Update(facture);
        await repo.SaveChangesAsync();
        return true;
    }
}
