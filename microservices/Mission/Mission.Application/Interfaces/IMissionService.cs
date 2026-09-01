using Mission.Application.DTOs;
using Mission.Domain.Entities;

namespace Mission.Application.Interfaces;

public interface IMissionService
{
    Task<IEnumerable<MissionResponseDto>> GetAllAsync();
    Task<MissionResponseDto?>             GetByIdAsync(long id);
    Task<IEnumerable<MissionResponseDto>> GetByStatutAsync(StatutMission statut);
    Task<MissionResponseDto>              CreateMissionAsync(CreateMissionDto dto);
    Task<MissionResponseDto>              CloseMissionAsync(long missionId, double kilometrageRetour);
    Task<MissionResponseDto>              AssignMissionAsync(long missionId, AssignMissionDto dto);
    Task<MissionResponseDto>              CreateMissionFromAcceptedRequestAsync(long clientUserId, string? clientNom, ClientMissionRequestDto dto);
    Task<bool>                            CancelMyMissionAsync(long clientUserId, long missionId);
    Task<IEnumerable<MissionResponseDto>> GetByClientAsync(long clientUserId);
    Task<IEnumerable<MissionResponseDto>> GetByDriverNameAsync(string chauffeurNom, string? statut);
    /// <summary>Une mission par id, uniquement si elle appartient au chauffeur (Mission.ChauffeurNom). Null sinon (introuvable ou pas la sienne).</summary>
    Task<MissionResponseDto?>             GetByIdForDriverAsync(long id, string chauffeurNom);
    Task<bool>                            CancelMissionAsync(long id);
    Task<bool>                            DeleteAsync(long id);
}
