using Alerts.API.DTOs;

namespace Alerts.API.Services;

public interface IAlertService
{
    Task<IEnumerable<AlerteResponseDto>> GetAllAsync();
    Task<IEnumerable<AlerteResponseDto>> GetNonLuesAsync();
    Task<int> CountNonLuesAsync();
    Task<IEnumerable<AlerteResponseDto>> GetByTypeAsync(string type);
    Task<bool> MarquerLueAsync(long id);
    Task<bool> MarquerToutesLuesAsync();
    Task<bool> MarquerTraiteeAsync(long id);
    Task GenerateAlertesAutomatiquesAsync();
    Task RunDailyChecksAsync();
}
