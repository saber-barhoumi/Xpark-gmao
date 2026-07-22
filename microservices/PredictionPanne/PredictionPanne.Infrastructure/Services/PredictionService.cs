using Microsoft.EntityFrameworkCore;
using PredictionPanne.Application.DTOs;
using PredictionPanne.Domain.Entities;
using PredictionPanne.Infrastructure.Data;
using PredictionPanne.Infrastructure.Engine;

namespace PredictionPanne.Infrastructure.Services;

/// <summary>
/// Orchestration du module : extraction des caractéristiques depuis la GMAO,
/// appel du moteur (quel qu'il soit), persistance et agrégations d'affichage.
///
/// Ce service ne contient AUCUNE heuristique de prédiction — elles vivent
/// toutes dans <see cref="IPredictionEngine"/>. C'est ce qui permet de changer
/// de moteur sans toucher à cette classe.
/// </summary>
public class PredictionService(
    PredictionDbContext context,
    IPredictionEngine engine,
    ILogger<PredictionService> logger) : IPredictionService
{
    /// <summary>Coût moyen d'une panne évitée — sert à valoriser le module (TND).</summary>
    private const double CoutMoyenPanneEvitee = 1_800;

    // ═══ Recalcul ════════════════════════════════════════════════════════════
    public async Task<RecalculResultatDto> RecalculerAsync()
    {
        var vehicules = await context.Vehicules.AsNoTracking()
            .Where(v => v.Actif)
            .ToListAsync();

        var interventions = await context.Interventions.AsNoTracking().ToListAsync();
        var parVehicule   = interventions.GroupBy(i => i.VehiculeId)
                                         .ToDictionary(g => g.Key, g => g.ToList());

        // Idempotence quotidienne : on remplace les prédictions du jour plutôt
        // que d'empiler des doublons à chaque clic sur « Recalculer ».
        var debutJour = DateTime.UtcNow.Date;
        var duJour = await context.Predictions
            .Where(p => p.DateCalcul >= debutJour)
            .ToListAsync();
        if (duJour.Count > 0) context.Predictions.RemoveRange(duJour);

        var generees = 0;
        foreach (var v in vehicules)
        {
            var features = ConstruireFeatures(v, parVehicule.GetValueOrDefault(v.IdVehicule, []));

            foreach (var p in engine.Predire(features))
            {
                context.Predictions.Add(new Prediction {
                    VehiculeId                 = v.IdVehicule,
                    TypePanne                  = p.TypePanne,
                    NiveauRisque               = p.NiveauRisque,
                    Probabilite                = p.Probabilite,
                    ScoreConfiance             = p.ScoreConfiance,
                    DatePanneEstimee           = p.DatePanneEstimee,
                    DateMaintenanceRecommandee = p.DateMaintenanceRecommandee,
                    DureeVieRestanteJours      = p.DureeVieRestanteJours,
                    KilometrageRestant         = p.KilometrageRestant,
                    PieceARemplacer            = p.PieceARemplacer,
                    Explication                = p.Explication,
                    Recommandation             = p.Recommandation,
                    Source                     = engine.Version.StartsWith("regles")
                                                    ? SourcePrediction.REGLES
                                                    : SourcePrediction.MODELE_ML,
                    VersionModele              = engine.Version,
                    DateCalcul                 = DateTime.UtcNow,
                });
                generees++;
            }
        }

        await context.SaveChangesAsync();
        logger.LogInformation(
            "Prédiction de pannes : {Vehicules} véhicules analysés, {Predictions} prédictions ({Version})",
            vehicules.Count, generees, engine.Version);

        return new RecalculResultatDto(vehicules.Count, generees, engine.Version, DateTime.UtcNow);
    }

    /// <summary>Transforme les données GMAO brutes en vecteur de caractéristiques.</summary>
    private static VehiculeFeatures ConstruireFeatures(VehiculeRef v, List<InterventionRef> interventions)
    {
        var maintenant = DateTime.UtcNow;
        var curatives  = interventions.Where(i => i.TypeIntervention == "CURATIVE").ToList();
        var derniere   = interventions.OrderByDescending(i => i.DateIntervention).FirstOrDefault();

        var historique = interventions
            .GroupBy(i => OrganeClassifier.Classer(i.Description))
            .ToDictionary(g => g.Key, g => g.Count());

        // Km depuis la dernière intervention : à défaut d'historique, on prend
        // le kilométrage total (le véhicule n'a jamais été touché).
        var kmDepuisRevision = derniere != null
            ? Math.Max(0, v.Kilometrage - derniere.KilometrageIntervention)
            : v.Kilometrage;

        return new VehiculeFeatures(
            VehiculeId:                        v.IdVehicule,
            Immatriculation:                   v.Immatriculation,
            Marque:                            v.Marque,
            Modele:                            v.Modele,
            AgeAnnees:                         Math.Max(0, maintenant.Year - v.AnneeConstruction),
            Kilometrage:                       v.Kilometrage,
            NombreInterventions:               interventions.Count,
            NombreInterventionsCuratives:      curatives.Count,
            JoursDepuisDerniereIntervention:   derniere != null
                                                 ? (int)(maintenant - derniere.DateIntervention).TotalDays
                                                 : 9999,
            KilometrageDepuisDerniereRevision: kmDepuisRevision,
            CoutMaintenanceTotal:              interventions.Sum(i => i.Cout),
            PannesRecentes:                    curatives.Count(i => (maintenant - i.DateIntervention).TotalDays <= 180),
            HistoriqueParOrgane:               historique);
    }

    // ═══ Lectures ════════════════════════════════════════════════════════════
    public async Task<IEnumerable<SanteVehiculeDto>> GetSanteFlotteAsync()
    {
        var vehicules = await context.Vehicules.AsNoTracking().Where(v => v.Actif).ToListAsync();
        var dernieres = await ChargerDernieresPredictionsAsync();

        return vehicules
            .Select(v => ConstruireSante(v, dernieres.GetValueOrDefault(v.IdVehicule, [])))
            .OrderBy(s => s.ScoreSante)        // les plus dégradés en tête
            .ToList();
    }

    public async Task<SanteVehiculeDto?> GetSanteVehiculeAsync(long vehiculeId)
    {
        var v = await context.Vehicules.AsNoTracking()
            .FirstOrDefaultAsync(x => x.IdVehicule == vehiculeId);
        if (v == null) return null;

        var dernieres = await ChargerDernieresPredictionsAsync(vehiculeId);
        return ConstruireSante(v, dernieres.GetValueOrDefault(vehiculeId, []));
    }

    public async Task<IEnumerable<PredictionDto>> GetHistoriqueAsync(long vehiculeId, int limite = 50)
    {
        var v = await context.Vehicules.AsNoTracking()
            .FirstOrDefaultAsync(x => x.IdVehicule == vehiculeId);

        var predictions = await context.Predictions.AsNoTracking()
            .Where(p => p.VehiculeId == vehiculeId)
            .OrderByDescending(p => p.DateCalcul)
            .Take(Math.Clamp(limite, 1, 500))
            .ToListAsync();

        return predictions.Select(p => Mapper(p, v));
    }

    public async Task<DashboardDto> GetDashboardAsync()
    {
        var sante = (await GetSanteFlotteAsync()).ToList();

        var aRisque = sante.Count(s => s.NiveauRisque is "ELEVE" or "CRITIQUE");
        var toutes  = sante.SelectMany(s => s.Predictions).ToList();

        var dans30Jours = toutes.Count(p =>
            p.DateMaintenanceRecommandee.HasValue &&
            p.DateMaintenanceRecommandee.Value <= DateTime.UtcNow.AddDays(30));

        var repartitionRisque = new[] { "FAIBLE", "MODERE", "ELEVE", "CRITIQUE" }
            .Select(n => new RepartitionDto(n, sante.Count(s => s.NiveauRisque == n)))
            .ToList();

        var repartitionType = toutes
            .GroupBy(p => p.TypePanne)
            .Select(g => new RepartitionDto(g.Key, g.Count()))
            .OrderByDescending(r => r.Nombre)
            .ToList();

        return new DashboardDto(
            NombreVehiculesAnalyses:  sante.Count,
            NombreVehiculesARisque:   aRisque,
            ScoreSanteMoyen:          sante.Count > 0 ? (int)Math.Round(sante.Average(s => s.ScoreSante)) : 100,
            NombrePredictionsActives: toutes.Count,
            MaintenancesA30Jours:     dans30Jours,
            // Valorisation : une panne évitée = une immobilisation évitée.
            CoutMaintenanceEvitePotentiel: Math.Round(
                toutes.Count(p => p.NiveauRisque is "ELEVE" or "CRITIQUE") * CoutMoyenPanneEvitee),
            RepartitionRisque:    repartitionRisque,
            RepartitionTypePanne: repartitionType,
            ClassementVehicules:  sante.Take(10).ToList());
    }

    // ═══ Helpers ═════════════════════════════════════════════════════════════

    /// <summary>
    /// Dernier lot de prédictions par véhicule. On ne garde que le calcul le
    /// plus récent : les précédents restent en base pour l'historique.
    /// </summary>
    private async Task<Dictionary<long, List<Prediction>>> ChargerDernieresPredictionsAsync(long? vehiculeId = null)
    {
        var query = context.Predictions.AsNoTracking();
        if (vehiculeId.HasValue) query = query.Where(p => p.VehiculeId == vehiculeId.Value);

        var predictions = await query.ToListAsync();

        return predictions
            .GroupBy(p => p.VehiculeId)
            .ToDictionary(
                g => g.Key,
                g => {
                    var dernierCalcul = g.Max(p => p.DateCalcul);
                    // Tolérance d'une minute : un même lot n'a pas un timestamp
                    // strictement identique sur toutes ses lignes.
                    return g.Where(p => (dernierCalcul - p.DateCalcul).TotalMinutes < 1)
                            .OrderByDescending(p => p.Probabilite)
                            .ToList();
                });
    }

    private static SanteVehiculeDto ConstruireSante(VehiculeRef v, List<Prediction> predictions)
    {
        var score  = CalculerScoreSante(predictions);
        var risque = predictions.Count == 0
            ? NiveauRisque.FAIBLE
            : predictions.Max(p => p.NiveauRisque);

        var prochaine = predictions
            .Where(p => p.DateMaintenanceRecommandee.HasValue)
            .OrderBy(p => p.DateMaintenanceRecommandee)
            .FirstOrDefault()?.DateMaintenanceRecommandee;

        var dureeVie = predictions
            .Where(p => p.DureeVieRestanteJours.HasValue)
            .OrderBy(p => p.DureeVieRestanteJours)
            .FirstOrDefault()?.DureeVieRestanteJours;

        return new SanteVehiculeDto(
            VehiculeId:        v.IdVehicule,
            Immatriculation:   v.Immatriculation,
            Marque:            v.Marque,
            Modele:            v.Modele,
            AnneeConstruction: v.AnneeConstruction,
            Kilometrage:       v.Kilometrage,
            ScoreSante:        score,
            NiveauRisque:      risque.ToString(),
            NombrePredictions: predictions.Count,
            ProchaineMaintenanceRecommandee: prochaine,
            DureeVieRestanteJours: dureeVie,
            Predictions:       predictions.Select(p => Mapper(p, v)).ToList());
    }

    /// <summary>
    /// Score de santé 0..100 : on part de 100 et on retire une pénalité par
    /// prédiction, pondérée par le niveau de risque. Un véhicule sans prédiction
    /// vaut 100 — ce qui se lit « aucun signal », pas « garanti sans panne ».
    /// </summary>
    private static int CalculerScoreSante(List<Prediction> predictions)
    {
        if (predictions.Count == 0) return 100;

        var penalite = predictions.Sum(p => p.NiveauRisque switch {
            NiveauRisque.CRITIQUE => 30.0,
            NiveauRisque.ELEVE    => 18.0,
            NiveauRisque.MODERE   => 8.0,
            _                     => 3.0,
        } * p.Probabilite);

        return (int)Math.Round(Math.Clamp(100 - penalite, 0, 100));
    }

    private static PredictionDto Mapper(Prediction p, VehiculeRef? v) => new(
        IdPrediction:    p.IdPrediction,
        VehiculeId:      p.VehiculeId,
        Immatriculation: v?.Immatriculation ?? $"#{p.VehiculeId}",
        Marque:          v?.Marque ?? string.Empty,
        Modele:          v?.Modele ?? string.Empty,
        TypePanne:       p.TypePanne.ToString(),
        NiveauRisque:    p.NiveauRisque.ToString(),
        Probabilite:     p.Probabilite,
        ScoreConfiance:  p.ScoreConfiance,
        DatePanneEstimee:           p.DatePanneEstimee,
        DateMaintenanceRecommandee: p.DateMaintenanceRecommandee,
        DureeVieRestanteJours:      p.DureeVieRestanteJours,
        KilometrageRestant:         p.KilometrageRestant,
        PieceARemplacer: p.PieceARemplacer,
        Explication:     p.Explication,
        Recommandation:  p.Recommandation,
        Source:          p.Source.ToString(),
        VersionModele:   p.VersionModele,
        DateCalcul:      p.DateCalcul);
}
