namespace XparkGMAO.Core.Interfaces.Services;

public interface IEmailService
{
    Task SendConfirmationEmailAsync(string toEmail, string token);
    Task SendPasswordResetEmailAsync(string toEmail, string token);
    Task SendNewUserNotificationAsync(string adminEmail, string adminName, string newUserName, string newUserEmail, string role);
    Task SendAccountApprovedAsync(string email, string userName, string role);
    Task SendAccountRejectedAsync(string email, string userName, string raison);
}
