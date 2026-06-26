using System.Threading.Tasks;
using XparkGMAO.Core.DTOs.Email;

namespace XparkGMAO.Core.Interfaces.Services
{
    public interface ISmtpEmailSenderService
    {
        Task<bool> EnvoyerAsync(EnvoyerEmailDto dto);
        Task<bool> RepondreAsync(EnvoyerEmailDto dto, string? messageIdOriginal);
    }
}
