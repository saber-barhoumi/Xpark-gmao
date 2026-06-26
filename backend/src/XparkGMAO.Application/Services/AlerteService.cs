using AutoMapper;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.GestionAlertes;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Core.Interfaces.Services;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Application.Services;

/// <summary>
/// Service de gestion des alertes
/// </summary>
public class AlerteService : IAlertService
{
    private readonly IAlertRepository _alerteRepository;
    private readonly IVehiculeRepository _vehiculeRepository;
    private readonly IMapper _mapper;
    private readonly XparkDbContext _context;

    public AlerteService(IAlertRepository alerteRepository, IVehiculeRepository vehiculeRepository, IMapper mapper, XparkDbContext context)
    {
        _alerteRepository = alerteRepository;
        _vehiculeRepository = vehiculeRepository;
        _mapper = mapper;
        _context = context;
    }

    public async Task<IEnumerable<AlerteResponseDto>> GetAllAsync()
    {
        var alertes = await _alerteRepository.GetAllSortedAsync();
        return alertes.Select(a => _mapper.Map<AlerteResponseDto>(a));
    }

    public async Task<IEnumerable<AlerteResponseDto>> GetActivesAsync()
    {
        var alertes = await _alerteRepository.GetActivesAsync();
        return alertes.Select(a => _mapper.Map<AlerteResponseDto>(a));
    }

    public async Task<IEnumerable<AlerteResponseDto>> GetByTypeAsync(TypeAlerte type)
    {
        var alertes = await _alerteRepository.GetByTypeAsync(type);
        return alertes.Select(a => _mapper.Map<AlerteResponseDto>(a));
    }

    public async Task<int> CountUnreadAsync()
    {
        return await _alerteRepository.CountByStatutAsync(StatutAlerte.ACTIVE);
    }

    public async Task<bool> MarquerLueAsync(long id)
    {
        var alerte = await _alerteRepository.GetByIdAsync(id);
        if (alerte == null) return false;

        alerte.Statut = StatutAlerte.LUE;
        await _alerteRepository.UpdateAsync(alerte);
        return true;
    }

    public async Task MarquerToutesLuesAsync()
    {
        var actives = await _context.Alertes
            .Where(a => a.Statut == StatutAlerte.ACTIVE)
            .ToListAsync();
        foreach (var a in actives)
            a.Statut = StatutAlerte.LUE;
        await _context.SaveChangesAsync();
    }

    public async Task<bool> MarquerTraiteeAsync(long id)
    {
        var alerte = await _alerteRepository.GetByIdAsync(id);
        if (alerte == null) return false;

        alerte.Statut = StatutAlerte.TRAITEE;
        await _alerteRepository.UpdateAsync(alerte);
        return true;
    }

    public async Task CreateAlertAsync(long? vehiculeId, TypeAlerte type, string message)
    {
        var alerte = new Alerte
        {
            TypeAlerte = type,
            VehiculeId = vehiculeId,
            Message = message,
            Priorite = Priorite.HAUTE,
            Statut = StatutAlerte.ACTIVE,
            DateAlerte = DateTime.UtcNow
        };
        await _alerteRepository.AddAsync(alerte);
    }

    public async Task GenerateAlertesAutomatiquesAsync()
    {
        var vehicules = await _vehiculeRepository.GetAllAsync();

        foreach (var vehicule in vehicules)
        {
            foreach (var assurance in vehicule.Assurances)
            {
                if (assurance.DateFin <= DateTime.UtcNow.AddDays(30))
                {
                    var alerteExistante = (await _alerteRepository.GetByVehiculeAsync(vehicule.IdVehicule))
                        .Any(a => a.TypeAlerte == TypeAlerte.ASSURANCE && a.Statut == StatutAlerte.ACTIVE);

                    if (!alerteExistante)
                    {
                        var alerte = new Alerte
                        {
                            TypeAlerte = TypeAlerte.ASSURANCE,
                            VehiculeId = vehicule.IdVehicule,
                            Message = $"Assurance du véhicule {vehicule.Immatriculation} expire le {assurance.DateFin:dd/MM/yyyy}",
                            Priorite = assurance.DateFin <= DateTime.UtcNow ? Priorite.CRITIQUE : Priorite.HAUTE,
                            DateEcheance = assurance.DateFin,
                            Statut = StatutAlerte.ACTIVE,
                            DateAlerte = DateTime.UtcNow
                        };
                        await _alerteRepository.AddAsync(alerte);
                    }
                }
            }
        }
    }
}
