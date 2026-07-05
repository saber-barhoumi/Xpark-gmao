using AutoMapper;
using Microsoft.Extensions.Logging;
using Mission.API.DTOs;
using Mission.API.Entities;
using Mission.API.Repositories;
using XparkGMAO.Shared.AiTelemetry.Services;
using MissionEntity = Mission.API.Entities.Mission;

namespace Mission.API.Services;

public class MissionService(
    IMissionRepository   missionRepo,
    IMapper              mapper,
    IAiDataCollector     aiCollector,
    ILogger<MissionService> logger) : IMissionService
{
    public async Task<IEnumerable<MissionResponseDto>> GetAllAsync()
    {
        var all = await missionRepo.GetAllAsync();
        var list = new List<MissionResponseDto>();
        foreach (var m in all.OrderByDescending(x => x.DateDepart))
            list.Add(mapper.Map<MissionResponseDto>(m));
        return list;
    }

    public async Task<MissionResponseDto?> GetByIdAsync(long id)
    {
        var mission = await missionRepo.GetWithDetailsAsync(id);
        return mission == null ? null : mapper.Map<MissionResponseDto>(mission);
    }

    public async Task<IEnumerable<MissionResponseDto>> GetByStatutAsync(StatutMission statut)
    {
        var missions = await missionRepo.GetByStatutAsync(statut);
        return missions.Select(m => mapper.Map<MissionResponseDto>(m));
    }

    public async Task<MissionResponseDto> CreateMissionAsync(CreateMissionDto dto)
    {
        // Without vehicle+driver the mission stays EN_ATTENTE — it will be
        // assigned later by OptimisateurFlotteIA (PUT /missions/{id}/assign)
        bool isAssigned = dto.VehiculeId is > 0 && dto.EmployeeId is > 0;

        var mission = new MissionEntity
        {
            DateDepart            = DateTime.SpecifyKind(dto.DateDepart, DateTimeKind.Utc),
            DateRetour            = dto.DateRetour.HasValue
                                        ? DateTime.SpecifyKind(dto.DateRetour.Value, DateTimeKind.Utc)
                                        : null,
            Destination           = dto.Destination,
            KilometrageDepart     = dto.KilometrageDepart,
            ObjetMission          = dto.ObjetMission,
            VehiculeId            = isAssigned ? dto.VehiculeId : null,
            EmployeeId            = isAssigned ? dto.EmployeeId : null,
            Statut                = isAssigned ? StatutMission.EN_COURS : StatutMission.EN_ATTENTE,
            KilometrageRetour     = 0,
            BonCarburantAccorde   = dto.BonCarburantAccorde,
            NumeroBonCarburant    = dto.NumeroBonCarburant,
            VerificationDocuments = dto.VerificationDocuments,
            CarteAutorouteRemise  = dto.CarteAutorouteRemise,
            VehiculeImmatriculation = dto.VehiculeImmatriculation,
            ChauffeurNom            = dto.ChauffeurNom,
            VilleDepart           = dto.VilleDepart,
            VilleArrivee          = dto.VilleArrivee,
            DistanceKm            = dto.DistanceEstimee,
            CoutEstimeAI          = dto.CoutEstime,
            AiVehiculeTypeUsed    = dto.AiVehiculeTypeUsed,
            DateCreation          = DateTime.UtcNow
        };

        var saved       = await missionRepo.AddAsync(mission);
        var withDetails = await missionRepo.GetWithDetailsAsync(saved.IdMission);
        return mapper.Map<MissionResponseDto>(withDetails ?? saved);
    }

    public async Task<MissionResponseDto> CloseMissionAsync(long missionId, double kilometrageRetour)
    {
        var mission = await missionRepo.GetWithDetailsAsync(missionId)
            ?? throw new KeyNotFoundException("Mission introuvable");

        double distance           = kilometrageRetour - mission.KilometrageDepart;
        mission.KilometrageRetour = kilometrageRetour;
        mission.Statut            = StatutMission.TERMINEE;
        mission.DateRetour        = DateTime.UtcNow;
        mission.CoutTotal         = distance * 0.15;

        await missionRepo.UpdateAsync(mission);

        // ── AI Telemetry trigger ──────────────────────────────────────────────
        // Runs AFTER the mission is safely persisted. Any telemetry failure is
        // logged and swallowed — it must never roll back a correctly closed mission.
        try
        {
            await aiCollector.LogMissionDataAsync(
                missionId:            mission.IdMission,
                vehiculeId:           mission.VehiculeId ?? 0,
                employeeId:           mission.EmployeeId ?? 0,
                kilometrageDepart:    mission.KilometrageDepart,
                kilometrageRetour:    kilometrageRetour,
                coutTotal:            mission.CoutTotal,
                destination:          mission.Destination,
                dateDepart:           mission.DateDepart,
                carteAutorouteRemise: mission.CarteAutorouteRemise);
        }
        catch (Exception ex)
        {
            // Telemetry is non-critical — log and continue
            logger.LogError(ex,
                "[AiTelemetry] Logging failed for MissionId={MissionId}. Mission closure is unaffected.",
                missionId);
        }

        return mapper.Map<MissionResponseDto>(mission);
    }

    public async Task<MissionResponseDto> AssignMissionAsync(long missionId, AssignMissionDto dto)
    {
        var mission = await missionRepo.GetWithDetailsAsync(missionId)
            ?? throw new KeyNotFoundException("Mission introuvable");

        if (mission.Statut != StatutMission.EN_ATTENTE)
            throw new InvalidOperationException(
                $"Seules les missions EN_ATTENTE peuvent être affectées (statut actuel: {mission.Statut})");

        mission.VehiculeId              = dto.VehiculeId;
        mission.EmployeeId              = dto.EmployeeId;
        mission.VehiculeImmatriculation = dto.VehiculeImmatriculation ?? mission.VehiculeImmatriculation;
        mission.ChauffeurNom            = dto.ChauffeurNom            ?? mission.ChauffeurNom;
        if (dto.KilometrageDepart is > 0) mission.KilometrageDepart = dto.KilometrageDepart.Value;
        if (dto.CoutEstime        is > 0) mission.CoutEstimeAI      = dto.CoutEstime.Value;
        mission.Statut = StatutMission.EN_COURS;

        await missionRepo.UpdateAsync(mission);

        logger.LogInformation(
            "[Optimisateur] Mission {MissionId} affectée — Vehicule={VehiculeId} ({Immat}), Chauffeur={EmployeeId} ({Nom})",
            missionId, dto.VehiculeId, dto.VehiculeImmatriculation, dto.EmployeeId, dto.ChauffeurNom);

        return mapper.Map<MissionResponseDto>(mission);
    }

    public async Task<bool> CancelMissionAsync(long id)
    {
        var mission = await missionRepo.GetWithDetailsAsync(id);
        if (mission == null || mission.Statut == StatutMission.TERMINEE) return false;

        mission.Statut = StatutMission.ANNULEE;
        await missionRepo.UpdateAsync(mission);
        return true;
    }

    public async Task<bool> DeleteAsync(long id)
    {
        if (!await missionRepo.ExistsAsync(id)) return false;
        await missionRepo.DeleteAsync(id);
        return true;
    }
}
