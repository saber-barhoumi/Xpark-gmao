namespace Fleet.API.DTOs;

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
