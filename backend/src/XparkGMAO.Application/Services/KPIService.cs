using Microsoft.EntityFrameworkCore;
using XparkGMAO.Infrastructure.Data;
using XparkGMAO.Core.Entities.Dashboard;
using XparkGMAO.Core.Entities.GestionOperations;
using XparkGMAO.Core.Entities.GestionFlotte;
using XparkGMAO.Core.Entities.GestionFinance;
using XparkGMAO.Core.Entities.GestionMaintenance;
using System.Text.Json;

namespace XparkGMAO.Application.Services
{
    public interface IKPIService
    {
        Task<List<KPI>> CalculerTousKPIsAsync();
        Task<KPI> CalculerKPIAsync(string codeKPI);
        Task<List<KPI>> GetKPIsParCategorieAsync(CategorieKPI categorie);
        Task<KPI> GetDernierKPIAsync(string codeKPI);
    }

    public class KPIService : IKPIService
    {
        private readonly XparkDbContext _context;

        public KPIService(XparkDbContext context)
        {
            _context = context;
        }

        public async Task<List<KPI>> CalculerTousKPIsAsync()
        {
            var kpis = new List<KPI>();

            // KPIs MISSIONS
            kpis.Add(await CalculerMissionsActives());
            kpis.Add(await CalculerMissionsMoisCourant());
            kpis.Add(await CalculerTauxReussite());

            // KPIs FLOTTE
            kpis.Add(await CalculerVehiculesDisponibles());
            kpis.Add(await CalculerVehiculesEnMaintenance());
            kpis.Add(await CalculerTauxUtilisationFlotte());

            // KPIs FINANCE
            kpis.Add(await CalculerRevenusMoisCourant());
            kpis.Add(await CalculerCoutsMoisCourant());
            kpis.Add(await CalculerMargeNette());

            // KPIs MAINTENANCE
            kpis.Add(await CalculerInterventionsEnCours());
            kpis.Add(await CalculerCoutMaintenanceMois());
            kpis.Add(await CalculerPiecesSousStock());

            // KPIs CARBURANT
            kpis.Add(await CalculerConsommationMoyenne());
            kpis.Add(await CalculerCoutCarburantMois());

            // Sauvegarder tous les KPIs
            _context.KPIs.AddRange(kpis);
            await _context.SaveChangesAsync();

            return kpis;
        }

        // ========== KPIs MISSIONS ==========

        private async Task<KPI> CalculerMissionsActives()
        {
            var valeur = await _context.Missions
                .Where(m => m.Statut == StatutMission.EN_COURS)
                .CountAsync();

            var objectif = 50.0; // Objectif : 50 missions actives

            return new KPI
            {
                CodeKPI = "MISSIONS_ACTIVES",
                Nom = "Missions Actives",
                Valeur = valeur,
                Unite = "missions",
                Objectif = objectif,
                Tendance = await CalculerTendance("MISSIONS_ACTIVES", valeur),
                Categorie = CategorieKPI.MISSIONS,
                Icone = "ri-truck-line",
                Couleur = valeur >= objectif ? "success" : "warning",
                Description = "Nombre de missions en cours d'exécution",
                DateCalcul = DateTime.UtcNow
            };
        }

        private async Task<KPI> CalculerMissionsMoisCourant()
        {
            var debutMois = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            
            var valeur = await _context.Missions
                .Where(m => m.DateDepart >= debutMois)
                .CountAsync();

            var objectif = 100.0; // Objectif : 100 missions/mois

            return new KPI
            {
                CodeKPI = "MISSIONS_MOIS",
                Nom = "Missions ce mois",
                Valeur = valeur,
                Unite = "missions",
                Objectif = objectif,
                Tendance = await CalculerTendance("MISSIONS_MOIS", valeur),
                Categorie = CategorieKPI.MISSIONS,
                Icone = "ri-calendar-line",
                Couleur = "primary",
                Description = "Nombre total de missions démarrées ce mois",
                DateCalcul = DateTime.UtcNow
            };
        }

