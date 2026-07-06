namespace IAM.API.Entities;

/// <summary>MFA configuration per user (FICHE §5 — UserMfaSettings).</summary>
public class UserMfaSettings
{
    public long      Id                   { get; set; }
    public long      UserId               { get; set; }
    public bool      AuthenticatorEnabled { get; set; }
    public string?   AuthenticatorSecret  { get; set; }        // Base32, set at setup, active after confirm
    public bool      EmailOtpEnabled      { get; set; }
    public string    DefaultMethod        { get; set; } = "AUTHENTICATOR"; // AUTHENTICATOR | EMAIL
    public DateTime  CreatedAt            { get; set; } = DateTime.UtcNow;
    public DateTime  UpdatedAt            { get; set; } = DateTime.UtcNow;
}

/// <summary>One-time code sent by email (FICHE §2.2) — stored hashed.</summary>
public class EmailOtp
{
    public long      Id        { get; set; }
    public long      UserId    { get; set; }
    public string    CodeHash  { get; set; } = string.Empty;    // BCrypt hash
    public DateTime  ExpiryTime{ get; set; }
    public bool      IsUsed    { get; set; }
    public DateTime? UsedAt    { get; set; }
    public int       Attempts  { get; set; }
    public DateTime  CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Connection history (FICHE §5 — LoginHistory).</summary>
public class LoginHistoryEntry
{
    public long      Id            { get; set; }
    public long      UserId        { get; set; }
    public string    LoginMethod   { get; set; } = "PASSWORD";  // PASSWORD | PIN | REFRESH
    public string?   MfaMethod     { get; set; }                // AUTHENTICATOR | EMAIL | null
    public string?   IpAddress     { get; set; }
    public string?   UserAgent     { get; set; }
    public bool      IsSuccessful  { get; set; }
    public string?   FailureReason { get; set; }
    public DateTime  LoggedInAt    { get; set; } = DateTime.UtcNow;
}

/// <summary>Security audit trail (FICHE §7 — AuditLogs).</summary>
public class AuthAuditLog
{
    public long      Id          { get; set; }
    public long?     UserId      { get; set; }
    public string    Action      { get; set; } = string.Empty;  // LOGIN, MFA_SETUP, MFA_VERIFIED…
    public string?   Description { get; set; }
    public string?   IpAddress   { get; set; }
    public DateTime  CreatedAt   { get; set; } = DateTime.UtcNow;
}
