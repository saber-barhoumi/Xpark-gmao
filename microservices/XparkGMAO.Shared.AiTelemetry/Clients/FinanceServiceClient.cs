using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using XparkGMAO.Shared.AiTelemetry.Clients.DTOs;

namespace XparkGMAO.Shared.AiTelemetry.Clients;

/// <summary>
/// Typed HttpClient that fetches driver per-trip allowance from Finance.API.
/// Falls back to a configurable default so Finance.API downtime never blocks mission closure.
/// </summary>
public sealed class FinanceServiceClient(
    HttpClient http,
    ILogger<FinanceServiceClient> logger) : IFinanceServiceClient
{
    private const double DefaultAllowanceDt = 15.0; // 15 DT per trip — Tunisian fleet standard

    public async Task<DriverAllowanceDto> GetDriverAllowanceAsync(long employeeId, CancellationToken ct = default)
    {
        try
        {
            // Finance.API must expose GET /api/employees/{id}/allowance
            // returning { employeeId, tripAllowanceDt }
            var dto = await http.GetFromJsonAsync<DriverAllowanceDto>(
                $"api/employees/{employeeId}/allowance", ct);

            if (dto is not null) return dto;

            logger.LogWarning(
                "Finance.API returned null for employeeId={EmployeeId}. Using default allowance.", employeeId);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex,
                "Finance.API unreachable for employeeId={EmployeeId}. Using default allowance.", employeeId);
        }

        return new DriverAllowanceDto(employeeId, DefaultAllowanceDt);
    }
}
