using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using XparkGMAO.Shared.AiTelemetry.Clients.DTOs;

namespace XparkGMAO.Shared.AiTelemetry.Clients;

/// <summary>
/// Typed HttpClient that fetches vehicle telemetry features from Fleet.API.
/// On any network/deserialisation failure, falls back to built-in defaults
/// so that a Fleet.API outage never blocks mission closure.
/// </summary>
public sealed class FleetServiceClient(
    HttpClient http,
    ILogger<FleetServiceClient> logger) : IFleetServiceClient
{
    // Litres/100 km — representative averages per vehicle category (Tunisian fleet context)
    private static readonly Dictionary<string, double> FuelDefaults =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["BERLINE"]    = 7.0,
            ["SUV"]        = 9.5,
            ["CAMION"]     = 18.0,
            ["UTILITAIRE"] = 11.0,
            ["MINIBUS"]    = 12.0,
            ["VAN"]        = 13.0,
            ["MOTO"]       = 4.0,
            ["BUS"]        = 20.0,
        };

    public async Task<VehicleInfoDto> GetVehicleInfoAsync(long vehiculeId, CancellationToken ct = default)
    {
        try
        {
            // Fleet.API must expose GET /api/vehicules/{id}/telemetry
            // returning { vehiculeId, vehicleType, fuelConsumptionPer100Km }
            var dto = await http.GetFromJsonAsync<VehicleInfoDto>(
                $"api/vehicules/{vehiculeId}/telemetry", ct);

            if (dto is not null) return dto;

            logger.LogWarning(
                "Fleet.API returned null for vehiculeId={VehiculeId}. Using defaults.", vehiculeId);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex,
                "Fleet.API unreachable for vehiculeId={VehiculeId}. Using defaults.", vehiculeId);
        }

        return new VehicleInfoDto(vehiculeId, "UNKNOWN", 8.0); // conservative average
    }
}
