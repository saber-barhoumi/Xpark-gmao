using System.Net.Http.Json;
using Alerts.API.Data;
using Alerts.API.DTOs;
using Alerts.API.Entities;
using Alerts.API.Repositories;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace Alerts.API.Services;

public class AlerteService(
    IAlertRepository repo,
    AlertsDbContext context,
    IMapper mapper,
    ILogger<AlerteService> logger,
    IHttpClientFactory httpClientFactory) : IAlertService
{
    public async Task<IEnumerable<AlerteResponseDto>> GetAllAsync()
    {
        var alertes = await repo.GetAllSortedAsync();
        return mapper.Map<IEnumerable<AlerteResponseDto>>(alertes);
    }

    public async Task<IEnumerable<AlerteResponseDto>> GetNonLuesAsync()
    {
        var alertes = await repo.GetNonLuesAsync();
        return mapper.Map<IEnumerable<AlerteResponseDto>>(alertes);
    }

    public async Task<int> CountNonLuesAsync() => await repo.CountNonLuesAsync();

    public async Task<IEnumerable<AlerteResponseDto>> GetByTypeAsync(string type)
    {
        if (!Enum.TryParse<TypeAlerte>(type, true, out var typeAlerte))
            return Enumerable.Empty<AlerteResponseDto>();
        var alertes = await repo.GetByTypeAsync(typeAlerte);
        return mapper.Map<IEnumerable<AlerteResponseDto>>(alertes);
    }

    public async Task<bool> MarquerLueAsync(long id)
    {
        var alerte = await repo.GetByIdAsync(id);
        if (alerte == null) return false;
        alerte.Statut      = StatutAlerte.LUE;
        alerte.DateLecture = DateTime.UtcNow;
        repo.Update(alerte);
        await repo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MarquerToutesLuesAsync()
    {
        await context.Alertes
            .Where(a => a.Statut == StatutAlerte.ACTIVE)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.Statut, StatutAlerte.LUE));
        return true;
    }

    public async Task<bool> MarquerTraiteeAsync(long id)
    {
        var alerte = await repo.GetByIdAsync(id);
        if (alerte == null) return false;
        alerte.Statut         = StatutAlerte.TRAITEE;
        alerte.DateTraitement = DateTime.UtcNow;
        if (alerte.DateLecture == null) alerte.DateLecture = DateTime.UtcNow;
        repo.Update(alerte);
        await repo.SaveChangesAsync();
        return true;
    }

    public async Task GenerateAlertesAutomatiquesAsync()
    {
        var now       = DateTime.UtcNow;
        var seuilJours = 30;

        List<VehiculeAlertDto> vehicules;
        try
        {
            var client = httpClientFactory.CreateClient("fleet-api");
            vehicules = await client.GetFromJsonAsync<List<VehiculeAlertDto>>("api/vehicules/alert-data")
                        ?? [];
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not reach Fleet.API for vehicle alert data");
            return;
        }

        foreach (var v in vehicules)
        {
            await CheckAssurance(v, now, seuilJours);
            await CheckVignette(v, now, seuilJours);
            await CheckVisiteTechnique(v, now, seuilJours);
            await CheckKilometrageMaintenance(v);
        }
    }

    public async Task RunDailyChecksAsync()
    {
        logger.LogInformation("Running daily alert checks");
        await GenerateAlertesAutomatiquesAsync();
        await MarquerEnRetardAsync();
    }

    private async Task CheckAssurance(VehiculeAlertDto v, DateTime now, int seuilJours)
    {
        if (v.DateAssurance == null) return;
        var diff = (v.DateAssurance.Value - now).TotalDays;
        if (diff > seuilJours) return;

        var existe = await context.Alertes.AnyAsync(a =>
            a.VehiculeId == v.IdVehicule && a.TypeAlerte == TypeAlerte.ASSURANCE_EXPIRATION
            && a.Statut == StatutAlerte.ACTIVE);
        if (existe) return;

        var (priorite, titre, msg) = diff <= 0
            ? (Priorite.CRITIQUE, "Assurance expirée",
               $"L'assurance du véhicule {v.Immatriculation} est expirée depuis {Math.Abs((int)diff)} jour(s).")
            : (diff <= 7 ? Priorite.HAUTE : Priorite.MOYENNE,
               "Assurance bientôt expirée",
               $"L'assurance du véhicule {v.Immatriculation} expire dans {(int)diff} jour(s) ({v.DateAssurance.Value:dd/MM/yyyy}).");

        await repo.AddAsync(new Alerte {
            TypeAlerte = TypeAlerte.ASSURANCE_EXPIRATION, VehiculeId = v.IdVehicule,
            Priorite = priorite, Titre = titre, Message = msg,
            DateExpiration = v.DateAssurance, DateCreation = DateTime.UtcNow
        });
        await repo.SaveChangesAsync();
    }

    private async Task CheckVignette(VehiculeAlertDto v, DateTime now, int seuilJours)
    {
        if (v.DateVignette == null) return;
        var diff = (v.DateVignette.Value - now).TotalDays;
        if (diff > seuilJours) return;

        var existe = await context.Alertes.AnyAsync(a =>
            a.VehiculeId == v.IdVehicule && a.TypeAlerte == TypeAlerte.VIGNETTE_EXPIRATION
            && a.Statut == StatutAlerte.ACTIVE);
        if (existe) return;

        var (priorite, titre, msg) = diff <= 0
            ? (Priorite.CRITIQUE, "Vignette expirée", $"La vignette du véhicule {v.Immatriculation} est expirée.")
            : (Priorite.MOYENNE, "Vignette bientôt expirée",
               $"La vignette du véhicule {v.Immatriculation} expire dans {(int)diff} jour(s).");

        await repo.AddAsync(new Alerte {
            TypeAlerte = TypeAlerte.VIGNETTE_EXPIRATION, VehiculeId = v.IdVehicule,
            Priorite = priorite, Titre = titre, Message = msg,
            DateExpiration = v.DateVignette, DateCreation = DateTime.UtcNow
        });
        await repo.SaveChangesAsync();
    }

    private async Task CheckVisiteTechnique(VehiculeAlertDto v, DateTime now, int seuilJours)
    {
        if (v.DateVisiteTechnique == null) return;
        var diff = (v.DateVisiteTechnique.Value - now).TotalDays;
        if (diff > seuilJours) return;

        var existe = await context.Alertes.AnyAsync(a =>
            a.VehiculeId == v.IdVehicule && a.TypeAlerte == TypeAlerte.VISITE_TECHNIQUE_EXPIRATION
            && a.Statut == StatutAlerte.ACTIVE);
        if (existe) return;

        await repo.AddAsync(new Alerte {
            TypeAlerte = TypeAlerte.VISITE_TECHNIQUE_EXPIRATION, VehiculeId = v.IdVehicule,
            Priorite = diff <= 0 ? Priorite.CRITIQUE : Priorite.HAUTE,
            Titre = diff <= 0 ? "Visite technique expirée" : "Visite technique bientôt requise",
            Message = diff <= 0
                ? $"La visite technique du véhicule {v.Immatriculation} est expirée."
                : $"La visite technique du véhicule {v.Immatriculation} est due dans {(int)diff} jour(s).",
            DateExpiration = v.DateVisiteTechnique, DateCreation = DateTime.UtcNow
        });
        await repo.SaveChangesAsync();
    }

    private async Task CheckKilometrageMaintenance(VehiculeAlertDto v)
    {
        if (v.KilometrageActuel == null || v.KilometrageProchaineMaintenance == null) return;
        if (v.KilometrageActuel < v.KilometrageProchaineMaintenance) return;

        var existe = await context.Alertes.AnyAsync(a =>
            a.VehiculeId == v.IdVehicule && a.TypeAlerte == TypeAlerte.KILOMETRAGE_MAINTENANCE
            && a.Statut == StatutAlerte.ACTIVE);
        if (existe) return;

        await repo.AddAsync(new Alerte {
            TypeAlerte = TypeAlerte.KILOMETRAGE_MAINTENANCE, VehiculeId = v.IdVehicule,
            Priorite = Priorite.HAUTE,
            Titre = "Maintenance par kilométrage requise",
            Message = $"Le véhicule {v.Immatriculation} a atteint {v.KilometrageActuel:N0} km (seuil: {v.KilometrageProchaineMaintenance:N0} km).",
            DateCreation = DateTime.UtcNow
        });
        await repo.SaveChangesAsync();
    }

    private async Task MarquerEnRetardAsync()
    {
        var now = DateTime.UtcNow;
        await context.Alertes
            .Where(a => a.DateExpiration.HasValue && a.DateExpiration < now && a.Statut == StatutAlerte.ACTIVE)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.Priorite, Priorite.CRITIQUE));
    }
}
