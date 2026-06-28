namespace XparkGMAO.Shared.AiTelemetry.Services;

/// <summary>
/// Contract for the AI training-data collection pipeline.
///
/// IMPORTANT: Implementations must NEVER throw to callers.
/// Any internal failures must be logged and swallowed so that a telemetry
/// outage never rolls back a mission that was correctly closed.
/// </summary>
public interface IAiDataCollector
{
    /// <summary>
    /// Aggregates features from the local mission record and external microservices,
    /// then persists one flat row to AiTripTrainingData.
    ///
    /// Must be called AFTER the mission has been persisted with status TERMINEE
    /// so that CoutTotal and KilometrageRetour are their final values.
    /// </summary>
    Task LogMissionDataAsync(
        long     missionId,
        long     vehiculeId,
        long     employeeId,
        double   kilometrageDepart,
        double   kilometrageRetour,
        double   coutTotal,
        string   destination,
        DateTime dateDepart,
        bool     carteAutorouteRemise,
        CancellationToken ct = default);
}
