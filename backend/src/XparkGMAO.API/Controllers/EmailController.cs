using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using XparkGMAO.Core.DTOs.Email;
using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ADMIN,GESTIONNAIRE")]
    public class EmailController : ControllerBase
    {
        private readonly IImapEmailService _imap;
        private readonly ISmtpEmailSenderService _smtp;

        public EmailController(IImapEmailService imap, ISmtpEmailSenderService smtp)
        {
            _imap = imap;
            _smtp = smtp;
        }

        // GET /api/email/boites
        [HttpGet("boites")]
        public async Task<IActionResult> GetBoites()
            => Ok(await _imap.GetBoitesAsync());

        // GET /api/email/{boite}?page=1&limit=20&search=
        [HttpGet("{boite}")]
        public async Task<IActionResult> GetEmails(
            string boite,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20,
            [FromQuery] string? search = null)
            => Ok(await _imap.GetEmailsAsync(boite, page, limit, search));

        // GET /api/email/{boite}/{uid}
        [HttpGet("{boite}/{uid}")]
        public async Task<IActionResult> GetEmail(string boite, string uid)
            => Ok(await _imap.GetEmailByIdAsync(boite, uid));

        // PUT /api/email/{boite}/{uid}/lu
        [HttpPut("{boite}/{uid}/lu")]
        public async Task<IActionResult> MarquerLu(string boite, string uid, [FromQuery] bool lu = true)
        {
            await _imap.MarquerLuAsync(boite, uid, lu);
            return NoContent();
        }

        // PUT /api/email/{boite}/{uid}/etoile
        [HttpPut("{boite}/{uid}/etoile")]
        public async Task<IActionResult> Etoiler(string boite, string uid, [FromQuery] bool etoile = true)
        {
            await _imap.EtoilerAsync(boite, uid, etoile);
            return NoContent();
        }

        // DELETE /api/email/{boite}/{uid}
        [HttpDelete("{boite}/{uid}")]
        public async Task<IActionResult> Supprimer(string boite, string uid)
        {
            await _imap.DeplacerVersCorbeille(boite, uid);
            return NoContent();
        }

        // POST /api/email/envoyer
        [HttpPost("envoyer")]
        public async Task<IActionResult> Envoyer([FromBody] EnvoyerEmailDto dto)
        {
            var result = await _smtp.EnvoyerAsync(dto);
            return result ? Ok(new { success = true }) : StatusCode(500);
        }

        // POST /api/email/repondre
        [HttpPost("repondre")]
        public async Task<IActionResult> Repondre(
            [FromBody] EnvoyerEmailDto dto,
            [FromQuery] string? messageIdOriginal = null)
        {
            var result = await _smtp.RepondreAsync(dto, messageIdOriginal);
            return result ? Ok(new { success = true }) : StatusCode(500);
        }
    }
}