        private async Task<KPI> CalculerTauxReussite()
        {
            var debutMois = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            
            var totalMissions = await _context.Missions
                .Where(m => m.DateDepart >= debutMois && 
                           (m.Statut == StatutMission.TERMINEE || m.Statut == StatutMission.ANNULEE))
                .CountAsync();

            var missionsReussies = await _context.Missions
                .Where(m => m.DateDepart >= debutMois && m.Statut == StatutMission.TERMINEE)
                .CountAsync();

            var valeur = totalMissions > 0 
                ? Math.Round((double)missionsReussies / totalMissions * 100, 2) 
                : 0;

            return new KPI
            {
                CodeKPI = "TAUX_REUSSITE_MISSIONS",
                Nom = "Taux de Réussite",
                Valeur = valeur,
                Unite = "%",
                Objectif = 95.0,
                Tendance = await CalculerTendance("TAUX_REUSSITE_MISSIONS", valeur),
                Categorie = CategorieKPI.MISSIONS,
                Icone = "ri-check-double-line",
                Couleur = valeur >= 90 ? "success" : "danger",
                Description = "Pourcentage de missions terminées avec succès",
                DateCalcul = DateTime.UtcNow
            };
        }

        // ========== KPIs FLOTTE ==========

        private async Task<KPI> CalculerVehiculesDisponibles()
        {
            var valeur = await _context.Vehicules
                .Where(v => v.Statut == StatutVehicule.DISPONIBLE && v.Actif)
                .CountAsync();

            var totalVehicules = await _context.Vehicules.Where(v => v.Actif).CountAsync();

            return new KPI
            {
                CodeKPI = "VEHICULES_DISPONIBLES",
                Nom = "Véhicules Disponibles",
                Valeur = valeur,
                Unite = "véhicules",
                Objectif = totalVehicules * 0.8, // 80% de la flotte disponible
                Tendance = await CalculerTendance("VEHICULES_DISPONIBLES", valeur),
                Categorie = CategorieKPI.FLOTTE,
                Icone = "ri-car-line",
                Couleur = "success",
                Description = "Véhicules prêts à être assignés",
                DateCalcul = DateTime.UtcNow
            };
        }

        private async Task<KPI> CalculerVehiculesEnMaintenance()
        {
            var valeur = await _context.Vehicules
                .Where(v => v.Statut == StatutVehicule.EN_MAINTENANCE)
                .CountAsync();

            return new KPI
            {
                CodeKPI = "VEHICULES_MAINTENANCE",
                Nom = "En Maintenance",
                Valeur = valeur,
                Unite = "véhicules",
                Objectif = null,
                Tendance = await CalculerTendance("VEHICULES_MAINTENANCE", valeur),
                Categorie = CategorieKPI.FLOTTE,
                Icone = "ri-tools-line",
                Couleur = "warning",
                Description = "Véhicules actuellement en maintenance",
                DateCalcul = DateTime.UtcNow
            };
        }

        private async Task<KPI> CalculerTauxUtilisationFlotte()
        {
            var totalVehicules = await _context.Vehicules.Where(v => v.Actif).CountAsync();
            var vehiculesEnMission = await _context.Vehicules
                .Where(v => v.Statut == StatutVehicule.EN_MISSION)
                .CountAsync();

            var valeur = totalVehicules > 0 
                ? Math.Round((double)vehiculesEnMission / totalVehicules * 100, 2) 
                : 0;

            return new KPI
            {
                CodeKPI = "TAUX_UTILISATION_FLOTTE",
                Nom = "Taux d'Utilisation",
                Valeur = valeur,
                Unite = "%",
                Objectif = 75.0,
                Tendance = await CalculerTendance("TAUX_UTILISATION_FLOTTE", valeur),
                Categorie = CategorieKPI.FLOTTE,
                Icone = "ri-dashboard-line",
                Couleur = valeur >= 70 ? "success" : "warning",
                Description = "Pourcentage de véhicules en mission",
                DateCalcul = DateTime.UtcNow
            };
        }

