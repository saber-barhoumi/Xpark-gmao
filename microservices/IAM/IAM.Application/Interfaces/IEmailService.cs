namespace IAM.Application.Interfaces;

public interface IEmailService
{
    Task<bool> SendEmailConfirmationAsync(string toEmail, string token);
    Task<bool> SendPasswordResetAsync(string toEmail, string token);
    Task SendWelcomeAsync(string toEmail, string nom);
    /// <summary>Retourne false si l'envoi SMTP a echoue (mode DEV: code logge).</summary>
    Task<bool> SendMfaOtpAsync(string toEmail, string otp);
}
