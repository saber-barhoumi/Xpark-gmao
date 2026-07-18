namespace Fleet.Application.DTOs;

public record CreateCarburantDto(
    DateTime DateRemplissage, double Quantite, double PrixUnitaire,
    double Kilometrage, string? Station, string? NumeroBon,
    string TypeCarburant, long VehiculeId, long? ChauffeurId, long? SourceId
);

public record CarburantDto(
    long IdCarburant, DateTime DateRemplissage, double Quantite,
    double PrixUnitaire, double MontantTotal, double Kilometrage,
    string? Station, string TypeCarburant, long VehiculeId, long? SourceId, DateTime DateCreation
);

// ── Statistiques carburant (contrat identique au monolithe — consommé par le
//    dashboard unifié et la page Consommation Carburant du back office) ───────
public class StatistiquesCarburantDto
{
    public double ConsommationMoyenne { get; set; } // L/100km
    public double CoutTotal { get; set; }
    public double LitresTotaux { get; set; }
    public double KilometrageTotal { get; set; }
    public int NombrePleins { get; set; }
    public List<CoutParSourceDto> RepartitionParSource { get; set; } = new();
    public List<EvolutionMensuelleDto> EvolutionMensuelle { get; set; } = new();
    public List<CoutParVehiculeDto> TopVehiculesParCout { get; set; } = new();
}

public class CoutParSourceDto
{
    public string NomSource { get; set; } = string.Empty;
    public string TypeSource { get; set; } = string.Empty;
    public double CoutTotal { get; set; }
    public int NombrePleins { get; set; }
    public double PrixMoyen { get; set; }
}

public class EvolutionMensuelleDto
{
    public string Mois { get; set; } = string.Empty; // "YYYY-MM"
    public double CoutTotal { get; set; }
    public double LitresTotaux { get; set; }
}

public class CoutParVehiculeDto
{
    public string VehiculeImmatriculation { get; set; } = string.Empty;
    public double CoutTotal { get; set; }
    public double KilometrageTotal { get; set; }
}
