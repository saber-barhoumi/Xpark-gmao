namespace Mission.API.Entities;

public class Mission
{
    public long          IdMission             { get; set; }
    public DateTime      DateDepart            { get; set; }
    public DateTime?     DateRetour            { get; set; }
    public string        Destination           { get; set; } = string.Empty;
    public double        KilometrageDepart     { get; set; }
    public double        KilometrageRetour     { get; set; }
    public StatutMission Statut                { get; set; } = StatutMission.EN_ATTENTE;
    public string        ObjetMission          { get; set; } = string.Empty;
    public double        CoutTotal             { get; set; }
    public long          EmployeeId            { get; set; }
    public long          VehiculeId            { get; set; }
    public DateTime      DateCreation          { get; set; } = DateTime.UtcNow;

    public bool    BonCarburantAccorde   { get; set; }
    public string? NumeroBonCarburant    { get; set; }
    public bool    VerificationDocuments { get; set; }
    public bool    CarteAutorouteRemise  { get; set; }
}
