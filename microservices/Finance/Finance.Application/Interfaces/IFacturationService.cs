using Finance.Application.DTOs;

namespace Finance.Application.Interfaces;

public interface IFacturationService
{
    Task<PaginatedResponseDto<FactureResponseDto>> GetAllAsync(int page, int pageSize, string? statut = null);
    Task<FactureResponseDto?> GetByIdAsync(long id);
    Task<IEnumerable<FactureResponseDto>> GetByClientAsync(long clientId);
    Task<IEnumerable<FactureResponseDto>> GetImpayeesAsync();
    Task<FactureResponseDto> CreateAsync(CreateFactureDto dto);
    /// <summary>Ids des missions déjà facturées (factures non annulées) — anti-doublon.</summary>
    Task<IEnumerable<long>> GetMissionsFactureesAsync();
    Task<bool> MarquerPayeeAsync(long id, string? methodePaiement = null);
    Task<bool> AnnulerAsync(long id, string motif);
}
