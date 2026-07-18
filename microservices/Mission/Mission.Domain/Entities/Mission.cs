namespace Mission.Domain.Entities;

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
    // Nullable: a mission can be created EN_ATTENTE without assignment —
    // OptimisateurFlotteIA fills these via PUT /missions/{id}/assign
    public long?         EmployeeId            { get; set; }
    public long?         VehiculeId            { get; set; }
    // Client (frontoffice) à l'origine de la demande — colonne existante en base
    public long?         ClientIdUtilisateur   { get; set; }
    public string?       ClientNom             { get; set; }   // dénormalisé (affichage backoffice)
    public DateTime      DateCreation          { get; set; } = DateTime.UtcNow;

    public bool    BonCarburantAccorde   { get; set; }
    public string? NumeroBonCarburant    { get; set; }
    public bool    VerificationDocuments { get; set; }
    public bool    CarteAutorouteRemise  { get; set; }

    // Denormalized display values — stored at creation to avoid cross-service calls at list time
    public string? VehiculeImmatriculation { get; set; }
    public string? ChauffeurNom            { get; set; }

    // Route + AI prediction snapshot (stored at creation time)
    public string? VilleDepart          { get; set; }
    public string? VilleArrivee         { get; set; }
    public double  DistanceKm           { get; set; }
    public double  CoutEstimeAI         { get; set; }
    public string? AiVehiculeTypeUsed   { get; set; }
}
