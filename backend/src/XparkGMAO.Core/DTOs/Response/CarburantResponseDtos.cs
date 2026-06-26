namespace XparkGMAO.Core.DTOs.Response;

public class CarburantResponseDto
{
    public long IdCarburant { get; set; }
    public DateTime DateRemplissage { get; set; }
    public double Quantite { get; set; }
    public double PrixUnitaire { get; set; }
    public double MontantTotal { get; set; }
    public double Kilometrage { get; set; }
    public string? Station { get; set; }
    public string? NumeroBon { get; set; }
    public string TypeCarburant { get; set; } = string.Empty;
    public long VehiculeId { get; set; }
    public string? VehiculeImmatriculation { get; set; }
    public long? SourceId { get; set; }
    public string? SourceNom { get; set; }
    public string? SourceType { get; set; }
    public double? ConsommationL100km { get; set; }
    public string? JustificatifUrl { get; set; }
}

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
    public string Mois { get; set; } = string.Empty; // Format: "YYYY-MM"
    public double CoutTotal { get; set; }
    public double LitresTotaux { get; set; }
}

public class CoutParVehiculeDto
{
    public string VehiculeImmatriculation { get; set; } = string.Empty;
    public double CoutTotal { get; set; }
    public double KilometrageTotal { get; set; }
}
