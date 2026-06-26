using IAM.API.Entities;

namespace IAM.API.Services;

public interface IJwtService
{
    string  GenerateToken(Utilisateur user);
    string  GenerateRefreshToken();
    long?   GetUserIdFromToken(string token);
    bool    ValidateToken(string token);
}
