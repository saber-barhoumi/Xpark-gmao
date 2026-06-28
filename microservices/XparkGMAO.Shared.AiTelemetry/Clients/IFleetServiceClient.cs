using XparkGMAO.Shared.AiTelemetry.Clients.DTOs;

namespace XparkGMAO.Shared.AiTelemetry.Clients;

public interface IFleetServiceClient
{
    Task<VehicleInfoDto> GetVehicleInfoAsync(long vehiculeId, CancellationToken ct = default);
}
