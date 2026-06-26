namespace Maintenance.API.Entities;

public class Intervention
{
    public long               IdIntervention          { get; set; }
    public DateTime           DateIntervention        { get; set; }
    public DateTime?          DateFinIntervention     { get; set; }
    public TypeIntervention   TypeIntervention        { get; set; }
    public string             Description             { get; set; } = string.Empty;
    public double             Cout                    { get; set; }
    public double?            CoutMainOeuvre          { get; set; }
    public double?            CoutPieces              { get; set; }
    public StatutIntervention Statut                  { get; set; } = StatutIntervention.PLANIFIEE;
    public double             KilometrageIntervention { get; set; }
    public string?            Observations            { get; set; }
    public string?            Prestataire             { get; set; }
    public int?               DureeMinutes            { get; set; }
    public string?            TypePeriodicite         { get; set; }
    public long               VehiculeId              { get; set; }
    public long?              TechnicienId            { get; set; }
    public long?              OrdreTravailId          { get; set; }
    public DateTime           DateCreation            { get; set; } = DateTime.UtcNow;

    public OrdreTravail?  OrdreTravail  { get; set; }
    public ICollection<InterventionPiece> InterventionPieces { get; set; } = new List<InterventionPiece>();
}
