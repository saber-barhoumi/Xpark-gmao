using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendConfirmationEmailAsync(string toEmail, string token)
    {
        var subject = "XPARK GMAO - Confirmation de votre compte";
        
        // Build the confirmation URL
        // In a real app, this would be your frontend URL
        var frontendUrl = _configuration["AppUrl"] ?? "http://localhost:5173";
        var confirmationLink = $"{frontendUrl}/auth/confirm-mail?email={Uri.EscapeDataString(toEmail)}&token={Uri.EscapeDataString(token)}";
        
        var body = $@"
            <h2>Bienvenue sur XPARK GMAO</h2>
            <p>Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
            <p><a href='{confirmationLink}'>Confirmer mon compte</a></p>
            <p>Ou copiez/collez ce lien dans votre navigateur : {confirmationLink}</p>
            <br/>
            <p>Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email.</p>
        ";
        
        await SendEmailAsync(toEmail, subject, body);
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string token)
    {
        var subject = "XPARK GMAO - Réinitialisation de mot de passe";
        
        var frontendUrl = _configuration["AppUrl"] ?? "http://localhost:5173";
        var resetLink = $"{frontendUrl}/auth/recover-password?email={Uri.EscapeDataString(toEmail)}&token={Uri.EscapeDataString(token)}";
        // Update URL to point to correct React page (create-password) based on project standard 
        var actualResetLink = $"{frontendUrl}/auth/create-password?email={Uri.EscapeDataString(toEmail)}&token={Uri.EscapeDataString(token)}";
        
        var body = $@"
            <h2>Réinitialisation de votre mot de passe</h2>
            <p>Vous avez demandé à réinitialiser votre mot de passe pour XPARK GMAO.</p>
            <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
            <p><a href='{actualResetLink}'>Réinitialiser mon mot de passe</a></p>
            <br/>
            <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
        ";
        
        await SendEmailAsync(toEmail, subject, body);
    }

    public async Task SendNewUserNotificationAsync(string adminEmail, string adminName, string newUserName, string newUserEmail, string role)
    {
        var subject = "Nouvelle inscription - XPARK GMAO";
        var frontendUrl = _configuration["AppUrl"] ?? "http://localhost:5173";
        
        var body = $@"
            <h2>Nouvelle inscription en attente</h2>
            <p>Bonjour {adminName},</p>
            <p>Un nouvel utilisateur s'est inscrit et attend votre approbation :</p>
            <ul>
                <li><strong>Nom :</strong> {newUserName}</li>
                <li><strong>Email :</strong> {newUserEmail}</li>
                <li><strong>Rôle demandé :</strong> {role}</li>
            </ul>
            <p>
                <a href='{frontendUrl}/users/pending'>
                    Gérer les utilisateurs en attente
                </a>
            </p>";

        await SendEmailAsync(adminEmail, subject, body);
    }

    public async Task SendAccountApprovedAsync(string email, string userName, string role)
    {
        var subject = "Compte approuvé - XPARK GMAO";
        var frontendUrl = _configuration["AppUrl"] ?? "http://localhost:5173";
        
        var body = $@"
            <h2>🎉 Votre compte a été approuvé !</h2>
            <p>Bonjour {userName},</p>
            <p>Bonne nouvelle ! Votre compte XPARK GMAO a été approuvé par un administrateur.</p>
            <p><strong>Votre rôle :</strong> {role}</p>
            <p>Vous pouvez maintenant vous connecter :</p>
            <p><a href='{frontendUrl}/auth/login'>Se connecter</a></p>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendAccountRejectedAsync(string email, string userName, string raison)
    {
        var subject = "Inscription non approuvée - XPARK GMAO";
        
        var body = $@"
            <h2>Inscription non approuvée</h2>
            <p>Bonjour {userName},</p>
            <p>Nous regrettons de vous informer que votre demande d'inscription n'a pas été approuvée.</p>
            <p><strong>Raison :</strong> {raison}</p>
            <p>Pour toute question, contactez notre support.</p>";

        await SendEmailAsync(email, subject, body);
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            var message = new MimeMessage();
            
            var senderEmail = _configuration["EmailSettings:SenderEmail"] ?? "noreply@xpark.tn";
            var senderName = _configuration["EmailSettings:SenderName"] ?? "XPARK GMAO";
            
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            
            var host = _configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
            var portString = _configuration["EmailSettings:SmtpPort"] ?? "587";
            int.TryParse(portString, out int port);
            if(port == 0) port = 587;
            
            var username = _configuration["EmailSettings:SmtpUsername"];
            var password = _configuration["EmailSettings:SmtpPassword"];

            // For development without real email credentials, we're just going to log this and return
            // In a real environment, you need valid SMTP settings
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                Console.WriteLine($@"
==================================================
EMAIL SIMULATION (No credentials configured)
To: {toEmail}
Subject: {subject}
Body: 
{htmlBody}
==================================================");
                return;
            }

            Console.WriteLine($"[EMAIL] Connecting to {host}:{port} with username: {username}");
            
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            Console.WriteLine($"[EMAIL] Connected. Authenticating...");
            
            await client.AuthenticateAsync(username, password);
            Console.WriteLine($"[EMAIL] Authenticated successfully");
            
            await client.SendAsync(message);
            Console.WriteLine($"[EMAIL] Email sent successfully to {toEmail}");
            
            await client.DisconnectAsync(true);
            Console.WriteLine($"[EMAIL] Disconnected");
        }
        catch (Exception ex)
        {
            // Log the exception with full details
            Console.WriteLine($"[EMAIL ERROR] Failed to send email to {toEmail}");
            Console.WriteLine($"[EMAIL ERROR] Exception Type: {ex.GetType().Name}");
            Console.WriteLine($"[EMAIL ERROR] Message: {ex.Message}");
            Console.WriteLine($"[EMAIL ERROR] Stack Trace: {ex.StackTrace}");
            
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[EMAIL ERROR] Inner Exception: {ex.InnerException.Message}");
            }
            
            // NOT throwing - let the registration continue even if email fails
        }
    }
}
