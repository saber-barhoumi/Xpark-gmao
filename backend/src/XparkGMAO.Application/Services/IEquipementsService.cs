using XparkGMAO.Core.DTOs;

namespace XparkGMAO.Application.Services
{
    public interface IEquipementsService
    {
        Task<EquipementDetailDto> CreateAsync(CreateEquipementDto dto);
        Task<PagedResult<EquipementListItemDto>> GetAllAsync(FilterEquipementsDto filters);
        Task<EquipementDetailDto> GetByIdAsync(long id);
        Task<EquipementDetailDto> UpdateAsync(long id, UpdateEquipementDto dto);
        Task DeleteAsync(long id);
        Task<VerificationMissionDto> VerifierEquipementsAvantMissionAsync(long vehiculeId);
        Task<MouvementDto> CheckOutAsync(CheckOutDto dto);
        Task<MouvementDto> CheckInAsync(CheckInDto dto);
        Task<InspectionDto> CreerInspectionAsync(long equipementId, long technicienId, InspectionCreateDto dto);
        Task<KpiEquipementsDto> GetKpisAsync();

        // Notes
        Task<NoteEquipementDto> AjouterNoteAsync(CreateNoteEquipementDto dto, long auteurId);
        Task<NoteEquipementDto> ModifierNoteAsync(long noteId, CreateNoteEquipementDto dto, long auteurId);
        Task SupprimerNoteAsync(long noteId);

        // Contrats
        Task<ContratFournisseurDto> AjouterContratAsync(CreateContratFournisseurDto dto);
        Task<ContratFournisseurDto> ModifierContratAsync(long contratId, CreateContratFournisseurDto dto);
        Task SupprimerContratAsync(long contratId);

        // Automation
        Task CheckOutAutomatiqueAsync(long vehiculeId, long missionId, long chauffeurId);
        Task CheckInAutomatiqueAsync(long missionId, long chauffeurId);
        Task<int> RecalculerCompteursEquipementsAsync();
    }
}
