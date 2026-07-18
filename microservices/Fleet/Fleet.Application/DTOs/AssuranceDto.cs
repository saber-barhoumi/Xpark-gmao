namespace Fleet.Application.DTOs;

public record CreateAssuranceDto(
    string Compagnie, string NumeroPolice, DateTime DateDebut, DateTime DateFin,
    double Prime, string TypeAssurance, string? ContactCompagnie, long VehiculeId
);

public record AssuranceDto(
    long IdAssurance, string Compagnie, string NumeroPolice,
    DateTime DateDebut, DateTime DateFin, double Prime,
    string TypeAssurance, bool Actif, long VehiculeId
);
