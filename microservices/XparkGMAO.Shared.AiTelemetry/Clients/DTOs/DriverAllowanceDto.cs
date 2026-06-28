namespace XparkGMAO.Shared.AiTelemetry.Clients.DTOs;

/// <summary>Projection returned by Finance/IAM API for telemetry purposes.</summary>
public record DriverAllowanceDto(
    long   EmployeeId,
    double TripAllowanceDt
);
