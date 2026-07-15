using Mission.API.DTOs;
using Mission.API.Entities;

namespace Mission.API.Services;

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
    Task<bool>                            CancelMissionAsync(long id);
    Task<bool>                            DeleteAsync(long id);
}
