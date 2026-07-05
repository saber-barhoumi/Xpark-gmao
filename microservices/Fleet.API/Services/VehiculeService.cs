using AutoMapper;
using Fleet.API.Data;
using Fleet.API.DTOs;
using Fleet.API.Entities;
using Fleet.API.Messaging;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Shared.Enums;

namespace Fleet.API.Services;

public class VehiculeService(FleetDbContext context, IMapper mapper,
    IXparkEventBus eventBus, ILogger<VehiculeService> logger) : IVehiculeService
{
    /// <summary>IBOA monitoring event — best effort, never blocks the fleet flow.</summary>
    private async Task PublishFleetEventAsync(string routingKey, string severity, object eventData)
    {
        try { await eventBus.PublishAsync(routingKey, severity, eventData); }
        catch (Exception ex)
        {
            logger.LogWarning("[IBOA] Publication événement {Rk} échouée: {Message}", routingKey, ex.Message);
        }
    }
    public async Task<object> GetAllAsync(int page, int pageSize)
    {
        var query = context.Vehicules.Where(v => v.Actif);
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(v => v.DateCreation)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();
        return new { total, page, pageSize, items = mapper.Map<List<VehiculeDto>>(items) };
    }

    public async Task<VehiculeDto?> GetByIdAsync(long id)
    {
        var v = await context.Vehicules
            .Include(x => x.Assurances).Include(x => x.Documents)
            .Include(x => x.Carburants).Include(x => x.Equipements)
            .FirstOrDefaultAsync(x => x.IdVehicule == id && x.Actif);
        return v == null ? null : mapper.Map<VehiculeDto>(v);
    }

    public async Task<VehiculeDto?> GetByImmatriculationAsync(string immatriculation)
    {
        var v = await context.Vehicules
            .FirstOrDefaultAsync(x => x.Immatriculation == immatriculation && x.Actif);
        return v == null ? null : mapper.Map<VehiculeDto>(v);
    }

    public async Task<object?> GetLatestInfoAsync(long id)
    {
        var v = await context.Vehicules
            .Include(x => x.Assurances.OrderByDescending(a => a.DateFin).Take(1))
            .Include(x => x.Documents.OrderByDescending(d => d.DateExpiration).Take(1))
            .Include(x => x.Carburants.OrderByDescending(c => c.DateRemplissage).Take(1))
            .FirstOrDefaultAsync(x => x.IdVehicule == id && x.Actif);
        if (v == null) return null;

        return new
        {
            v.IdVehicule, v.Immatriculation, v.Marque, v.Modele, Statut = v.Statut.ToString(),
            v.Kilometrage, v.DateProchaineRevision, v.KilometrageProchainRevision,
            DerniereAssurance = v.Assurances.FirstOrDefault() is { } a
                ? new { a.Compagnie, a.NumeroPolice, a.DateFin, EstActive = a.Actif } : null,
            DernierDocument = v.Documents.FirstOrDefault() is { } d
                ? new { TypeDocument = d.TypeDocument.ToString(), d.NumeroDocument, d.DateExpiration } : null,
            DernierCarburant = v.Carburants.FirstOrDefault() is { } c
                ? new { c.DateRemplissage, c.Quantite, c.PrixUnitaire, c.MontantTotal } : null
        };
    }

    public async Task<IEnumerable<VehiculeDto>> GetDisponiblesAsync()
    {
        var list = await context.Vehicules
            .Where(v => v.Actif && v.Statut == StatutVehicule.DISPONIBLE)
            .ToListAsync();
        return mapper.Map<IEnumerable<VehiculeDto>>(list);
    }

    public async Task<VehiculeDto> CreateAsync(CreateVehiculeDto dto)
    {
        if (await context.Vehicules.AnyAsync(v => v.Immatriculation == dto.Immatriculation))
            throw new InvalidOperationException($"Un véhicule avec l'immatriculation '{dto.Immatriculation}' existe déjà.");
        if (await context.Vehicules.AnyAsync(v => v.NumeroChassis == dto.NumeroChassis))
            throw new InvalidOperationException($"Un véhicule avec le numéro de châssis '{dto.NumeroChassis}' existe déjà.");

        var vehicule = new Vehicule
        {
            Marque = dto.Marque, Modele = dto.Modele, NumeroChassis = dto.NumeroChassis,
            Immatriculation = dto.Immatriculation, AnneeConstruction = dto.AnneeConstruction,
            TypeCarburant = dto.TypeCarburant, TypeVehicule = dto.TypeVehicule,
            Kilometrage = dto.Kilometrage, Couleur = dto.Couleur, NombrePlaces = dto.NombrePlaces,
            ConsommationMoyenne = dto.ConsommationMoyenne, DateAcquisition = dto.DateAcquisition,
            ValeurAcquisition = dto.ValeurAcquisition, PuissanceFiscale = dto.PuissanceFiscale,
            DateProchaineRevision = dto.DateProchaineRevision,
            Statut = StatutVehicule.DISPONIBLE, Actif = true, DateCreation = DateTime.UtcNow,
            ChargeUtileKg = dto.ChargeUtileKg
        };

        context.Vehicules.Add(vehicule);
        await context.SaveChangesAsync();

        // ── IBOA monitoring event (FICHE §2.2 xpark.fleet.vehicle-added) ──
        await PublishFleetEventAsync("xpark.fleet.vehicle-added", "LOW", new
        {
            vehicleId = vehicule.IdVehicule,
            immatriculation = vehicule.Immatriculation,
            marque = vehicule.Marque,
            modele = vehicule.Modele,
            typeVehicule = vehicule.TypeVehicule.ToString(),
        });

        return mapper.Map<VehiculeDto>(vehicule);
    }

    public async Task<VehiculeDto?> UpdateAsync(long id, UpdateVehiculeDto dto)
    {
        var vehicule = await context.Vehicules.FirstOrDefaultAsync(v => v.IdVehicule == id && v.Actif);
        if (vehicule == null) return null;

        var previousStatut = vehicule.Statut;

        if (dto.Marque               != null) vehicule.Marque               = dto.Marque;
        if (dto.Modele               != null) vehicule.Modele               = dto.Modele;
        if (dto.Kilometrage          != null) vehicule.Kilometrage          = dto.Kilometrage.Value;
        if (dto.Statut               != null) vehicule.Statut               = dto.Statut.Value;
        if (dto.Couleur              != null) vehicule.Couleur              = dto.Couleur;
        if (dto.ConsommationMoyenne  != null) vehicule.ConsommationMoyenne  = dto.ConsommationMoyenne.Value;
        if (dto.PuissanceFiscale     != null) vehicule.PuissanceFiscale     = dto.PuissanceFiscale.Value;
        if (dto.DateProchaineRevision != null) vehicule.DateProchaineRevision = dto.DateProchaineRevision;
        if (dto.ChargeUtileKg   != null) vehicule.ChargeUtileKg   = dto.ChargeUtileKg.Value;

        await context.SaveChangesAsync();

        // ── IBOA monitoring events on status transitions (FICHE §2.2) ──
        if (dto.Statut != null && dto.Statut.Value != previousStatut)
        {
            var vehicleData = new
            {
                vehicleId = vehicule.IdVehicule,
                immatriculation = vehicule.Immatriculation,
                marque = vehicule.Marque,
                modele = vehicule.Modele,
                typeVehicule = vehicule.TypeVehicule.ToString(),
                kilometrage = vehicule.Kilometrage,
                ancienStatut = previousStatut.ToString(),
                nouveauStatut = vehicule.Statut.ToString(),
            };

            if (vehicule.Statut is StatutVehicule.HORS_SERVICE or StatutVehicule.BESOIN_MAINTENANCE)
                await PublishFleetEventAsync("xpark.fleet.vehicle-breakdown",
                    vehicule.Statut == StatutVehicule.HORS_SERVICE ? "CRITICAL" : "HIGH", vehicleData);
            else if (vehicule.Statut == StatutVehicule.EN_MAINTENANCE)
                await PublishFleetEventAsync("xpark.fleet.maintenance-due", "MEDIUM", vehicleData);
        }

        return mapper.Map<VehiculeDto>(vehicule);
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var vehicule = await context.Vehicules.FirstOrDefaultAsync(v => v.IdVehicule == id && v.Actif);
        if (vehicule == null) return false;
        vehicule.Actif = false;
        await context.SaveChangesAsync();
        return true;
    }
}
