using System;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using XparkGMAO.Core.Config;
using XparkGMAO.Core.DTOs.Email;
using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.Infrastructure.Services
{
    public class SmtpEmailSenderService : ISmtpEmailSenderService
    {
        private readonly EmailConfig _config;

        public SmtpEmailSenderService(IOptions<EmailConfig> config)
            => _config = config.Value;

        public async Task<bool> EnvoyerAsync(EnvoyerEmailDto dto)
        {
            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(_config.DisplayName, _config.Username));

            foreach (var dest in dto.A)
                message.To.Add(MailboxAddress.Parse(dest));

            foreach (var cc in dto.Cc)
                message.Cc.Add(MailboxAddress.Parse(cc));

            message.Subject = dto.Sujet;

            var builder = new BodyBuilder { HtmlBody = dto.Corps };
            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            // Gmail uses STARTTLS on port 587
            await client.ConnectAsync(_config.SmtpHost, _config.SmtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_config.Username, _config.Password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            return true;
        }

        public async Task<bool> RepondreAsync(EnvoyerEmailDto dto, string? messageIdOriginal)
        {
            if (!dto.Sujet.StartsWith("Re:", StringComparison.OrdinalIgnoreCase))
                dto.Sujet = "Re: " + dto.Sujet;

            // In a real scenario, we would also add In-Reply-To and References headers
            // using messageIdOriginal if provided.
            
            return await EnvoyerAsync(dto);
        }
    }
}
