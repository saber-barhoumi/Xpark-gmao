namespace Mission.Application.DTOs;

public class CreateMissionDto
{
    public DateTime  DateDepart            { get; set; }
    public DateTime? DateRetour            { get; set; }
    public string    Destination           { get; set; } = string.Empty;
    public double    KilometrageDepart     { get; set; }
    public string    ObjetMission          { get; set; } = string.Empty;
    // Nullable: without vehicle+driver the mission is created EN_ATTENTE,
    // waiting for OptimisateurFlotteIA to assign resources
    public long?     VehiculeId            { get; set; }
    public long?     EmployeeId            { get; set; }
    public bool      BonCarburantAccorde   { get; set; }
    public string?   NumeroBonCarburant    { get; set; }
    public bool      VerificationDocuments { get; set; }
    public bool      CarteAutorouteRemise  { get; set; }
    public string?   VehiculeImmatriculation { get; set; }
    public string?   ChauffeurNom            { get; set; }
    public string?   VilleDepart             { get; set; }
    public string?   VilleArrivee            { get; set; }
    public double    DistanceEstimee         { get; set; }
    public double    CoutEstime              { get; set; }
    public string?   AiVehiculeTypeUsed      { get; set; }
    // Client donneur d'ordre, quand la mission est créée pour un client
    // identifié (depuis l'annuaire ou la fiche utilisateur). Null = mission
    // interne. Indispensable pour la facturation, qui ne facture que les
    // missions rattachées à un client.
    public long?     ClientIdUtilisateur     { get; set; }
    public string?   ClientNom               { get; set; }
}
