namespace XparkGMAO.Shared.AiTelemetry.Entities;

/// <summary>
/// One flat row per completed mission — designed to be exported directly as a CSV
/// for ML model training (trip price prediction).
///
/// Design rules:
///   - Zero navigation properties (no EF relations, no FKs in DB).
///   - Every column is a primitive scalar usable as a feature or label.
///   - Naming mirrors future CSV column headers.
/// </summary>
public class AiTripTrainingData
{
    public long Id { get; set; }

    // ── Mission identity ─────────────────────────────────────────────────────
    public long     MissionId   { get; set; }
    public string   Destination { get; set; } = string.Empty;
    public DateTime DateDepart  { get; set; }

    // ── Feature: distance ────────────────────────────────────────────────────
    /// <summary>KilometrageRetour - KilometrageDepart (always >= 0).</summary>
    public double DistanceKm { get; set; }

    // ── Features: time decomposition (from DateDepart) ───────────────────────
    /// <summary>ISO day-of-week: Monday=1 … Sunday=7.</summary>
    public int    DayOfWeekIso { get; set; }

    /// <summary>Hour of departure in local time: 0–23.</summary>
    public int    HourOfDay    { get; set; }

    /// <summary>Spring | Summer | Autumn | Winter</summary>
    public string Season       { get; set; } = string.Empty;

    // ── Features: logistic flags ─────────────────────────────────────────────
    /// <summary>Whether an autoroute card was issued for this trip.</summary>
    public bool   HasAutoroute          { get; set; }

    /// <summary>Flat DT toll estimate based on autoroute card usage.</summary>
    public double EstimatedTollCostDt   { get; set; }

    // ── Features: vehicle profile (fetched from Fleet.API) ───────────────────
    public long   VehiculeId              { get; set; }

    /// <summary>BERLINE | SUV | CAMION | UTILITAIRE | MINIBUS | VAN | MOTO | BUS</summary>
    public string VehicleType             { get; set; } = string.Empty;

    /// <summary>Average litres per 100 km for this vehicle model.</summary>
    public double FuelConsumptionPer100Km { get; set; }

    // ── Features: driver cost (fetched from Finance / IAM) ───────────────────
    public long   EmployeeId            { get; set; }

    /// <summary>Per-trip allowance paid to the driver in DT.</summary>
    public double DriverTripAllowanceDt { get; set; }

    // ── TARGET LABEL ─────────────────────────────────────────────────────────
    /// <summary>The real final cost of the trip — what the ML model must learn to predict.</summary>
    public double ActualCoutTotal { get; set; }

    // ── Audit ─────────────────────────────────────────────────────────────────
    public DateTime LoggedAt          { get; set; } = DateTime.UtcNow;

    /// <summary>Schema version — bump when columns change so training pipelines can filter.</summary>
    public string DataSourceVersion   { get; set; } = "v1";
}
