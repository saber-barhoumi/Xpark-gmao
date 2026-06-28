namespace XparkGMAO.Shared.AiTelemetry.Clients.DTOs;

/// <summary>Projection returned by Fleet.API for telemetry purposes.</summary>
public record VehicleInfoDto(
    long   VehiculeId,
    string VehicleType,
    double FuelConsumptionPer100Km
);