        // ========== KPIs FINANCE ==========

        private async Task<KPI> CalculerRevenusMoisCourant()
        {
            var debutMois = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            
            var valeur = await _context.Factures
                .Where(f => f.DateEmission >= debutMois && f.Statut == StatutFacture.PAYEE)
                .SumAsync(f => (double?)f.MontantTTC) ?? 0;

            return new KPI
            {
                CodeKPI = "REVENUS_MOIS",
                Nom = "Revenus du Mois",
                Valeur = Math.Round(valeur, 2),
                Unite = "TND",
                Objectif = 50000.0,
                Tendance = await CalculerTendance("REVENUS_MOIS", valeur),
                Categorie = CategorieKPI.FINANCE,
                Icone = "ri-money-dollar-circle-line",
                Couleur = "success",
                Description = "Total des factures payées ce mois",
                DateCalcul = DateTime.UtcNow
            };
        }

        private async Task<KPI> CalculerCoutsMoisCourant()
        {
            var debutMois = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            
            var coutMaintenance = await _context.Interventions
                .Where(i => i.DateIntervention >= debutMois)
                .SumAsync(i => (double?)i.Cout) ?? 0;

            var coutCarburant = await _context.Carburants
                .Where(c => c.DateRemplissage >= debutMois)
                .SumAsync(c => (double?)c.MontantTotal) ?? 0;

            var valeur = Math.Round(coutMaintenance + coutCarburant, 2);

            return new KPI
            {
                CodeKPI = "COUTS_MOIS",
                Nom = "Coûts du Mois",
                Valeur = valeur,
                Unite = "TND",
                Objectif = null,
                Tendance = await CalculerTendance("COUTS_MOIS", valeur),
                Categorie = CategorieKPI.FINANCE,
                Icone = "ri-wallet-3-line",
                Couleur = "danger",
                Description = "Total des dépenses (maintenance + carburant)",
                DateCalcul = DateTime.UtcNow
            };
        }

        private async Task<KPI> CalculerMargeNette()
        {
            var revenusResponse = await CalculerRevenusMoisCourant();
            var coutsResponse = await CalculerCoutsMoisCourant();
            
            var revenus = revenusResponse.Valeur;
            var couts = coutsResponse.Valeur;
            var marge = revenus - couts;
            var pourcentage = revenus > 0 ? Math.Round((marge / revenus) * 100, 2) : 0;

            return new KPI
            {
                CodeKPI = "MARGE_NETTE",
                Nom = "Marge Nette",
                Valeur = pourcentage,
                Unite = "%",
                Objectif = 30.0,
                Tendance = await CalculerTendance("MARGE_NETTE", pourcentage),
                Categorie = CategorieKPI.FINANCE,
                Icone = "ri-line-chart-line",
                Couleur = pourcentage >= 25 ? "success" : "warning",
                Description = "Marge bénéficiaire nette du mois",
                DateCalcul = DateTime.UtcNow,
                DonneesJson = JsonSerializer.Serialize(new { revenus, couts, marge })
            };
        }

        // ========== KPIs MAINTENANCE ==========

        private async Task<KPI> CalculerInterventionsEnCours()
        {
            var valeur = await _context.Interventions
                .Where(i => i.Statut == StatutIntervention.EN_COURS)
                .CountAsync();

            return new KPI
            {
                CodeKPI = "INTERVENTIONS_EN_COURS",
                Nom = "Interventions en Cours",
                Valeur = valeur,
                Unite = "interventions",
                Objectif = null,
                Tendance = await CalculerTendance("INTERVENTIONS_EN_COURS", valeur),
                Categorie = CategorieKPI.MAINTENANCE,
                Icone = "ri-tools-fill",
                Couleur = "info",
                Description = "Interventions actuellement en cours",
                DateCalcul = DateTime.UtcNow
            };
        }

