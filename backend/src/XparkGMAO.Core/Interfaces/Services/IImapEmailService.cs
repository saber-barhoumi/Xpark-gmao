using System.Collections.Generic;
using System.Threading.Tasks;
using XparkGMAO.Core.DTOs.Email;

namespace XparkGMAO.Core.Interfaces.Services
{
    public interface IImapEmailService
    {
        Task<PagedEmailsDto> GetEmailsAsync(string boite, int page, int limit, string? search);
        Task<EmailDetailDto> GetEmailByIdAsync(string boite, string uid);
        Task<List<EmailBoiteDto>> GetBoitesAsync();
        Task MarquerLuAsync(string boite, string uid, bool lu);
        Task EtoilerAsync(string boite, string uid, bool etoile);
        Task<bool> DeplacerVersCorbeille(string boite, string uid);
        Task SupprimerAsync(string boite, string uid);
    }
}
