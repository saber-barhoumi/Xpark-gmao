namespace XparkGMAO.Core.DTOs.Request;

public class CreateCarburantDto
{
    public DateTime DateRemplissage { get; set; }
    public double Quantite { get; set; }
    public double PrixUnitaire { get; set; }
    public double Kilometrage { get; set; }
    public string? Station { get; set; }
    public string? NumeroBon { get; set; }
    public string TypeCarburant { get; set; } = "Diesel";
    public long VehiculeId { get; set; }
    public long? ChauffeurId { get; set; }
    public long? SourceId { get; set; }
    public double? MontantTotal { get; set; }
    public string? JustificatifUrl { get; set; }
}

public class UpdateCarburantDto
{
    public DateTime? DateRemplissage { get; set; }
    public double? Quantite { get; set; }
    public double? PrixUnitaire { get; set; }
    public double? Kilometrage { get; set; }
    public string? Station { get; set; }
    public string? NumeroBon { get; set; }
    public string? TypeCarburant { get; set; }
    public long? SourceId { get; set; }
}