        private async Task<KPI> CalculerCoutMaintenanceMois()
        {
            var debutMois = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            
            var valeur = await _context.Interventions
                .Where(i => i.DateIntervention >= debutMois)
                .SumAsync(i => (double?)i.Cout) ?? 0;

            return new KPI
            {
                CodeKPI = "COUT_MAINTENANCE_MOIS",
                Nom = "Coût Maintenance",
                Valeur = Math.Round(valeur, 2),
                Unite = "TND",
                Objectif = 15000.0,
                Tendance = await CalculerTendance("COUT_MAINTENANCE_MOIS", valeur),
                Categorie = CategorieKPI.MAINTENANCE,
                Icone = "ri-money-euro-circle-line",
                Couleur = "warning",
                Description = "Total dépenses maintenance ce mois",
                DateCalcul = DateTime.UtcNow
            };
        }

        private async Task<KPI> CalculerPiecesSousStock()
        {
            var valeur = await _context.PiecesRechange
                .Where(p => p.StockActuel < p.StockMinimum)
                .CountAsync();

            return new KPI
            {
                CodeKPI = "PIECES_SOUS_STOCK",
                Nom = "Pièces Sous Stock",
                Valeur = valeur,
                Unite = "pièces",
                Objectif = 0,
                Tendance = await CalculerTendance("PIECES_SOUS_STOCK", valeur),
                Categorie = CategorieKPI.MAINTENANCE,
                Icone = "ri-alert-line",
                Couleur = valeur > 0 ? "danger" : "success",
                Description = "Pièces de rechange en rupture de stock",
                DateCalcul = DateTime.UtcNow
            };
        }

        // ========== KPIs CARBURANT ==========

        private async Task<KPI> CalculerConsommationMoyenne()
        {
            var debutMois = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            
            var carburants = await _context.Carburants
                .Where(c => c.DateRemplissage >= debutMois)
                .OrderBy(c => c.VehiculeId)
                .ThenBy(c => c.DateRemplissage)
                .ToListAsync();

            // Calculer consommation moyenne en L/100km
            double totalConsommation = 0;
            int nbCalculs = 0;

            var parVehicule = carburants.GroupBy(c => c.VehiculeId);
            foreach (var groupe in parVehicule)
            {
                var pleins = groupe.OrderBy(c => c.DateRemplissage).ToList();
                for (int i = 1; i < pleins.Count; i++)
                {
                    var kmParcourus = pleins[i].Kilometrage - pleins[i - 1].Kilometrage;
                    if (kmParcourus > 0)
                    {
                        var conso = (pleins[i].Quantite / kmParcourus) * 100;
                        totalConsommation += conso;
                        nbCalculs++;
                    }
                }
            }

            var valeur = nbCalculs > 0 ? Math.Round(totalConsommation / nbCalculs, 2) : 0;

            return new KPI
            {
                CodeKPI = "CONSOMMATION_MOYENNE",
                Nom = "Consommation Moyenne",
                Valeur = valeur,
                Unite = "L/100km",
                Objectif = 8.0,
                Tendance = await CalculerTendance("CONSOMMATION_MOYENNE", valeur),
                Categorie = CategorieKPI.CARBURANT,
                Icone = "ri-gas-station-line",
                Couleur = valeur <= 8 ? "success" : "warning",
                Description = "Consommation moyenne de la flotte",
                DateCalcul = DateTime.UtcNow
            };
        }

        private async Task<KPI> CalculerCoutCarburantMois()
        {
            var debutMois = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            
            var valeur = await _context.Carburants
                .Where(c => c.DateRemplissage >= debutMois)
                .SumAsync(c => (double?)c.MontantTotal) ?? 0;

            // Top 5 véhicules par coût
            var top5 = await _context.Carburants
                .Where(c => c.DateRemplissage >= debutMois)
                .GroupBy(c => c.Vehicule.Immatriculation)
                .Select(g => new { Label = g.Key, Value = Math.Round(g.Sum(c => c.MontantTotal), 2) })
                .OrderByDescending(x => x.Value)
                .Take(5)
                .ToListAsync();

            return new KPI
            {
                CodeKPI = "COUT_CARBURANT_MOIS",
                Nom = "Coût Carburant",
                Valeur = Math.Round(valeur, 2),
                Unite = "TND",
                Objectif = 20000.0,
                Tendance = await CalculerTendance("COUT_CARBURANT_MOIS", valeur),
                Categorie = CategorieKPI.CARBURANT,
                Icone = "ri-refund-2-line",
                Couleur = "info",
                Description = "Total dépenses carburant ce mois",
                DateCalcul = DateTime.UtcNow,
                DonneesJson = JsonSerializer.Serialize(top5)
            };
        }

