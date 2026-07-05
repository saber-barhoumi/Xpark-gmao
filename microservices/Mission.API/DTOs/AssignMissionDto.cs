namespace Mission.API.DTOs;

/// <summary>
/// Applies one assignment produced by OptimisateurFlotteIA to a mission
/// EN_ATTENTE (vehicle + driver + denormalized display values).
/// </summary>
public class AssignMissionDto
{
    public long    VehiculeId              { get; set; }
    public long    EmployeeId              { get; set; }
    public string? VehiculeImmatriculation { get; set; }
    public string? ChauffeurNom            { get; set; }
    public double? KilometrageDepart       { get; set; }
    public double? CoutEstime              { get; set; }
}
