using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionFlotte;

namespace XparkGMAO.Core.Entities.GestionOperations;

public enum StatutMission { EN_ATTENTE, EN_COURS, TERMINEE, ANNULEE }

public class Mission
{
    public long IdMission { get; set; }
    public DateTime DateDepart { get; set; }
    public DateTime? DateRetour { get; set; }
    public string Destination { get; set; } = string.Empty;
    public double KilometrageDepart { get; set; }
    public double KilometrageRetour { get; set; }
    public StatutMission Statut { get; set; } = StatutMission.EN_ATTENTE;
    public string ObjetMission { get; set; } = string.Empty;
    public double CoutTotal { get; set; }
    public long EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public long VehiculeId { get; set; }
    public Vehicule Vehicule { get; set; } = null!;
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    // Logistics Checklist
    public bool BonCarburantAccorde { get; set; }
    public string? NumeroBonCarburant { get; set; }
    public bool VerificationDocuments { get; set; }
    public bool CarteAutorouteRemise { get; set; }

    // AI estimation (set at creation from FastAPI predictor)
    public string? VilleDepart { get; set; }
    public string? VilleArrivee { get; set; }
    public double DistanceEstimee { get; set; }
    public double CoutEstime { get; set; }
}
