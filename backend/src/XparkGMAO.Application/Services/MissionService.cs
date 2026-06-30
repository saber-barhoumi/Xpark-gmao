using AutoMapper;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.GestionOperations;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionAlertes;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.Application.Services;

public class MissionService : IMissionService
{
    private readonly IMissionRepository _missionRepository;
    private readonly IVehiculeRepository _vehiculeRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IAlertRepository _alertRepository;
    private readonly IEquipementsService _equipementsService;
    private readonly IMapper _mapper;

    public MissionService(
        IMissionRepository missionRepository, 
        IVehiculeRepository vehiculeRepository,
        IEmployeeRepository employeeRepository,
        IAlertRepository alertRepository,
        IEquipementsService equipementsService,
        IMapper mapper)
    {
        _missionRepository = missionRepository;
        _vehiculeRepository = vehiculeRepository;
        _employeeRepository = employeeRepository;
        _alertRepository = alertRepository;
        _equipementsService = equipementsService;
        _mapper = mapper;
    }

    public async Task<IEnumerable<MissionResponseDto>> GetAllAsync()
    {
        var all = await _missionRepository.GetAllAsync();
        return _mapper.Map<IEnumerable<MissionResponseDto>>(all.OrderByDescending(m => m.DateDepart));
    }

    public async Task<MissionResponseDto?> GetByIdAsync(long id)
    {
        var mission = await _missionRepository.GetWithDetailsAsync(id);
        return mission == null ? null : _mapper.Map<MissionResponseDto>(mission);
    }

    public async Task<IEnumerable<MissionResponseDto>> GetByStatutAsync(StatutMission statut)
    {
        var missions = await _missionRepository.GetByStatutAsync(statut);
        return _mapper.Map<IEnumerable<MissionResponseDto>>(missions);
    }

    public async Task<MissionResponseDto> CreateMissionAsync(CreateMissionDto dto)
    {
        // 1. Fetch employee by dto.EmployeeId
        var employee = await _employeeRepository.GetByIdAsync(dto.EmployeeId);
        if (employee == null) throw new Exception("Employee not found");

        // 2. If employee.Post != PostEmployee.CHAUFFEUR → throw exception
        if (employee.Post != PostEmployee.CHAUFFEUR) throw new Exception("Employee is not a driver");

        // 3. Fetch vehicle by dto.VehiculeId
        var vehicle = await _vehiculeRepository.GetByIdAsync(dto.VehiculeId);
        if (vehicle == null) throw new Exception("Vehicle not found");

        // 4. If vehicle.Statut != StatutVehicule.DISPONIBLE → throw exception
        if (vehicle.Statut != StatutVehicule.DISPONIBLE) throw new Exception("Vehicle not available");

        // 5. Create and save mission with Statut = EN_COURS
        var mission = _mapper.Map<Mission>(dto);
        mission.Statut = StatutMission.EN_COURS;
        mission.KilometrageRetour = 0; // Initialized
        mission.DateDepart = DateTime.SpecifyKind(dto.DateDepart, DateTimeKind.Utc);
        if (dto.DateRetour.HasValue) mission.DateRetour = DateTime.SpecifyKind(dto.DateRetour.Value, DateTimeKind.Utc);
        
        // Ensure property names match
        mission.EmployeeId = dto.EmployeeId;
        mission.VehiculeId = dto.VehiculeId;
        
        // Checklist Logistique
        mission.BonCarburantAccorde = dto.BonCarburantAccorde;
        mission.NumeroBonCarburant = dto.NumeroBonCarburant;
        mission.VerificationDocuments = dto.VerificationDocuments;
        mission.CarteAutorouteRemise = dto.CarteAutorouteRemise;

        // AI estimation fields
        mission.VilleDepart = dto.VilleDepart;
        mission.VilleArrivee = dto.VilleArrivee;
        mission.DistanceEstimee = dto.DistanceEstimee;
        mission.CoutEstime = dto.CoutEstime;

        var savedMission = await _missionRepository.AddAsync(mission);

        // 6. Set employee.Statut = StatutEmployee.EN_MISSION
        employee.Statut = StatutEmployee.EN_MISSION;
        await _employeeRepository.UpdateAsync(employee);

        // 7. Set vehicle.Statut = StatutVehicule.EN_MISSION
        vehicle.Statut = StatutVehicule.EN_MISSION;
        await _vehiculeRepository.UpdateAsync(vehicle);

        // 8. Automated Equipment CheckOut
        await _equipementsService.CheckOutAutomatiqueAsync(mission.VehiculeId, savedMission.IdMission, mission.EmployeeId);

        return _mapper.Map<MissionResponseDto>(savedMission);
    }

