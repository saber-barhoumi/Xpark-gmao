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

    public async Task<bool> SupprimerAsync(long id)
    {
        var alerte = await repo.GetByIdAsync(id);
        if (alerte == null) return false;
        context.Alertes.Remove(alerte);
        await repo.SaveChangesAsync();
        return true;
    }

    public async Task<int> SupprimerPlusieursAsync(IEnumerable<long> ids)
    {
        var liste = ids.Distinct().ToList();
        if (liste.Count == 0) return 0;
        return await context.Alertes.Where(a => liste.Contains(a.IdAlerte)).ExecuteDeleteAsync();
    }

    public async Task<int> SupprimerToutesAsync()
        => await context.Alertes.ExecuteDeleteAsync();

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
        await CheckPermisChauffeursAsync();
        await CheckFacturesEchuesAsync();
        await CheckMissionsSansAffectationAsync();
        await MarquerEnRetardAsync();
    }

    // ── Checks transverses (base partagée xpark_gmao, lecture seule) ─────────
    // Ces domaines (RH, finance, missions) n'exposent pas d'endpoint alert-data :
    // on lit directement les tables partagées, comme le font déjà Mission.API
    // (SupportTickets) et AiTelemetry — même pattern d'architecture.

    private sealed record PermisRow(long IdUtilisateur, string Nom, string Prenom, DateTime? DateExpirationPermis);

    /// <summary>Permis des chauffeurs expirés ou expirant sous 30 jours.</summary>
    private async Task CheckPermisChauffeursAsync()
    {
        var now = DateTime.UtcNow;
        var limite = now.AddDays(30);
        var rows = await context.Database
            .SqlQuery<PermisRow>($@"
                SELECT ""IdUtilisateur"", ""Nom"", ""Prenom"", ""DateExpirationPermis""
                FROM ""Utilisateurs""
                WHERE ""TypeUtilisateur"" = 'Chauffeur'
                  AND ""DateExpirationPermis"" IS NOT NULL
                  AND ""DateExpirationPermis"" <= {limite}")
            .ToListAsync();

        foreach (var r in rows)
        {
            var existe = await context.Alertes.AnyAsync(a =>
                a.ChauffeurId == r.IdUtilisateur
                && a.TypeAlerte == TypeAlerte.EMPLOYE_PERMIS_EXPIRE
                && a.Statut == StatutAlerte.ACTIVE);
            if (existe) continue;

            var diff = (r.DateExpirationPermis!.Value - now).TotalDays;
            var msg = diff <= 0
                ? $"🪪 Le permis de {r.Prenom} {r.Nom} est EXPIRÉ depuis {Math.Abs((int)diff)} jour(s) — chauffeur à retirer des affectations."
                : $"🪪 Le permis de {r.Prenom} {r.Nom} expire dans {(int)diff} jour(s) ({r.DateExpirationPermis:dd/MM/yyyy}).";

            await repo.AddAsync(new Alerte {
                TypeAlerte = TypeAlerte.EMPLOYE_PERMIS_EXPIRE, ChauffeurId = r.IdUtilisateur,
                Priorite = diff <= 0 ? Priorite.CRITIQUE : diff <= 7 ? Priorite.HAUTE : Priorite.MOYENNE,
                Message = msg, DateExpiration = r.DateExpirationPermis, DateCreation = now,
            });
            await repo.SaveChangesAsync();
        }
    }

    private sealed record FactureRow(long IdFacture, string? NumeroFacture, double MontantTTC, DateTime? DateEcheance);

    /// <summary>Factures impayées dont l'échéance est dépassée.</summary>
    private async Task CheckFacturesEchuesAsync()
    {
        var now = DateTime.UtcNow;
        var rows = await context.Database
            .SqlQuery<FactureRow>($@"
                SELECT ""IdFacture"", ""NumeroFacture"", ""MontantTTC"", ""DateEcheance""
                FROM ""Factures""
                WHERE ""Statut"" = 'EN_ATTENTE'
                  AND ""DateEcheance"" IS NOT NULL
                  AND ""DateEcheance"" < {now}")
            .ToListAsync();

        foreach (var r in rows)
        {
            var existe = await context.Alertes.AnyAsync(a =>
                a.EntiteReference == "FACTURE" && a.EntiteReferenceId == r.IdFacture
                && a.TypeAlerte == TypeAlerte.FACTURE_IMPAYEE
                && a.Statut == StatutAlerte.ACTIVE);
            if (existe) continue;

            var retard = (int)(now - r.DateEcheance!.Value).TotalDays;
            await repo.AddAsync(new Alerte {
                TypeAlerte = TypeAlerte.FACTURE_IMPAYEE,
                EntiteReference = "FACTURE", EntiteReferenceId = r.IdFacture,
                Priorite = retard > 30 ? Priorite.CRITIQUE : Priorite.HAUTE,
                Message = $"🧾 Facture {r.NumeroFacture ?? $"#{r.IdFacture}"} impayée : échéance dépassée de {retard} jour(s) ({r.MontantTTC:F2} TND).",
                DateExpiration = r.DateEcheance, DateCreation = now,
            });
            await repo.SaveChangesAsync();
        }
    }

    private sealed record MissionRow(long IdMission, string? VilleDepart, string? VilleArrivee,
                                     string? Destination, DateTime DateDepart, string? ClientNom);

    /// <summary>Missions EN_ATTENTE sans chauffeur dont le départ est sous 24 h (ou dépassé).</summary>
    private async Task CheckMissionsSansAffectationAsync()
    {
        var now = DateTime.UtcNow;
        var limite = now.AddHours(24);
        var rows = await context.Database
            .SqlQuery<MissionRow>($@"
                SELECT ""IdMission"", ""VilleDepart"", ""VilleArrivee"", ""Destination"", ""DateDepart"", ""ClientNom""
                FROM ""Missions""
                WHERE ""Statut"" = 'EN_ATTENTE'
                  AND ""EmployeeId"" IS NULL
                  AND ""DateDepart"" <= {limite}")
            .ToListAsync();

        foreach (var r in rows)
        {
            var existe = await context.Alertes.AnyAsync(a =>
                a.MissionId == r.IdMission
                && a.TypeAlerte == TypeAlerte.MISSION_SANS_AFFECTATION
                && a.Statut == StatutAlerte.ACTIVE);
            if (existe) continue;

            var trajet = $"{r.VilleDepart ?? "—"} → {r.VilleArrivee ?? r.Destination}";
            var enRetard = r.DateDepart <= now;
            var msg = enRetard
                ? $"🚚 Mission #{r.IdMission} ({trajet}{(r.ClientNom is null ? "" : $", client {r.ClientNom}")}) : départ DÉPASSÉ sans chauffeur affecté !"
                : $"🚚 Mission #{r.IdMission} ({trajet}{(r.ClientNom is null ? "" : $", client {r.ClientNom}")}) part dans moins de 24 h sans chauffeur affecté.";

            await repo.AddAsync(new Alerte {
                TypeAlerte = TypeAlerte.MISSION_SANS_AFFECTATION, MissionId = r.IdMission,
                Priorite = enRetard ? Priorite.CRITIQUE : Priorite.HAUTE,
                Message = msg, DateExpiration = r.DateDepart, DateCreation = now,
            });
            await repo.SaveChangesAsync();
        }
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
