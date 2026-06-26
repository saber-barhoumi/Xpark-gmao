using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using XparkGMAO.Core.Entities.GestionAdministrative;
using XparkGMAO.Core.Entities.GestionAlertes;
using XparkGMAO.Core.Interfaces.Services;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.Application.Services;

public class DailyAlertCheckerService : IDailyAlertCheckerService
{
    private readonly XparkDbContext _context;
    private readonly ILogger<DailyAlertCheckerService> _logger;

    public DailyAlertCheckerService(XparkDbContext context, ILogger<DailyAlertCheckerService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task RunAllChecksAsync()
    {
        _logger.LogInformation("Starting daily alert checks...");
        try 
        {
            await CheckVehicleDocumentsAsync();
            await CheckStockPiecesAsync();
            await CheckOverdueOTsAsync();
            await CheckUpcomingInterventionsAsync();
            await CheckEmployeeDocumentsAsync();
            await CheckEquipmentAlertsAsync();
            await CheckMissionAlertsAsync();

            _logger.LogInformation("[AlertChecker] Checks completed at {Time}", DateTime.UtcNow);
        } 
        catch (Exception ex) 
        {
            _logger.LogError(ex, "Error occurred during daily alert checks.");
            throw;
        }
    }

    public async Task CheckVehicleDocumentsAsync()
    {
        var vehicules = await _context.Vehicules
            .Include(v => v.Assurances)
            .Include(v => v.Documents)
            .Where(v => v.Actif == true)
            .ToListAsync();

        foreach (var v in vehicules)
        {
            // --- ASSURANCES ---
            var assuranceActive = v.Assurances
                .Where(a => a.Actif == true)
                .OrderByDescending(a => a.DateFin)
                .FirstOrDefault();

            if (assuranceActive != null)
            {
                int joursRestants = (assuranceActive.DateFin - DateTime.UtcNow).Days;

                if (joursRestants < 0)
                {
                    await CreateAlertIfNotExists(TypeAlerte.VEHICULE_ASSURANCE_EXPIREE,
                        v.IdVehicule,
                        $"⚠️ Véhicule {v.Immatriculation} : assurance expirée depuis {Math.Abs(joursRestants)} jours.",
                        $"/gestion/vehicules", "VEHICULE");
                }
                else if (joursRestants <= 15)
                {
                    await CreateAlertIfNotExists(TypeAlerte.VEHICULE_ASSURANCE_PROCHE,
                        v.IdVehicule,
                        $"⚠️ Véhicule {v.Immatriculation} : l'assurance expire dans {joursRestants} jours.",
                        $"/gestion/vehicules", "VEHICULE");
                }
            }

            // --- VISITE TECHNIQUE ---
            var visite = v.Documents
                .Where(d => d.TypeDocument == TypeDocument.VISITE_TECHNIQUE)
                .OrderByDescending(d => d.DateExpiration)
                .FirstOrDefault();

            if (visite != null)
            {
                int joursVisite = (visite.DateExpiration - DateTime.UtcNow).Days;

                if (joursVisite < 0)
                {
                    await CreateAlertIfNotExists(TypeAlerte.VEHICULE_VISITE_TECHNIQUE_EXPIREE,
                        v.IdVehicule,
                        $"⚠️ Véhicule {v.Immatriculation} : visite technique expirée.",
                        $"/gestion/vehicules", "VEHICULE");
                }
                else if (joursVisite <= 15)
                {
                    await CreateAlertIfNotExists(TypeAlerte.VEHICULE_VISITE_TECHNIQUE_PROCHE,
                        v.IdVehicule,
                        $"⚠️ Véhicule {v.Immatriculation} : visite technique expire dans {joursVisite} jours.",
                        $"/gestion/vehicules", "VEHICULE");
                }
            }

            // --- VIGNETTE ---
            var vignette = v.Documents
                .Where(d => d.TypeDocument == TypeDocument.VIGNETTE)
                .OrderByDescending(d => d.DateExpiration)
                .FirstOrDefault();

            if (vignette != null)
            {
                int joursVignette = (vignette.DateExpiration - DateTime.UtcNow).Days;
                
                if (joursVignette < 0)
                {
                    await CreateAlertIfNotExists(TypeAlerte.VEHICULE_VIGNETTE_EXPIREE,
                        v.IdVehicule,
                        $"⚠️ Véhicule {v.Immatriculation} : vignette expirée.",
                        $"/gestion/vehicules", "VEHICULE");
                }
                else if (joursVignette <= 15)
                {
                    await CreateAlertIfNotExists(TypeAlerte.VEHICULE_VIGNETTE_PROCHE,
                        v.IdVehicule,
                        $"⚠️ Véhicule {v.Immatriculation} : vignette expire dans {joursVignette} jours.",
                        $"/gestion/vehicules", "VEHICULE");
                }
            }

            // --- MAINTENANCE PROCHAINE ---
            if (v.DateProchaineRevision.HasValue)
            {
                int joursMaint = (v.DateProchaineRevision.Value - DateTime.UtcNow).Days;
                if (joursMaint >= 0 && joursMaint <= 7)
                {
                    await CreateAlertIfNotExists(TypeAlerte.VEHICULE_BESOIN_MAINTENANCE,
                        v.IdVehicule,
                        $"🔧 Véhicule {v.Immatriculation} : Date de prochaine révision dans {joursMaint} jours.",
                        $"/gestion/vehicules", "VEHICULE");
                }
                else if (joursMaint < 0)
                {
                    await CreateAlertIfNotExists(TypeAlerte.VEHICULE_BESOIN_MAINTENANCE,
                        v.IdVehicule,
                        $"🔧 Véhicule {v.Immatriculation} : Date de révision dépassée depuis {Math.Abs(joursMaint)} jours.",
                        $"/gestion/vehicules", "VEHICULE");
                }
            }
        }
    }

    public async Task CheckStockPiecesAsync()
    {
        var pieces = await _context.PiecesRechange
            .Where(p => p.Actif == true)
            .ToListAsync();

        foreach (var p in pieces)
        {
            if (p.StockActuel <= 0)
            {
                await CreateAlertIfNotExists(TypeAlerte.STOCK_RUPTURE,
                    p.IdPiece,
                    $"🔴 RUPTURE DE STOCK : {p.Designation} - Quantité = 0",
                    $"/maintenance/pieces-rechange", "STOCK");
            }
            else if (p.StockActuel <= p.StockMinimum)
            {
                await CreateAlertIfNotExists(TypeAlerte.STOCK_FAIBLE,
                    p.IdPiece,
                    $"📦 Stock faible : {p.Designation} - Restant: {p.StockActuel} (Seuil Min: {p.StockMinimum})",
                    $"/maintenance/pieces-rechange", "STOCK");
            }
        }
    }

    public async Task CheckOverdueOTsAsync()
    {
        var overdueOTs = await _context.OrdresTravail
            .Include(ot => ot.Vehicule)
            .Where(ot => ot.Statut != XparkGMAO.Core.Entities.GestionMaintenance.StatutOrdreTravail.TERMINE 
                      && ot.Statut != XparkGMAO.Core.Entities.GestionMaintenance.StatutOrdreTravail.ANNULE
                      && ot.DateFin < DateTime.UtcNow)
            .ToListAsync();

        foreach (var ot in overdueOTs)
        {
            var vehImmat = ot.Vehicule != null ? ot.Vehicule.Immatriculation : "N/A";
            await CreateAlertIfNotExists(TypeAlerte.OT_EN_RETARD,
                ot.IdOrdreTravail,
                $"🔧 Ordre de travail #{ot.IdOrdreTravail} en retard - Véhicule : {vehImmat}",
                $"/maintenance/ordres-travail", "OT");
        }
    }

    public async Task CheckUpcomingInterventionsAsync()
    {
        var tomorrow = DateTime.UtcNow.AddHours(24);
        var interventions = await _context.Interventions
            .Include(i => i.Vehicule)
            // L'entité Intervention a StatutIntervention qui est un Enum, donc on compare avec l'enum.
            .Where(i => i.Statut == XparkGMAO.Core.Entities.GestionMaintenance.StatutIntervention.PLANIFIEE 
                     && i.DateIntervention <= tomorrow
                     && i.DateIntervention >= DateTime.UtcNow)
            .ToListAsync();

        foreach (var i in interventions)
        {
            var vehImmat = i.Vehicule != null ? i.Vehicule.Immatriculation : "N/A";
            await CreateAlertIfNotExists(TypeAlerte.INTERVENTION_UPCOMING,
                i.IdIntervention,
                $"📅 Intervention prévue dans moins de 24h - Véhicule : {vehImmat}",
                $"/maintenance/interventions", "INTERVENTION");
        }
    }

    public async Task CheckEmployeeDocumentsAsync()
    {
        var chauffeurs = await _context.Employees
            .Where(e => e.Post == PostEmployee.CHAUFFEUR && e.Activ == true)
            .ToListAsync();

        foreach (var emp in chauffeurs)
        {
            if (emp.DateExpirationPermis.HasValue)
            {
                int jours = (emp.DateExpirationPermis.Value - DateTime.UtcNow).Days;
                if (jours < 0)
                {
                    await CreateAlertIfNotExists(TypeAlerte.EMPLOYE_PERMIS_EXPIRE,
                        emp.IdEmployee,
                        $"👤 Chauffeur {emp.Prenom} {emp.Name} : Permis expiré depuis {Math.Abs(jours)} jours.",
                        $"/hr/employees", "EMPLOYE");
                }
                else if (jours <= 30)
                {
                    await CreateAlertIfNotExists(TypeAlerte.EMPLOYE_PERMIS_EXPIRE,
                        emp.IdEmployee,
                        $"👤 Chauffeur {emp.Prenom} {emp.Name} : Le permis expire dans {jours} jours.",
                        $"/hr/employees", "EMPLOYE");
                }
            }
        }
    }

    // ── ÉQUIPEMENTS ──────────────────────────────────────────────────

    public async Task CheckEquipmentAlertsAsync()
    {
        var equipements = await _context.Equipements
            .Include(e => e.Contrats)
            .Where(e => e.Actif)
            .ToListAsync();

        foreach (var eq in equipements)
        {
            // 1. Hors Service
            if (eq.Etat == XparkGMAO.Core.Entities.GestionEquipements.EtatEquipement.HorsService)
            {
                await CreateEquipmentAlert(TypeAlerte.EQUIPEMENT_HORS_SERVICE, eq,
                    $"🔴 Équipement hors service : {eq.Nom} ({eq.CodeInventaire})",
                    Priorite.CRITIQUE);
            }

            // 2. À Remplacer
            if (eq.Etat == XparkGMAO.Core.Entities.GestionEquipements.EtatEquipement.ARemplacer)
            {
                await CreateEquipmentAlert(TypeAlerte.EQUIPEMENT_A_REMPLACER, eq,
                    $"⚠️ Remplacement requis : {eq.Nom} ({eq.CodeInventaire}) - {eq.NombreUtilisations} utilisations",
                    Priorite.HAUTE);
            }

            // 3. Garantie expirante (≤ 30 jours)
            if (eq.DateFinGarantie.HasValue)
            {
                int joursGarantie = (eq.DateFinGarantie.Value - DateTime.UtcNow).Days;
                if (joursGarantie < 0)
                {
                    await CreateEquipmentAlert(TypeAlerte.GARANTIE_EXPIREE, eq,
                        $"📋 Garantie expirée : {eq.Nom} - expirée depuis {Math.Abs(joursGarantie)} jours",
                        Priorite.MOYENNE);
                }
                else if (joursGarantie <= 30)
                {
                    await CreateEquipmentAlert(TypeAlerte.GARANTIE_EXPIRANTE, eq,
                        $"📋 Garantie expirante : {eq.Nom} - expire dans {joursGarantie} jours",
                        Priorite.HAUTE);
                }
            }

            // 4. Contrats expirants (≤ 30 jours)
            foreach (var contrat in eq.Contrats.Where(c => c.IsActif))
            {
                int joursContrat = (contrat.DateFinUtc - DateTime.UtcNow).Days;
                if (joursContrat >= 0 && joursContrat <= 30)
                {
                    await CreateEquipmentAlert(TypeAlerte.CONTRAT_EXPIRANT, eq,
                        $"📄 Contrat expirant : {contrat.NomFournisseur} pour {eq.Nom} - expire dans {joursContrat} jours",
                        Priorite.HAUTE);
                }
            }

            // 5. Rotation faible (Mobile > 6 mois sans usage)
            if (eq.Type == XparkGMAO.Core.Entities.GestionEquipements.TypeEquipement.Mobile && eq.NombreUtilisations == 0)
            {
                var moisDepuisCreation = (DateTime.UtcNow - eq.DateCreation).Days / 30;
                if (moisDepuisCreation >= 6)
                {
                    await CreateEquipmentAlert(TypeAlerte.ROTATION_FAIBLE, eq,
                        $"📊 Rotation faible : {eq.Nom} - aucune utilisation depuis {moisDepuisCreation} mois",
                        Priorite.BASSE);
                }
            }
        }

        _logger.LogInformation("[AlertChecker] Equipment checks completed.");
    }

    // ── MISSIONS ──────────────────────────────────────────────────

    public async Task CheckMissionAlertsAsync()
    {
        var missionsEnRetard = await _context.Missions
            .Where(m => m.Statut == XparkGMAO.Core.Entities.GestionOperations.StatutMission.EN_COURS
                     && m.DateRetour.HasValue == false
                     && m.DateDepart < DateTime.UtcNow.AddHours(-24))
            .ToListAsync();

        foreach (var m in missionsEnRetard)
        {
            var joursRetard = (DateTime.UtcNow - m.DateDepart).Days;
            await CreateMissionAlert(TypeAlerte.MISSION_EN_RETARD, m,
                $"🕐 Mission en retard : {m.ObjetMission} - en cours depuis {joursRetard} jours",
                Priorite.HAUTE);
        }

        _logger.LogInformation("[AlertChecker] Mission checks completed.");
    }

    // ── HELPERS ──────────────────────────────────────────────────

    private async Task CreateEquipmentAlert(
        TypeAlerte type, XparkGMAO.Core.Entities.GestionEquipements.Equipement eq,
        string message, Priorite priorite)
    {
        bool exists = await _context.Alertes.AnyAsync(a =>
            a.TypeAlerte == type &&
            a.EquipementId == eq.IdEquipement &&
            a.Statut == StatutAlerte.ACTIVE);
        
        if (!exists)
        {
            _context.Alertes.Add(new Alerte {
                TypeAlerte = type,
                EquipementId = eq.IdEquipement,
                EntiteReferenceId = eq.IdEquipement,
                Message = message,
                EntiteReference = "EQUIPEMENT",
                Priorite = priorite,
                Statut = StatutAlerte.ACTIVE,
                DateAlerte = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
    }

    private async Task CreateMissionAlert(
        TypeAlerte type, XparkGMAO.Core.Entities.GestionOperations.Mission m,
        string message, Priorite priorite)
    {
        bool exists = await _context.Alertes.AnyAsync(a =>
            a.TypeAlerte == type &&
            a.MissionId == m.IdMission &&
            a.Statut == StatutAlerte.ACTIVE);
        
        if (!exists)
        {
            _context.Alertes.Add(new Alerte {
                TypeAlerte = type,
                MissionId = m.IdMission,
                EntiteReferenceId = m.IdMission,
                Message = message,
                EntiteReference = "MISSION",
                Priorite = priorite,
                Statut = StatutAlerte.ACTIVE,
                DateAlerte = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
    }

    private async Task CreateAlertIfNotExists(
        TypeAlerte type, long idReference, string message, 
        string navigationUrl, string module)
    {
        // Deduplication Logic
        bool exists = await _context.Alertes.AnyAsync(a =>
            a.TypeAlerte == type &&
            a.EntiteReferenceId == idReference &&
            a.Statut == StatutAlerte.ACTIVE);
        
        if (!exists)
        {
            _context.Alertes.Add(new Alerte {
                TypeAlerte = type,
                EntiteReferenceId = idReference,
                Message = message,
                EntiteReference = module,
                Statut = StatutAlerte.ACTIVE,
                DateAlerte = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
    }
}
