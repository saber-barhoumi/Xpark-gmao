namespace Maintenance.API.DTOs;

public class CreateInterventionDto
{
    public DateTime DateIntervention        { get; set; }
    public string   TypeIntervention        { get; set; } = string.Empty;
    public string   Description             { get; set; } = string.Empty;
    public double   Cout                    { get; set; }
    public double   KilometrageIntervention { get; set; }
    public long     VehiculeId              { get; set; }
    public long?    TechnicienId            { get; set; }
    public string?  Prestataire             { get; set; }
    public long?    OrdreTravailId          { get; set; }
    public int?     DureeMinutes            { get; set; }
    public string?  TypePeriodicite         { get; set; }
}

public class InterventionResponseDto
{
    public long     IdIntervention          { get; set; }
    public DateTime DateIntervention        { get; set; }
    public string   TypeIntervention        { get; set; } = string.Empty;
    public string   Description             { get; set; } = string.Empty;
    public double   Cout                    { get; set; }
    public string   Statut                  { get; set; } = string.Empty;
    public string?  VehiculeImmatriculation { get; set; }
    public long     VehiculeId              { get; set; }
    public long?    TechnicienId            { get; set; }
    public long?    OrdreTravailId          { get; set; }
}
