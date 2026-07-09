using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace IAM.API.Services;

/// <summary>
/// Envoi d'emails transactionnels avec template HTML professionnel
/// (EmailTemplates/EmailTemplate.html — charte XPARK, logo embarqué en CID).
/// Le CSS est 100% inline dans le template : les clients mail (Gmail, Outlook)
/// suppriment les feuilles de style externes et bloquent le JavaScript.
/// </summary>
public class EmailService(IConfiguration config) : IEmailService
{
    private readonly string _host     = config["Email:Host"]!;
    private readonly int    _port     = int.Parse(config["Email:Port"] ?? "587");
    private readonly string _username = config["Email:Username"]!;
    private readonly string _password = config["Email:Password"]!;
    private readonly string _from     = config["Email:From"]!;

    private static readonly string TemplateDir =
        Path.Combine(AppContext.BaseDirectory, "EmailTemplates");

    // Template chargé une seule fois (null si absent → fallback simple)
    private static readonly Lazy<string?> Template = new(() =>
    {
        var path = Path.Combine(TemplateDir, "EmailTemplate.html");
        return File.Exists(path) ? File.ReadAllText(path) : null;
    });

    // ── Emails transactionnels ────────────────────────────────────────────────

    public Task<bool> SendEmailConfirmationAsync(string toEmail, string token) =>
        SendTemplatedAsync(toEmail,
            subject: "Confirmez votre email - XPARK GMAO",
            title:   "Bienvenue sur XPARK GMAO 👋",
            intro:   "Merci de vous être inscrit ! Pour activer votre compte, " +
                     "saisissez le code de confirmation ci-dessous sur la page de vérification.",
            code:    token,
            note:    "Ce code expire dans 24 heures.",
            codeSize: 20, codeSpacing: 1);

    public Task<bool> SendPasswordResetAsync(string toEmail, string token) =>
        SendTemplatedAsync(toEmail,
            subject: "Réinitialisation de votre mot de passe - XPARK GMAO",
            title:   "Réinitialisation de mot de passe 🔑",
            intro:   "Vous avez demandé à réinitialiser votre mot de passe. " +
                     "Saisissez le code ci-dessous sur la page de réinitialisation pour continuer.",
            code:    token,
            note:    "Ce code expire dans 1 heure. Passé ce délai, refaites une demande.",
            codeSize: 20, codeSpacing: 1);

    public Task<bool> SendMfaOtpAsync(string toEmail, string otp) =>
        SendTemplatedAsync(toEmail,
            subject: "Votre code de connexion - XPARK GMAO",
            title:   "Vérification en deux étapes 🔐",
            intro:   "Une connexion à votre compte est en cours. " +
                     "Saisissez ce code pour confirmer que c'est bien vous.",
            code:    otp,
            note:    "Ce code expire dans 10 minutes et ne peut être utilisé qu'une seule fois.",
            codeSize: 34, codeSpacing: 10);

    public Task SendWelcomeAsync(string toEmail, string nom) =>
        SendTemplatedAsync(toEmail,
            subject: "Votre compte est approuvé - XPARK GMAO",
            title:   $"Bienvenue {nom} ! 🎉",
            intro:   "Bonne nouvelle : votre compte XPARK GMAO a été approuvé. " +
                     "Vous pouvez dès maintenant vous connecter et profiter de tous nos services.",
            code:    "✓ COMPTE ACTIVÉ",
            note:    "Connectez-vous avec votre email et votre mot de passe habituels.",
            codeSize: 22, codeSpacing: 2);

    // ── Construction & envoi ─────────────────────────────────────────────────

    private async Task<bool> SendTemplatedAsync(
        string toEmail, string subject, string title, string intro,
        string code, string note, int codeSize, int codeSpacing)
    {
        string html;
        if (Template.Value is { } tpl)
        {
            html = tpl
                .Replace("{{TITLE}}",        title)
                .Replace("{{INTRO}}",        intro)
                .Replace("{{CODE}}",         code)
                .Replace("{{NOTE}}",         note)
                .Replace("{{CODE_SIZE}}",    codeSize.ToString())
                .Replace("{{CODE_SPACING}}", codeSpacing.ToString())
                .Replace("{{YEAR}}",         DateTime.UtcNow.Year.ToString());
        }
        else
        {
            // Fallback minimal si le template est absent du déploiement
            html = $"<h2>{title}</h2><p>{intro}</p><p><strong>{code}</strong></p><p>{note}</p>";
        }

        return await SendAsync(toEmail, subject, html, embedLogo: Template.Value is not null);
    }

    private async Task<bool> SendAsync(string toEmail, string subject, string htmlBody, bool embedLogo)
    {
        try
        {
            var msg = new MimeMessage();
            msg.From.Add(MailboxAddress.Parse(_from));
            msg.To.Add(MailboxAddress.Parse(toEmail));
            msg.Subject = subject;

            var builder = new BodyBuilder { HtmlBody = htmlBody };

            // Logo embarqué dans le message (cid:xpark-logo) — fonctionne dans
            // tous les clients mail, contrairement aux URLs externes/localhost.
            var logoPath = Path.Combine(TemplateDir, "logo.png");
            if (embedLogo && File.Exists(logoPath))
            {
                var logo = await builder.LinkedResources.AddAsync(logoPath);
                logo.ContentId = "xpark-logo";
            }

            msg.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_host, _port, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_username, _password);
            await smtp.SendAsync(msg);
            await smtp.DisconnectAsync(true);
            return true;
        }
        catch (Exception ex)
        {
            // Log and continue – email failure should not crash the app
            Console.WriteLine($"[EmailService] Failed to send email: {ex.Message}");
            return false;
        }
    }
}
