namespace XparkGMAO.Core.DTOs;

/// <summary>
/// DTO pour le résultat de l'authentification et de l'inscription
/// </summary>
public class AuthResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? NewStatut { get; set; }
}
