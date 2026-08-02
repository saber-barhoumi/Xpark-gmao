using System.Net.Http.Json;
using Alerts.Infrastructure.Data;
using Alerts.Application.DTOs;
using Alerts.Domain.Entities;
using Alerts.Application.Interfaces;
using Alerts.Infrastructure.Repositories;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace Alerts.Infrastructure.Services;

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
        // ── Contrôles métier complémentaires (hub central de notifications) ──
        await CheckDemandesEnAttenteDevisAsync();
        await CheckMissionsLivreesNonFactureesAsync();
        await CheckVehiculesHorsServiceAsync();
        await CheckStockPiecesAsync();
        await CheckEquipementsHorsServiceAsync();
        await CheckComptesEnAttenteAsync();
        await CheckPredictionsCritiquesAsync();
        await MarquerEnRetardAsync();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Contrôles métier complémentaires
    //
    // Même principe que les contrôles existants : lecture de la base partagée,
    // création d'une alerte seulement si une alerte ACTIVE du même type ne
    // couvre pas déjà le sujet (pas de doublon jour après jour).
    // ═══════════════════════════════════════════════════════════════════════

    private sealed record DemandeRow(long IdTransportRequest, string? VilleDepart, string? VilleArrivee,
        string? ClientNom, DateTime DateCreation);

    /// <summary>Demandes de transport laissées sans devis depuis plus de 24 h.</summary>
    private async Task CheckDemandesEnAttenteDevisAsync()
    {
        var now = DateTime.UtcNow;
        var limite = now.AddHours(-24);
        var rows = await context.Database.SqlQuery<DemandeRow>($@"
                SELECT ""IdTransportRequest"", ""VilleDepart"", ""VilleArrivee"", ""ClientNom"", ""DateCreation""
                FROM ""TransportRequests""
                WHERE ""Statut"" = 'PENDING_QUOTATION' AND ""DateCreation"" <= {limite}")
            .ToListAsync();

        foreach (var r in rows)
        {
            var reference = $"DEMANDE-{r.IdTransportRequest}";
            if (await ExisteDejaAsync(TypeAlerte.AUTRE, reference)) continue;

            var jours = (int)(now - r.DateCreation).TotalDays;
            await AjouterAsync(new Alerte
            {
                TypeAlerte = TypeAlerte.AUTRE,
                EntiteReference = reference,
                Priorite = jours >= 3 ? Priorite.HAUTE : Priorite.MOYENNE,
                Message = $"🤝 Demande de transport #{r.IdTransportRequest} " +
                          $"({r.VilleDepart ?? "—"} → {r.VilleArrivee ?? "—"}" +
                          $"{(r.ClientNom is null ? "" : $", {r.ClientNom}")}) sans devis depuis {jours} jour(s).",
                DateCreation = now,
            });
        }
    }

    private sealed record MissionFacturableRow(long IdMission, string? VilleDepart, string? VilleArrivee,
        string? Destination, string? ClientNom, double CoutTotal);

    /// <summary>
    /// Prestations livrées jamais facturées : c'est du chiffre d'affaires qui
    /// dort. Contrôle le plus rentable du lot.
    /// </summary>
    private async Task CheckMissionsLivreesNonFactureesAsync()
    {
        var now = DateTime.UtcNow;
        var rows = await context.Database.SqlQuery<MissionFacturableRow>($@"
                SELECT m.""IdMission"", m.""VilleDepart"", m.""VilleArrivee"", m.""Destination"",
                       m.""ClientNom"", m.""CoutTotal""
                FROM ""Missions"" m
                WHERE m.""Statut"" = 'TERMINEE'
                  AND m.""ClientIdUtilisateur"" IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM ""Factures"" f
                      WHERE f.""MissionId"" = m.""IdMission"" AND f.""Statut"" <> 'ANNULEE')")
            .ToListAsync();

        foreach (var r in rows)
        {
            if (await ExisteDejaMissionAsync(r.IdMission, TypeAlerte.FACTURE_IMPAYEE)) continue;

            var trajet = $"{r.VilleDepart ?? "—"} → {r.VilleArrivee ?? r.Destination ?? "—"}";
            await AjouterAsync(new Alerte
            {
                TypeAlerte = TypeAlerte.FACTURE_IMPAYEE,
                MissionId = r.IdMission,
                Priorite = Priorite.HAUTE,
                Message = $"💰 Mission #{r.IdMission} ({trajet}" +
                          $"{(r.ClientNom is null ? "" : $", {r.ClientNom}")}) livrée mais NON FACTURÉE" +
                          $"{(r.CoutTotal > 0 ? $" — {r.CoutTotal:0} DT à encaisser" : "")}.",
                DateCreation = now,
            });
        }
    }

    private sealed record VehiculeSimpleRow(long IdVehicule, string Immatriculation, string Statut);

    /// <summary>Véhicules hors service ou en panne — capacité de transport perdue.</summary>
    private async Task CheckVehiculesHorsServiceAsync()
    {
        var now = DateTime.UtcNow;
        var rows = await context.Database.SqlQuery<VehiculeSimpleRow>($@"
                SELECT ""IdVehicule"", ""Immatriculation"", ""Statut""
                FROM ""Vehicules""
                WHERE ""Actif"" = true AND ""Statut"" = 'HORS_SERVICE'")
            .ToListAsync();

        foreach (var r in rows)
        {
            if (await ExisteDejaVehiculeAsync(r.IdVehicule, TypeAlerte.VEHICULE_BESOIN_MAINTENANCE)) continue;

            await AjouterAsync(new Alerte
            {
                TypeAlerte = TypeAlerte.VEHICULE_BESOIN_MAINTENANCE,
                VehiculeId = r.IdVehicule,
                Priorite = Priorite.CRITIQUE,
                Message = $"🔧 Véhicule {r.Immatriculation} HORS SERVICE — réaffectez ses missions et ouvrez un ordre de travail.",
                DateCreation = now,
            });
        }
    }

    private sealed record PieceRow(long IdPiece, string Designation, int StockActuel, int StockMinimum);

    /// <summary>Pièces de rechange sous le stock minimum (ou en rupture).</summary>
    private async Task CheckStockPiecesAsync()
    {
        var now = DateTime.UtcNow;
        var rows = await context.Database.SqlQuery<PieceRow>($@"
                SELECT ""IdPiece"", ""Designation"", ""StockActuel"", ""StockMinimum""
                FROM ""PiecesRechange""
                WHERE ""Actif"" = true AND ""StockActuel"" <= ""StockMinimum""")
            .ToListAsync();

        foreach (var r in rows)
        {
            var rupture = r.StockActuel <= 0;
            var type = rupture ? TypeAlerte.STOCK_RUPTURE : TypeAlerte.STOCK_FAIBLE;
            var reference = $"PIECE-{r.IdPiece}";
            if (await ExisteDejaAsync(type, reference)) continue;

            await AjouterAsync(new Alerte
            {
                TypeAlerte = type,
                EntiteReference = reference,
                Priorite = rupture ? Priorite.HAUTE : Priorite.MOYENNE,
                Message = rupture
                    ? $"📦 Pièce « {r.Designation} » en RUPTURE de stock — réapprovisionnement nécessaire."
                    : $"📦 Stock faible : « {r.Designation} » ({r.StockActuel} restant(s), minimum {r.StockMinimum}).",
                DateCreation = now,
            });
        }
    }

    private sealed record EquipementRow(long IdEquipement, string Nom, string Etat);

    /// <summary>Équipements hors service ou à remplacer.</summary>
    private async Task CheckEquipementsHorsServiceAsync()
    {
        var now = DateTime.UtcNow;
        var rows = await context.Database.SqlQuery<EquipementRow>($@"
                SELECT ""IdEquipement"", ""Nom"", ""Etat""
                FROM ""Equipements""
                WHERE ""Etat"" IN ('HorsService', 'ARemplacer')")
            .ToListAsync();

        foreach (var r in rows)
        {
            var horsService = r.Etat == "HorsService";
            var type = horsService ? TypeAlerte.EQUIPEMENT_HORS_SERVICE : TypeAlerte.EQUIPEMENT_A_REMPLACER;
            var reference = $"EQUIPEMENT-{r.IdEquipement}";
            if (await ExisteDejaAsync(type, reference)) continue;

            await AjouterAsync(new Alerte
            {
                TypeAlerte = type,
                EntiteReference = reference,
                Priorite = horsService ? Priorite.HAUTE : Priorite.MOYENNE,
                Message = horsService
                    ? $"🧰 Équipement « {r.Nom} » hors service."
                    : $"🧰 Équipement « {r.Nom} » à remplacer.",
                DateCreation = now,
            });
        }
    }

    private sealed record CompteRow(long IdUtilisateur, string Nom, string Prenom, string Role, DateTime DateCreation);

    /// <summary>
    /// Nouveaux comptes en attente de validation (clients, employés…).
    /// Utilisateurs.Statut est stocké en ENTIER (index de StatutUtilisateur) et
    /// non en texte : EN_ATTENTE vaut 0. Comparer à la chaîne échouerait.
    /// </summary>
    private async Task CheckComptesEnAttenteAsync()
    {
        var now = DateTime.UtcNow;
        const int statutEnAttente = (int)XparkGMAO.Shared.Enums.StatutUtilisateur.EN_ATTENTE;
        var rows = await context.Database.SqlQuery<CompteRow>($@"
                SELECT ""IdUtilisateur"", ""Nom"", ""Prenom"", ""Role"", ""DateCreation""
                FROM ""Utilisateurs""
                WHERE ""Statut"" = {statutEnAttente}")
            .ToListAsync();

        foreach (var r in rows)
        {
            var reference = $"COMPTE-{r.IdUtilisateur}";
            if (await ExisteDejaAsync(TypeAlerte.AUTRE, reference)) continue;

            await AjouterAsync(new Alerte
            {
                TypeAlerte = TypeAlerte.AUTRE,
                EntiteReference = reference,
                UtilisateurId = r.IdUtilisateur,
                Priorite = Priorite.MOYENNE,
                Message = $"👤 Nouveau compte à valider : {r.Prenom} {r.Nom} ({r.Role}).",
                DateCreation = now,
            });
        }
    }

    private sealed record PredictionRow(long IdPrediction, long VehiculeId, string TypePanne,
        string NiveauRisque, string Recommandation);

    /// <summary>Prédictions de panne au niveau CRITIQUE — anticipation d'immobilisation.</summary>
    private async Task CheckPredictionsCritiquesAsync()
    {
        var now = DateTime.UtcNow;
        // Table du module de maintenance prédictive (PredictionsPanne, au
        // singulier — à ne pas confondre avec l'ancienne PredictionsPannes).
        var rows = await context.Database.SqlQuery<PredictionRow>($@"
                SELECT p.""IdPrediction"", p.""VehiculeId"", p.""TypePanne"", p.""NiveauRisque"", p.""Recommandation""
                FROM ""PredictionsPanne"" p
                WHERE p.""NiveauRisque"" = 'CRITIQUE'
                  AND p.""DateCalcul"" >= {now.AddDays(-7)}")
            .ToListAsync();

        foreach (var r in rows)
        {
            var reference = $"PREDICTION-{r.IdPrediction}";
            if (await ExisteDejaAsync(TypeAlerte.MAINTENANCE_REQUISE, reference)) continue;

            await AjouterAsync(new Alerte
            {
                TypeAlerte = TypeAlerte.MAINTENANCE_REQUISE,
                VehiculeId = r.VehiculeId,
                EntiteReference = reference,
                Priorite = Priorite.HAUTE,
                Message = $"🤖 Risque de panne CRITIQUE prévu ({r.TypePanne}) — {r.Recommandation}",
                DateCreation = now,
            });
        }
    }

    // ── Helpers communs aux nouveaux contrôles ──────────────────────────────

    private Task<bool> ExisteDejaAsync(TypeAlerte type, string reference) =>
        context.Alertes.AnyAsync(a => a.EntiteReference == reference
            && a.TypeAlerte == type && a.Statut == StatutAlerte.ACTIVE);

    private Task<bool> ExisteDejaMissionAsync(long missionId, TypeAlerte type) =>
        context.Alertes.AnyAsync(a => a.MissionId == missionId
            && a.TypeAlerte == type && a.Statut == StatutAlerte.ACTIVE);

    private Task<bool> ExisteDejaVehiculeAsync(long vehiculeId, TypeAlerte type) =>
        context.Alertes.AnyAsync(a => a.VehiculeId == vehiculeId
            && a.TypeAlerte == type && a.Statut == StatutAlerte.ACTIVE);

    private async Task AjouterAsync(Alerte a)
    {
        await repo.AddAsync(a);
        await repo.SaveChangesAsync();
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
