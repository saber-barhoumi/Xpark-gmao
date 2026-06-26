using AutoMapper;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.GestionFinance;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.Application.Services;

/// <summary>
/// Service de facturation
/// </summary>
public class FacturationService : IFacturationService
{
    private readonly IFactureRepository _factureRepository;
    private readonly IMapper _mapper;

    public FacturationService(IFactureRepository factureRepository, IMapper mapper)
    {
        _factureRepository = factureRepository;
        _mapper = mapper;
    }

    public async Task<PaginatedResponseDto<FactureResponseDto>> GetAllAsync(int page = 1, int pageSize = 10)
    {
        var all = await _factureRepository.GetAllAsync();
        var list = all.ToList();
        var total = list.Count;
        var data = list
            .OrderByDescending(f => f.DateEmission)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => _mapper.Map<FactureResponseDto>(f));

        return new PaginatedResponseDto<FactureResponseDto>
        {
            Data = data,
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<FactureResponseDto?> GetByIdAsync(long id)
    {
        var facture = await _factureRepository.GetByIdAsync(id);
        return facture == null ? null : _mapper.Map<FactureResponseDto>(facture);
    }

    public async Task<IEnumerable<FactureResponseDto>> GetByClientAsync(long clientId)
    {
        var factures = await _factureRepository.GetByClientAsync(clientId);
        return factures.Select(f => _mapper.Map<FactureResponseDto>(f));
    }

    public async Task<IEnumerable<FactureResponseDto>> GetImpayeesAsync()
    {
        var factures = await _factureRepository.GetImpayeesAsync();
        return factures.Select(f => _mapper.Map<FactureResponseDto>(f));
    }

    public async Task<FactureResponseDto> CreateAsync(CreateFactureDto dto)
    {
        var montantTVA = dto.MontantHT * (dto.TauxTVA / 100);
        var facture = new Facture
        {
            NumeroFacture = await _factureRepository.GenerateNumeroFactureAsync(),
            DateEmission = DateTime.UtcNow,
            DateEcheance = dto.DateEcheance.HasValue ? DateTime.SpecifyKind(dto.DateEcheance.Value, DateTimeKind.Utc) : null,
            MontantHT = dto.MontantHT,
            TauxTVA = dto.TauxTVA,
            MontantTVA = montantTVA,
            MontantTTC = dto.MontantHT + montantTVA,
            ClientId = dto.ClientId,
            MissionId = dto.MissionId,
            Notes = dto.Notes,
            Statut = StatutFacture.EMISE,
            DateCreation = DateTime.UtcNow
        };

        var created = await _factureRepository.AddAsync(facture);
        return _mapper.Map<FactureResponseDto>(created);
    }

    public async Task<bool> MarquerPayeeAsync(long id, string modePaiement)
    {
        var facture = await _factureRepository.GetByIdAsync(id);
        if (facture == null) return false;

        facture.Statut = StatutFacture.PAYEE;
        facture.DatePaiement = DateTime.UtcNow;
        facture.ModePaiement = modePaiement;

        await _factureRepository.UpdateAsync(facture);
        return true;
    }

    public async Task<bool> AnnulerAsync(long id)
    {
        var facture = await _factureRepository.GetByIdAsync(id);
        if (facture == null) return false;

        facture.Statut = StatutFacture.ANNULEE;
        await _factureRepository.UpdateAsync(facture);
        return true;
    }
}
