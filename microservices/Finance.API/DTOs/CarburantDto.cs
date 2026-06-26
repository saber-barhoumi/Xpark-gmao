namespace Finance.API.DTOs;

public class CreateCarburantDto
{
    public long VehiculeId { get; set; }
    public long? ChauffeurId { get; set; }
    public long? SourceId { get; set; }
    public DateTime DateRavitaillement { get; set; } = DateTime.UtcNow;
    public double Quantite { get; set; }
    public double PrixUnitaire { get; set; }
    public double? KilometrageActuel { get; set; }
    public string? Observations { get; set; }
}

public class CarburantResponseDto
{
    public long IdCarburant { get; set; }
    public DateTime DateRavitaillement { get; set; }
    public double Quantite { get; set; }
    public double PrixUnitaire { get; set; }
    public double PrixTotal { get; set; }
    public double? KilometrageActuel { get; set; }
    public string? Observations { get; set; }
    public long VehiculeId { get; set; }
    public string? VehiculeImmatriculation { get; set; }
    public string? VehiculeMarque { get; set; }
    public string? VehiculeModele { get; set; }
    public long? ChauffeurId { get; set; }
    public string? ChauffeurNom { get; set; }
    public long? SourceId { get; set; }
    public string? SourceNom { get; set; }
    public string? TypeSource { get; set; }
}
