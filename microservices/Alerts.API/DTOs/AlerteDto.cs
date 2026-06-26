namespace Alerts.API.DTOs;

public class AlerteResponseDto
{
    public long IdAlerte { get; set; }
    public string TypeAlerte { get; set; } = string.Empty;
    public string Priorite { get; set; } = string.Empty;
    public string Statut { get; set; } = string.Empty;
    public string Titre { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime DateCreation { get; set; }
    public DateTime? DateLecture { get; set; }
    public DateTime? DateTraitement { get; set; }
    public long? VehiculeId { get; set; }
    public string? VehiculeImmatriculation { get; set; }
    public long? EquipementId { get; set; }
    public long? MissionId { get; set; }
    public DateTime? DateExpiration { get; set; }
}

public class GenererAlertesRequest
{
    public long? VehiculeId { get; set; }
}
