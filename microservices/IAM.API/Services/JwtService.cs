using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using IAM.API.Entities;
using Microsoft.IdentityModel.Tokens;

namespace IAM.API.Services;

public class JwtService(IConfiguration config) : IJwtService
{
    private readonly string    _key      = config["Jwt:Key"]!;
    private readonly string    _issuer   = config["Jwt:Issuer"]!;
    private readonly string    _audience = config["Jwt:Audience"]!;
    private readonly int       _expiry   = int.Parse(config["Jwt:ExpiryMinutes"] ?? "60");

    public string GenerateToken(Utilisateur user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.IdUtilisateur.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role,               user.Role.ToString()),
            new Claim("userId",                      user.IdUtilisateur.ToString()),
            new Claim("nom",                         user.Nom),
            new Claim("prenom",                      user.Prenom),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
        };

        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer:             _issuer,
            audience:           _audience,
            claims:             claims,
            expires:            DateTime.UtcNow.AddMinutes(_expiry),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    /// <summary>
    /// Jeton MFA "pending" (FICHE — login étape 2) : émis après validation du
    /// mot de passe, il n'autorise QUE l'appel /auth/mfa/verify. Courte durée
    /// (5 min), marqué token_use=mfa_pending pour ne jamais passer les
    /// [Authorize] classiques (aucun claim de rôle).
    /// </summary>
    public string GenerateMfaPendingToken(Utilisateur user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.IdUtilisateur.ToString()),
            new Claim("userId",    user.IdUtilisateur.ToString()),
            new Claim("token_use", "mfa_pending"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _issuer, audience: _audience, claims: claims,
            expires: DateTime.UtcNow.AddMinutes(5), signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public long? ValidateMfaPendingToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer           = true,
                ValidateAudience         = true,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer              = _issuer,
                ValidAudience            = _audience,
                IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key)),
                ClockSkew                = TimeSpan.Zero
            }, out _);

            if (principal.FindFirst("token_use")?.Value != "mfa_pending") return null;
            var sub = principal.FindFirst("userId")?.Value
                   ?? principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            return sub is not null ? long.Parse(sub) : null;
        }
        catch { return null; }
    }

    public long? GetUserIdFromToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwt     = handler.ReadJwtToken(token);
            var sub     = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;
            return sub is not null ? long.Parse(sub) : null;
        }
        catch { return null; }
    }

    public bool ValidateToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer           = true,
                ValidateAudience         = true,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer              = _issuer,
                ValidAudience            = _audience,
                IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key)),
                ClockSkew                = TimeSpan.Zero
            }, out _);
            return true;
        }
        catch { return false; }
    }
}
