using Microsoft.Extensions.Logging;
using XparkGMAO.Shared.AiTelemetry.Clients;
using XparkGMAO.Shared.AiTelemetry.Data;
using XparkGMAO.Shared.AiTelemetry.Entities;

namespace XparkGMAO.Shared.AiTelemetry.Services;

/// <summary>
/// Orchestrates the multi-source data aggregation pipeline and persists
/// the resulting flat ML training row.
///
/// Pipeline per call:
///   1. Fire two parallel HTTP calls (Fleet.API + Finance.API).
///   2. Compute all local features (distance, time decomposition, toll).
///   3. Build the AiTripTrainingData row.
///   4. Save to database.
///
/// External service failures are tolerated: each client falls back to
/// sensible defaults, so the row is always written even during partial outages.
/// </summary>
public sealed class AiDataCollectorService(
    AiTelemetryDbContext          db,
    IFleetServiceClient           fleetClient,
    IFinanceServiceClient         financeClient,
    ILogger<AiDataCollectorService> logger) : IAiDataCollector
{
    // DT flat-rate toll estimate for Tunisian autoroute per round-trip
    private const double TollCostPerTripDt = 12.0;

    public async Task LogMissionDataAsync(
        long     missionId,
        long     vehiculeId,
        long     employeeId,
        double   kilometrageDepart,
        double   kilometrageRetour,
        double   coutTotal,
        string   destination,
        DateTime dateDepart,
        bool     carteAutorouteRemise,
        CancellationToken ct = default)
    {
        // ── Step 1: parallel external calls ─────────────────────────────────
        // Both calls are independent — run concurrently to minimise latency.
        // Individual clients handle their own failures and return defaults.
        var vehicleTask   = fleetClient.GetVehicleInfoAsync(vehiculeId, ct);
        var allowanceTask = financeClient.GetDriverAllowanceAsync(employeeId, ct);

        await Task.WhenAll(vehicleTask, allowanceTask);

        var vehicle   = vehicleTask.Result;
        var allowance = allowanceTask.Result;

        // ── Step 2: local feature extraction ────────────────────────────────

        // Distance — guard against erroneous odometer readings
        double distanceKm = Math.Max(0, kilometrageRetour - kilometrageDepart);

        // ISO day-of-week: Monday=1, Sunday=7
        // DayOfWeek enum: Sunday=0, so we remap Sunday from 0 → 7
        int dayOfWeekIso = dateDepart.DayOfWeek == DayOfWeek.Sunday
            ? 7
            : (int)dateDepart.DayOfWeek;

        int    hourOfDay = dateDepart.Hour;
        string season    = ResolveSeason(dateDepart.Month);

        // Toll approximation — only applies when autoroute card was issued
        double tollCostDt = carteAutorouteRemise ? TollCostPerTripDt : 0.0;

        // ── Step 3: assemble the flat row ────────────────────────────────────
        var row = new AiTripTrainingData
        {
            MissionId               = missionId,
            Destination             = destination,
            DateDepart              = dateDepart,
            DistanceKm              = distanceKm,
            DayOfWeekIso            = dayOfWeekIso,
            HourOfDay               = hourOfDay,
            Season                  = season,
            HasAutoroute            = carteAutorouteRemise,
            EstimatedTollCostDt     = tollCostDt,
            VehiculeId              = vehiculeId,
            VehicleType             = vehicle.VehicleType,
            FuelConsumptionPer100Km = vehicle.FuelConsumptionPer100Km,
            EmployeeId              = employeeId,
            DriverTripAllowanceDt   = allowance.TripAllowanceDt,
            ActualCoutTotal         = coutTotal,
            LoggedAt                = DateTime.UtcNow,
            DataSourceVersion       = "v1",
        };

        // ── Step 4: persist ──────────────────────────────────────────────────
        db.AiTripTrainingData.Add(row);
        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "[AiTelemetry] Row #{RowId} logged — MissionId={MissionId} Dist={Dist}km " +
            "Season={Season} VehicleType={VType} CoutTotal={Cout} DT",
            row.Id, missionId, distanceKm, season, vehicle.VehicleType, coutTotal);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static string ResolveSeason(int month) => month switch
    {
        3 or 4 or 5   => "Spring",
        6 or 7 or 8   => "Summer",
        9 or 10 or 11 => "Autumn",
        _             => "Winter",   // 12, 1, 2
    };
}
