using System.Text.Json;
using Microsoft.Extensions.Logging;
using Mission.Application.DTOs;
using Mission.Domain.Entities;
using Mission.Infrastructure.Messaging;
using Mission.Application.Interfaces;
using Mission.Infrastructure.Repositories;

namespace Mission.Infrastructure.Services;

public class OptimizationService(
    IMissionRepository missionRepo,
    IOptimizerEventBus eventBus,
    OptimizationPlanStore planStore,
    ILogger<OptimizationService> logger) : IOptimizationService
{
    public async Task<string> RequestOptimizationAsync(OptimizeRequestDto dto)
    {
        var all = (await missionRepo.GetAllAsync()).ToList();

        // Missions à optimiser: EN_ATTENTE sans affectation
        var pending = all
            .Where(m => m.Statut == StatutMission.EN_ATTENTE
                        && m.EmployeeId == null && m.VehiculeId == null)
            .ToList();

        if (pending.Count == 0)
            throw new InvalidOperationException(
                "Aucune mission EN_ATTENTE sans affectation à optimiser.");

        // Historique 7 jours (charge chauffeurs) + missions planifiées (conflits horaires)
        var weekAgo = DateTime.UtcNow.AddDays(-7);
        var recent = all
            .Where(m => m.Statut != StatutMission.ANNULEE
                        && m.EmployeeId != null
                        && m.DateDepart >= weekAgo)
            .ToList();

        var batchId = $"batch-{DateTime.UtcNow:yyyyMMdd-HHmmss}-{Guid.NewGuid().ToString("N")[..6]}";

        var payload = new
        {
            batchId,
            missions = pending.Select(m => new
            {
                missionId    = m.IdMission,
                villeDepart  = m.VilleDepart ?? "",
                villeArrivee = m.VilleArrivee ?? m.Destination,
                distanceKm   = m.DistanceKm,
                dateDepart   = m.DateDepart,
                requiredVehicleClass = string.IsNullOrEmpty(m.AiVehiculeTypeUsed) ? null : m.AiVehiculeTypeUsed,
                priorite     = "NORMAL",
                objetMission = m.ObjetMission,
            }),
            vehicles = dto.Vehicles,
            drivers  = dto.Drivers,
            recentMissions = recent.Select(m => new
            {
                employeeId = m.EmployeeId,
                vehiculeId = m.VehiculeId,
                dateDepart = m.DateDepart,
                dateRetour = m.DateRetour,
                distanceKm = m.DistanceKm,
                statut     = m.Statut.ToString(),
            }),
        };

        await eventBus.PublishOptimizationRequestedAsync(JsonSerializer.Serialize(payload));

        logger.LogInformation(
            "[Optimisateur] Batch {BatchId} publié — {Missions} missions, {Vehicles} véhicules, {Drivers} chauffeurs, {Recent} historiques",
            batchId, pending.Count, dto.Vehicles.Count, dto.Drivers.Count, recent.Count);

        return batchId;
    }

    public string? GetPlan(string batchId) => planStore.Get(batchId);
}
