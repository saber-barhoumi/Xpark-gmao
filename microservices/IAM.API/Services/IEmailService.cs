namespace IAM.API.Services;

public interface IEmailService
{
    Task SendEmailConfirmationAsync(string toEmail, string token);
    Task SendPasswordResetAsync(string toEmail, string token);
    Task SendWelcomeAsync(string toEmail, string nom);
    /// <summary>Retourne false si l'envoi SMTP a echoue (mode DEV: code logge).</summary>
    Task<bool> SendMfaOtpAsync(string toEmail, string otp);
}
