using AutoMapper;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Core.Interfaces.Services;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Application.Services;

/// <summary>
/// Service de gestion des véhicules
/// </summary>
public class VehiculeService : IVehiculeService
{
    private readonly IVehiculeRepository _vehiculeRepository;
    private readonly IMapper _mapper;
    private readonly XparkDbContext _context;

    public VehiculeService(IVehiculeRepository vehiculeRepository, IMapper mapper, XparkDbContext context)
    {
        _vehiculeRepository = vehiculeRepository;
        _mapper = mapper;
        _context = context;
    }

    public async Task<PaginatedResponseDto<VehiculeResponseDto>> GetAllAsync(int page = 1, int pageSize = 10)
    {
        var all = await _vehiculeRepository.GetAllAsync();
        var list = all.ToList();
        var total = list.Count;
        var data = list
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => _mapper.Map<VehiculeResponseDto>(v));

        return new PaginatedResponseDto<VehiculeResponseDto>
        {
            Data = data,
            TotalCount = total,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<VehiculeResponseDto?> GetByIdAsync(long id)
    {
        var vehicule = await _vehiculeRepository.GetByIdAsync(id);
        return vehicule == null ? null : _mapper.Map<VehiculeResponseDto>(vehicule);
    }

    public async Task<VehiculeResponseDto?> GetByImmatriculationAsync(string immatriculation)
    {
        var vehicule = await _vehiculeRepository.GetByImmatriculationAsync(immatriculation);
        return vehicule == null ? null : _mapper.Map<VehiculeResponseDto>(vehicule);
    }

    public async Task<IEnumerable<VehiculeResponseDto>> GetDisponiblesAsync()
    {
        var vehicules = await _vehiculeRepository.GetDisponiblesAsync();
        return vehicules.Select(v => _mapper.Map<VehiculeResponseDto>(v));
    }

    public async Task<VehiculeResponseDto> CreateAsync(CreateVehiculeDto dto)
    {
        // Vérification des doublons sur l'immatriculation
        var existant = await _vehiculeRepository.GetByImmatriculationAsync(dto.Immatriculation);
        if (existant != null)
            throw new InvalidOperationException($"Un véhicule avec l'immatriculation '{dto.Immatriculation}' existe déjà.");

        // 1. Map base Vehicule fields
        var vehicule = _mapper.Map<Vehicule>(dto);
        vehicule.DateCreation = DateTime.UtcNow;
        vehicule.Statut = StatutVehicule.DISPONIBLE;
        vehicule.Actif = true;

        // Ensure collections are empty before adding manually correctly
        vehicule.Assurances = new List<Assurance>();
        vehicule.Documents = new List<DocumentAdministratif>();

        _context.Vehicules.Add(vehicule);
        await _context.SaveChangesAsync(); // Get the VehiculeId first

        // 2. Add Assurances
        if (dto.Assurances != null && dto.Assurances.Any())
        {
            foreach (var aDto in dto.Assurances)
            {
                var assurance = _mapper.Map<Assurance>(aDto);
                assurance.VehiculeId = vehicule.IdVehicule;
                assurance.DateCreation = DateTime.UtcNow;
                _context.Assurances.Add(assurance);
            }
        }

        // 3. Add Documents
        if (dto.DocumentsAdministratifs != null && dto.DocumentsAdministratifs.Any())
        {
            foreach (var dDto in dto.DocumentsAdministratifs)
            {
                var doc = _mapper.Map<DocumentAdministratif>(dDto);
                doc.VehiculeId = vehicule.IdVehicule;
                doc.DateCreation = DateTime.UtcNow;
                _context.DocumentsAdministratifs.Add(doc);
            }
        }

        // 4. Save changes
        await _context.SaveChangesAsync();

        return _mapper.Map<VehiculeResponseDto>(vehicule);
    }

    public async Task<VehiculeResponseDto?> UpdateAsync(long id, UpdateVehiculeDto dto)
    {
        // 1. Load existing vehicule WITH includes
        var vehicule = await _context.Vehicules
            .Include(v => v.Assurances)
            .Include(v => v.Documents)
            .FirstOrDefaultAsync(v => v.IdVehicule == id && v.Actif);

        if (vehicule == null) return null;

        // 2. Update base fields
        if (dto.Marque != null) vehicule.Marque = dto.Marque;
        if (dto.Modele != null) vehicule.Modele = dto.Modele;
        if (dto.Kilometrage.HasValue) vehicule.Kilometrage = dto.Kilometrage.Value;
        if (dto.Statut.HasValue) vehicule.Statut = dto.Statut.Value;
        if (dto.Couleur != null) vehicule.Couleur = dto.Couleur;
        if (dto.ConsommationMoyenne.HasValue) vehicule.ConsommationMoyenne = dto.ConsommationMoyenne.Value;
        if (dto.PuissanceFiscale.HasValue) vehicule.PuissanceFiscale = dto.PuissanceFiscale.Value;
        if (dto.DateProchaineRevision.HasValue) vehicule.DateProchaineRevision = DateTime.SpecifyKind(dto.DateProchaineRevision.Value, DateTimeKind.Utc);
        // Note: dto (UpdateVehiculeDto) does not contain DateAcquisition or DateDerniereRevision fields.

        // 3. For Assurances — full replace strategy
        if (dto.Assurances != null)
        {
            _context.Assurances.RemoveRange(vehicule.Assurances);
            vehicule.Assurances.Clear();

            foreach (var aDto in dto.Assurances)
            {
                var assurance = _mapper.Map<Assurance>(aDto);
                assurance.VehiculeId = vehicule.IdVehicule;
                assurance.DateCreation = DateTime.UtcNow;
                _context.Assurances.Add(assurance);
            }
        }

        // 4. For DocumentsAdministratifs — full replace strategy
        if (dto.DocumentsAdministratifs != null)
        {
            _context.DocumentsAdministratifs.RemoveRange(vehicule.Documents);
            vehicule.Documents.Clear();

            foreach (var dDto in dto.DocumentsAdministratifs)
            {
                var doc = _mapper.Map<DocumentAdministratif>(dDto);
                doc.VehiculeId = vehicule.IdVehicule;
                doc.DateCreation = DateTime.UtcNow;
                _context.DocumentsAdministratifs.Add(doc);
            }
        }

        // 5. SaveChangesAsync()
        await _context.SaveChangesAsync();

        return _mapper.Map<VehiculeResponseDto>(vehicule);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var exists = await _vehiculeRepository.ExistsAsync(id);
        if (!exists) return false;

        await _vehiculeRepository.DeleteAsync(id);
        return true;
    }

    public async Task<bool> UpdateStatutAsync(long id, StatutVehicule statut)
    {
        var vehicule = await _vehiculeRepository.GetByIdAsync(id);
        if (vehicule == null) return false;

        vehicule.Statut = statut;
        await _vehiculeRepository.UpdateAsync(vehicule);
        return true;
    }

    public async Task<VehiculeLatestInfoDto?> GetLatestInfoAsync(long id)
    {
        var vehicule = await _context.Vehicules.FirstOrDefaultAsync(v => v.IdVehicule == id && v.Actif);
        if (vehicule == null) return null;
        
        // Ensure the ID exists in the base table before finding in sub-tables
        // Note: Using FindAsync on DbContext for the base vehicle for simplicity, 
        // but filtering by Actif is safer via FirstOrDefaultAsync.

        // Get max mileage from Carburants and Missions
        double lastCarburantKm = await _context.Carburants
            .Where(c => c.VehiculeId == id)
            .OrderByDescending(c => c.Kilometrage)
            .Select(c => c.Kilometrage)
            .FirstOrDefaultAsync();

        double lastMissionKm = await _context.Missions
            .Where(m => m.VehiculeId == id)
            .OrderByDescending(m => m.KilometrageRetour)
            .Select(m => m.KilometrageRetour)
            .FirstOrDefaultAsync();

        // Also check the base vehicle mileage
        double currentVehiculeKm = vehicule.Kilometrage;

        return new VehiculeLatestInfoDto
        {
            LastMileage = Math.Max(currentVehiculeKm, Math.Max(lastCarburantKm, lastMissionKm)),
            TypeCarburant = vehicule.TypeCarburant.ToString()
        };
    }
}
