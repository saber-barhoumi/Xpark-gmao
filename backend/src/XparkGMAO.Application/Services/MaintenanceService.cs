using AutoMapper;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.GestionMaintenance;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.Application.Services;

/// <summary>
/// Service de gestion de la maintenance
/// </summary>
public class MaintenanceService : IMaintenanceService
{
    private readonly IInterventionRepository _interventionRepository;
    private readonly IVehiculeRepository _vehiculeRepository;
    private readonly IMapper _mapper;

    public MaintenanceService(
        IInterventionRepository interventionRepository,
        IVehiculeRepository vehiculeRepository,
        IMapper mapper)
    {
        _interventionRepository = interventionRepository;
        _vehiculeRepository = vehiculeRepository;
        _mapper = mapper;
    }

    public async Task<PaginatedResponseDto<InterventionResponseDto>> GetAllAsync(int page = 1, int pageSize = 10)
    {
        var all = await _interventionRepository.GetAllAsync();
        var list = all.ToList();
        var total = list.Count;
        var data = list
            .OrderByDescending(i => i.DateIntervention)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => _mapper.Map<InterventionResponseDto>(i));

        return new PaginatedResponseDto<InterventionResponseDto>
        {
            Data = data,
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<InterventionResponseDto?> GetByIdAsync(long id)
    {
        var intervention = await _interventionRepository.GetWithDetailsAsync(id);
        return intervention == null ? null : _mapper.Map<InterventionResponseDto>(intervention);
    }

    public async Task<IEnumerable<InterventionResponseDto>> GetByVehiculeAsync(long vehiculeId)
    {
        var interventions = await _interventionRepository.GetByVehiculeAsync(vehiculeId);
        return interventions.Select(i => _mapper.Map<InterventionResponseDto>(i));
    }

    public async Task<InterventionResponseDto> CreateAsync(CreateInterventionDto dto)
    {
        if (!Enum.TryParse<TypeIntervention>(dto.TypeIntervention, true, out var typeIntervention))
            throw new ArgumentException($"Type d'intervention invalide: {dto.TypeIntervention}");

        // Règle métier : pas 2 interventions actives pour le même technicien au même moment
        if (dto.TechnicienId.HasValue)
        {
            var dateIntervention = DateTime.SpecifyKind(dto.DateIntervention, DateTimeKind.Utc).Date;
            var conflit = await _interventionRepository.GetConflictForTechnicienAsync(
                dto.TechnicienId.Value, dateIntervention);
            if (conflit != null)
                throw new InvalidOperationException(
                    $"Ce technicien a déjà une intervention active le {dateIntervention:dd/MM/yyyy} (réf. véhicule: {conflit.VehiculeId}).");
        }

        var intervention = new Intervention
        {
            DateIntervention = DateTime.SpecifyKind(dto.DateIntervention, DateTimeKind.Utc),
            TypeIntervention = typeIntervention,
            Description = dto.Description,
            Cout = dto.Cout,
            KilometrageIntervention = dto.KilometrageIntervention,
            VehiculeId = dto.VehiculeId,
            TechnicienId = dto.TechnicienId,
            Prestataire = dto.Prestataire,
            Statut = StatutIntervention.PLANIFIEE,
            DateCreation = DateTime.UtcNow
        };

        // Mettre le véhicule en maintenance
        var vehicule = await _vehiculeRepository.GetByIdAsync(dto.VehiculeId);
        if (vehicule != null)
        {
            vehicule.Statut = Core.Entities.GestionFlotte.StatutVehicule.EN_MAINTENANCE;
            await _vehiculeRepository.UpdateAsync(vehicule);
        }

        var created = await _interventionRepository.AddAsync(intervention);
        
        // Recharger pour obtenir les propriétés de navigation (ex: Vehicule.Immatriculation) pour le mapping AutoMapper
        var createdWithDetails = await _interventionRepository.GetWithDetailsAsync(created.IdIntervention);
        
        return _mapper.Map<InterventionResponseDto>(createdWithDetails);
    }

    public async Task<bool> UpdateStatutAsync(long id, StatutIntervention statut)
    {
        var intervention = await _interventionRepository.GetByIdAsync(id);
        if (intervention == null) return false;

        intervention.Statut = statut;

        if (statut == StatutIntervention.TERMINEE)
        {
            intervention.DateFinIntervention = DateTime.UtcNow;

            // Remettre le véhicule disponible
            var vehicule = await _vehiculeRepository.GetByIdAsync(intervention.VehiculeId);
            if (vehicule != null)
            {
                vehicule.Statut = Core.Entities.GestionFlotte.StatutVehicule.DISPONIBLE;
                vehicule.DateDerniereRevision = DateTime.UtcNow;
                await _vehiculeRepository.UpdateAsync(vehicule);
            }
        }

        await _interventionRepository.UpdateAsync(intervention);
        return true;
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var exists = await _interventionRepository.ExistsAsync(id);
        if (!exists) return false;

        await _interventionRepository.DeleteAsync(id);
        return true;
    }

    public async Task<IEnumerable<PieceRechange>> GetStockFaibleAsync()
    {
        // Retourner les pièces dont le stock est en dessous du minimum
        // Cette méthode nécessite un accès direct au contexte ou un repository dédié
        return Enumerable.Empty<PieceRechange>();
    }

    public async Task<bool> AjouterStockAsync(long pieceId, int quantite)
    {
        // Logique d'ajout de stock - nécessite un repository PieceRechange
        return await Task.FromResult(true);
    }
}
