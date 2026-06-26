namespace Mission.API.DTOs;

public class MissionResponseDto
{
    public long      IdMission             { get; set; }
    public DateTime  DateDepart            { get; set; }
    public DateTime? DateRetour            { get; set; }
    public string    Destination           { get; set; } = string.Empty;
    public string    Statut                { get; set; } = string.Empty;
    public double    KilometrageDepart     { get; set; }
    public double    KilometrageRetour     { get; set; }
    public string    ObjetMission          { get; set; } = string.Empty;
    public double    CoutTotal             { get; set; }
    public double    Distance              => KilometrageRetour > 0 ? KilometrageRetour - KilometrageDepart : 0;
    public string?   VehiculeImmatriculation { get; set; }
    public string?   ChauffeurNom          { get; set; }
    public bool      BonCarburantAccorde   { get; set; }
    public string?   NumeroBonCarburant    { get; set; }
    public bool      VerificationDocuments { get; set; }
    public bool      CarteAutorouteRemise  { get; set; }
    public long      EmployeeId            { get; set; }
    public long      VehiculeId            { get; set; }
    public DateTime  DateCreation          { get; set; }
}
