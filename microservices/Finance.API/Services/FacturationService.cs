using AutoMapper;
using Finance.API.DTOs;
using Finance.API.Entities;
using Finance.API.Repositories;

namespace Finance.API.Services;

public class FacturationService(IFactureRepository repo, IMapper mapper) : IFacturationService
{
    public async Task<PaginatedResponseDto<FactureResponseDto>> GetAllAsync(int page, int pageSize, string? statut = null)
    {
        var (items, total) = await repo.GetPaginatedAsync(page, pageSize, statut);
        return new PaginatedResponseDto<FactureResponseDto>
        {
            Total = total, Page = page, PageSize = pageSize,
            Items = mapper.Map<List<FactureResponseDto>>(items)
        };
    }

    public async Task<FactureResponseDto?> GetByIdAsync(long id)
    {
        var facture = await repo.GetByIdAsync(id);
        return facture == null ? null : mapper.Map<FactureResponseDto>(facture);
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

    public async Task<FactureResponseDto> CreateAsync(CreateFactureDto dto)
    {
        var numero = await repo.GenerateNumeroFactureAsync();
        var mttc   = dto.Montant * (1 + dto.TauxTVA / 100);

        var facture = new Facture
        {
            NumeroFacture = numero,
            DateFacture   = DateTime.UtcNow,
            DateEcheance  = dto.DateEcheance,
            Montant       = dto.Montant,
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
