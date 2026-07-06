using System.Security.Cryptography;
using System.Text;
using QRCoder;

namespace IAM.API.Services;

/// <summary>
/// TOTP RFC 6238 (Google/Microsoft Authenticator) — implemented on the standard
/// HMAC-SHA1 primitive, no external OTP dependency. 30 s time step, 6 digits,
/// verification window ±1 step (60 s tolerance, FICHE §2.1).
/// </summary>
public static class TotpService
{
    private const int TimeStepSeconds = 30;
    private const int Digits = 6;
    private const string Base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    public static string GenerateSecret()
    {
        var bytes = RandomNumberGenerator.GetBytes(20);   // 160 bits (RFC 4226 recommended)
        return ToBase32(bytes);
    }

    public static string BuildOtpAuthUri(string email, string secret, string issuer = "XPARK")
        => $"otpauth://totp/{Uri.EscapeDataString(issuer)}:{Uri.EscapeDataString(email)}" +
           $"?secret={secret}&issuer={Uri.EscapeDataString(issuer)}&digits={Digits}&period={TimeStepSeconds}";

    /// <summary>QR code PNG (base64 data URI) that Authenticator apps scan.</summary>
    public static string BuildQrCodeDataUri(string otpauthUri)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(otpauthUri, QRCodeGenerator.ECCLevel.Q);
        var png = new PngByteQRCode(data).GetGraphic(6);
        return $"data:image/png;base64,{Convert.ToBase64String(png)}";
    }

    public static bool VerifyCode(string base32Secret, string code)
    {
        if (string.IsNullOrWhiteSpace(code) || code.Length != Digits || !code.All(char.IsDigit))
            return false;

        byte[] key;
        try { key = FromBase32(base32Secret); }
        catch { return false; }

        long currentStep = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / TimeStepSeconds;
        // window ±1 : tolère la dérive d'horloge (60 s)
        for (long offset = -1; offset <= 1; offset++)
        {
            if (ComputeTotp(key, currentStep + offset) == code)
                return true;
        }
        return false;
    }

    private static string ComputeTotp(byte[] key, long timeStep)
    {
        var counter = BitConverter.GetBytes(timeStep);
        if (BitConverter.IsLittleEndian) Array.Reverse(counter);

        using var hmac = new HMACSHA1(key);
        var hash = hmac.ComputeHash(counter);

        int offset = hash[^1] & 0x0F;
        int binary = ((hash[offset] & 0x7F) << 24)
                   | ((hash[offset + 1] & 0xFF) << 16)
                   | ((hash[offset + 2] & 0xFF) << 8)
                   | (hash[offset + 3] & 0xFF);

        return (binary % 1_000_000).ToString("D6");
    }

    // ── Base32 (RFC 4648) ────────────────────────────────────────────────────

    private static string ToBase32(byte[] data)
    {
        var sb = new StringBuilder();
        int bits = 0, value = 0;
        foreach (var b in data)
        {
            value = (value << 8) | b;
            bits += 8;
            while (bits >= 5)
            {
                sb.Append(Base32Alphabet[(value >> (bits - 5)) & 31]);
                bits -= 5;
            }
        }
        if (bits > 0) sb.Append(Base32Alphabet[(value << (5 - bits)) & 31]);
        return sb.ToString();
    }

    private static byte[] FromBase32(string base32)
    {
        var clean = base32.Trim().TrimEnd('=').ToUpperInvariant();
        var output = new List<byte>();
        int bits = 0, value = 0;
        foreach (var c in clean)
        {
            int idx = Base32Alphabet.IndexOf(c);
            if (idx < 0) throw new FormatException($"Invalid Base32 char '{c}'");
            value = (value << 5) | idx;
            bits += 5;
            if (bits >= 8)
            {
                output.Add((byte)((value >> (bits - 8)) & 0xFF));
                bits -= 8;
            }
        }
        return output.ToArray();
    }
}
