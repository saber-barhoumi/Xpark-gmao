using AutoMapper;
using Maintenance.API.Data;
using Maintenance.API.DTOs;
using Maintenance.API.Entities;
using Maintenance.API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Maintenance.API.Services;

public class MaintenanceService(
    IInterventionRepository interventionRepo,
    MaintenanceDbContext context,
    IMapper mapper) : IMaintenanceService
{
    public async Task<PaginatedResponseDto<InterventionResponseDto>> GetAllAsync(int page = 1, int pageSize = 20)
    {
        var all  = await interventionRepo.GetAllAsync();
        var list = all.ToList();
        var data = list
            .OrderByDescending(i => i.DateIntervention)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => mapper.Map<InterventionResponseDto>(i));

        return new PaginatedResponseDto<InterventionResponseDto>
        {
            Data = data, TotalCount = list.Count, PageNumber = page, PageSize = pageSize
        };
    }

    public async Task<InterventionResponseDto?> GetByIdAsync(long id)
    {
        var i = await interventionRepo.GetWithDetailsAsync(id);
        return i == null ? null : mapper.Map<InterventionResponseDto>(i);
    }

    public async Task<IEnumerable<InterventionResponseDto>> GetByVehiculeAsync(long vehiculeId)
    {
        var list = await interventionRepo.GetByVehiculeAsync(vehiculeId);
        return list.Select(i => mapper.Map<InterventionResponseDto>(i));
    }

    public async Task<InterventionResponseDto> CreateAsync(CreateInterventionDto dto)
    {
        if (!Enum.TryParse<TypeIntervention>(dto.TypeIntervention, true, out var type))
            throw new ArgumentException($"Type d'intervention invalide: {dto.TypeIntervention}");

        if (dto.TechnicienId.HasValue)
        {
            var date   = DateTime.SpecifyKind(dto.DateIntervention, DateTimeKind.Utc).Date;
            var conflit = await interventionRepo.GetConflictForTechnicienAsync(dto.TechnicienId.Value, date);
            if (conflit != null)
                throw new InvalidOperationException($"Ce technicien a déjà une intervention active le {date:dd/MM/yyyy}.");
        }

        var intervention = new Intervention
        {
            DateIntervention        = DateTime.SpecifyKind(dto.DateIntervention, DateTimeKind.Utc),
            TypeIntervention        = type,
            Description             = dto.Description,
            Cout                    = dto.Cout,
            KilometrageIntervention = dto.KilometrageIntervention,
            VehiculeId              = dto.VehiculeId,
            TechnicienId            = dto.TechnicienId,
            Prestataire             = dto.Prestataire,
            OrdreTravailId          = dto.OrdreTravailId,
            DureeMinutes            = dto.DureeMinutes,
            TypePeriodicite         = dto.TypePeriodicite,
            Statut                  = StatutIntervention.PLANIFIEE,
            DateCreation            = DateTime.UtcNow
        };

        // Vehicle status update must go through Fleet.API — not accessible from here
        var created     = await interventionRepo.AddAsync(intervention);
        var withDetails = await interventionRepo.GetWithDetailsAsync(created.IdIntervention);
        return mapper.Map<InterventionResponseDto>(withDetails ?? created);
    }

    public async Task<bool> UpdateStatutAsync(long id, StatutIntervention statut)
    {
        var intervention = await interventionRepo.GetByIdAsync(id);
        if (intervention == null) return false;

        intervention.Statut = statut;
        if (statut == StatutIntervention.TERMINEE)
            intervention.DateFinIntervention = DateTime.UtcNow;
        // Vehicle status/kilometrage update must go through Fleet.API

        await interventionRepo.UpdateAsync(intervention);
        return true;
    }

    public async Task<bool> DeleteAsync(long id)
    {
        if (!await interventionRepo.ExistsAsync(id)) return false;
        await interventionRepo.DeleteAsync(id);
        return true;
    }
}
