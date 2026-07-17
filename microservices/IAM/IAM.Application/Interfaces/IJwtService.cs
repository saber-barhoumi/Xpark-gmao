using IAM.Domain.Entities;

namespace IAM.Application.Interfaces;

public interface IJwtService
{
    string  GenerateToken(Utilisateur user);
    string  GenerateRefreshToken();
    /// <summary>Jeton temporaire (5 min) emis apres le mot de passe, en attente du 2e facteur.</summary>
    string  GenerateMfaPendingToken(Utilisateur user);
    /// <summary>Retourne le userId si le jeton MFA pending est valide, sinon null.</summary>
    long?   ValidateMfaPendingToken(string token);
    long?   GetUserIdFromToken(string token);
    bool    ValidateToken(string token);
}