    public async Task<MissionResponseDto> CloseMissionAsync(long missionId, double kilometrageRetour)
    {
        // 1. Get mission with includes (Employee, Vehicule)
        var mission = await _missionRepository.GetWithDetailsAsync(missionId);
        if (mission == null) throw new Exception("Mission not found");

        var vehicle = mission.Vehicule;
        var employee = mission.Employee;

        // 2. Set mission.KilometrageRetour = kilometrageRetour
        mission.KilometrageRetour = kilometrageRetour;

        // 3. double distance = kilometrageRetour - mission.KilometrageDepart
        double distance = kilometrageRetour - mission.KilometrageDepart;

        // 4. mission.Statut = StatutMission.TERMINEE
        mission.Statut = StatutMission.TERMINEE;

        // 5. mission.DateRetour = DateTime.Now
        mission.DateRetour = DateTime.UtcNow;

        // 6. vehicle.Kilometrage = kilometrageRetour
        vehicle.Kilometrage = kilometrageRetour;

        // 7. vehicle.Statut = StatutVehicule.DISPONIBLE
        vehicle.Statut = StatutVehicule.DISPONIBLE;

        // 8. employee.Statut = StatutEmployee.DISPONIBLE
        employee.Statut = StatutEmployee.DISPONIBLE;

        // 9. mission.CoutTotal = distance * 0.15
        mission.CoutTotal = distance * 0.15;

        // 10. MAINTENANCE CHECK
        if (vehicle.Kilometrage % 10000 <= distance || 
            (vehicle.DateProchaineRevision.HasValue && vehicle.DateProchaineRevision <= DateTime.UtcNow.AddDays(7)))
        {
            var alert = new Alerte
            {
                Message = $"Vehicle {vehicle.Immatriculation} requires maintenance",
                TypeAlerte = TypeAlerte.MAINTENANCE_DUE,
                Statut = StatutAlerte.ACTIVE,
                DateAlerte = DateTime.UtcNow,
                VehiculeId = vehicle.IdVehicule,
                Priorite = Priorite.HAUTE
            };
            await _alertRepository.AddAsync(alert);
            vehicle.Statut = StatutVehicule.BESOIN_MAINTENANCE;
        }

        // 11. SaveChanges
        await _missionRepository.UpdateAsync(mission);
        await _vehiculeRepository.UpdateAsync(vehicle);
        await _employeeRepository.UpdateAsync(employee);

        // 12. Automated Equipment CheckIn
        await _equipementsService.CheckInAutomatiqueAsync(missionId, employee.IdEmployee);

        return _mapper.Map<MissionResponseDto>(mission);
    }

    public async Task<bool> CancelMissionAsync(long id)
    {
        var mission = await _missionRepository.GetWithDetailsAsync(id);
        if (mission == null || mission.Statut == StatutMission.TERMINEE) return false;

        mission.Statut = StatutMission.ANNULEE;
        mission.Vehicule.Statut = StatutVehicule.DISPONIBLE;
        mission.Employee.Statut = StatutEmployee.DISPONIBLE;

        await _missionRepository.UpdateAsync(mission);
        await _vehiculeRepository.UpdateAsync(mission.Vehicule);
        await _employeeRepository.UpdateAsync(mission.Employee);
        return true;
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var exists = await _missionRepository.ExistsAsync(id);
        if (!exists) return false;

        await _missionRepository.DeleteAsync(id);
        return true;
    }
}
