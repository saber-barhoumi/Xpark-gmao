namespace XparkGMAO.Core.DTOs;

/// <summary>
/// DTO pour la demande d'inscription simplifiée
/// </summary>
public class RegisterDto
{
    public string Email { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string MotDePasse { get; set; } = string.Empty;
}