        // ========== HELPERS ==========

        private async Task<TendanceKPI> CalculerTendance(string codeKPI, double valeurActuelle)
        {
            // Récupérer le KPI le plus récent avant celui-ci
            var kpiPrecedent = await _context.KPIs
                .Where(k => k.CodeKPI == codeKPI)
                .OrderByDescending(k => k.DateCalcul)
                .FirstOrDefaultAsync();

            if (kpiPrecedent == null)
                return TendanceKPI.STABLE;

            var difference = valeurActuelle - kpiPrecedent.Valeur;
            var seuil = Math.Abs(kpiPrecedent.Valeur * 0.05); // 5% de variation

            if (Math.Abs(difference) < (seuil > 0 ? seuil : 0.01))
                return TendanceKPI.STABLE;

            return difference > 0 ? TendanceKPI.HAUSSE : TendanceKPI.BAISSE;
        }

        public async Task<KPI> CalculerKPIAsync(string codeKPI)
        {
            switch (codeKPI)
            {
                case "MISSIONS_ACTIVES": return await CalculerMissionsActives();
                case "MISSIONS_MOIS": return await CalculerMissionsMoisCourant();
                case "TAUX_REUSSITE_MISSIONS": return await CalculerTauxReussite();
                case "VEHICULES_DISPONIBLES": return await CalculerVehiculesDisponibles();
                case "VEHICULES_MAINTENANCE": return await CalculerVehiculesEnMaintenance();
                case "TAUX_UTILISATION_FLOTTE": return await CalculerTauxUtilisationFlotte();
                case "REVENUS_MOIS": return await CalculerRevenusMoisCourant();
                case "COUTS_MOIS": return await CalculerCoutsMoisCourant();
                case "MARGE_NETTE": return await CalculerMargeNette();
                case "INTERVENTIONS_EN_COURS": return await CalculerInterventionsEnCours();
                case "COUT_MAINTENANCE_MOIS": return await CalculerCoutMaintenanceMois();
                case "PIECES_SOUS_STOCK": return await CalculerPiecesSousStock();
                case "CONSOMMATION_MOYENNE": return await CalculerConsommationMoyenne();
                case "COUT_CARBURANT_MOIS": return await CalculerCoutCarburantMois();
                default:
                    throw new NotImplementedException($"Calcul du KPI {codeKPI} non implémenté");
            }
        }

        public async Task<List<KPI>> GetKPIsParCategorieAsync(CategorieKPI categorie)
        {
            // Récupérer les KPIs les plus récents pour chaque CodeKPI de la catégorie
            var codes = await _context.KPIs
                .Where(k => k.Categorie == categorie)
                .Select(k => k.CodeKPI)
                .Distinct()
                .ToListAsync();

            var result = new List<KPI>();
            foreach (var code in codes)
            {
                var kpi = await _context.KPIs
                    .Where(k => k.Categorie == categorie && k.CodeKPI == code)
                    .OrderByDescending(k => k.DateCalcul)
                    .FirstOrDefaultAsync();
                
                if (kpi != null) result.Add(kpi);
            }

            return result;
        }

        public async Task<KPI> GetDernierKPIAsync(string codeKPI)
        {
            return await _context.KPIs
                .Where(k => k.CodeKPI == codeKPI)
                .OrderByDescending(k => k.DateCalcul)
                .FirstOrDefaultAsync();
        }
    }
}
