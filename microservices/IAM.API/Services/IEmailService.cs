namespace IAM.API.Services;

public interface IEmailService
{
    Task SendEmailConfirmationAsync(string toEmail, string token);
    Task SendPasswordResetAsync(string toEmail, string token);
    Task SendWelcomeAsync(string toEmail, string nom);
}
