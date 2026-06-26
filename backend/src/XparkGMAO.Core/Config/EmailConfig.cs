namespace XparkGMAO.Core.Config
{
    public class EmailConfig
    {
        public string ImapHost { get; set; } = "imap.gmail.com";
        public int ImapPort { get; set; } = 993;
        public bool ImapSsl { get; set; } = true;

        public string SmtpHost { get; set; } = "smtp.gmail.com";
        public int SmtpPort { get; set; } = 587;
        public bool SmtpSsl { get; set; } = false; // Gmail SMTP port 587 uses STARTTLS

        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string DisplayName { get; set; } = "Xpark GMAO Support";
    }
}
