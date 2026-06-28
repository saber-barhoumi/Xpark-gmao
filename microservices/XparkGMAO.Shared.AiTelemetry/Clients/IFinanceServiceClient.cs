using XparkGMAO.Shared.AiTelemetry.Clients.DTOs;

namespace XparkGMAO.Shared.AiTelemetry.Clients;

public interface IFinanceServiceClient
{
    Task<DriverAllowanceDto> GetDriverAllowanceAsync(long employeeId, CancellationToken ct = default);
}
