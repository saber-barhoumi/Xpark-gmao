namespace Mission.Application.DTOs;

/// <summary>
/// Demande de mission depuis le PORTAIL CLIENT (frontoffice).
/// Crée une mission EN_ATTENTE sans affectation — elle apparaît dans le
/// backoffice et sera affectée par l'admin ou par OptimisateurFlotteIA.
/// </summary>
public class ClientMissionRequestDto
{
    public DateTime  DateDepart         { get; set; }
    public string    VilleDepart        { get; set; } = string.Empty;
    public string    VilleArrivee       { get; set; } = string.Empty;
    public string    ObjetMission       { get; set; } = string.Empty;
    public double    DistanceKm         { get; set; }
    public double    CoutEstime         { get; set; }
    public string?   AiVehiculeTypeUsed { get; set; }   // classe estimée par l'IA prix
}
