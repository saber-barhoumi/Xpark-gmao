using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace IAM.API.Services;

public class EmailService(IConfiguration config) : IEmailService
{
    private readonly string _host     = config["Email:Host"]!;
    private readonly int    _port     = int.Parse(config["Email:Port"] ?? "587");
    private readonly string _username = config["Email:Username"]!;
    private readonly string _password = config["Email:Password"]!;
    private readonly string _from     = config["Email:From"]!;

    public Task SendEmailConfirmationAsync(string toEmail, string token) =>
        SendAsync(toEmail, "Confirmez votre email - XparkGMAO",
            $@"<h2>Bienvenue sur XparkGMAO</h2>
               <p>Votre code de confirmation: <strong>{token}</strong></p>
               <p>Ce code expire dans 24h.</p>");

    public Task SendPasswordResetAsync(string toEmail, string token) =>
        SendAsync(toEmail, "Réinitialisation de mot de passe - XparkGMAO",
            $@"<h2>Réinitialisation de mot de passe</h2>
               <p>Votre token: <strong>{token}</strong></p>
               <p>Ce token expire dans 1h.</p>");

    public Task SendWelcomeAsync(string toEmail, string nom) =>
        SendAsync(toEmail, "Bienvenue sur XparkGMAO",
            $"<h2>Bienvenue {nom}!</h2><p>Votre compte a été approuvé.</p>");

    private async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            var msg = new MimeMessage();
            msg.From.Add(MailboxAddress.Parse(_from));
            msg.To.Add(MailboxAddress.Parse(toEmail));
            msg.Subject = subject;
            msg.Body    = new TextPart("html") { Text = htmlBody };

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_host, _port, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_username, _password);
            await smtp.SendAsync(msg);
            await smtp.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            // Log and continue – email failure should not crash the app
            Console.WriteLine($"[EmailService] Failed to send email: {ex.Message}");
        }
    }
}
