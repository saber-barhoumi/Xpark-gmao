using PredictionPanne.Application.DTOs;
using PredictionPanne.Domain.Entities;

namespace PredictionPanne.Infrastructure.Engine;

/// <summary>
/// Moteur de prédiction par RÈGLES MÉTIER — implémentation par défaut de
/// <see cref="IPredictionEngine"/>.
///
/// Honnêteté intellectuelle : ce n'est PAS un modèle appris. C'est un ensemble
/// d'heuristiques de maintenance (usure kilométrique, vieillissement,
/// récurrence de pannes par organe, retard de révision) calculées sur les
/// données réelles de la GMAO. L'intérêt est double :
///   - le module est utile immédiatement, sans jeu d'entraînement ;
///   - chaque prédiction est EXPLICABLE, ce qu'un modèle appris ne donne pas
///     gratuitement — et l'explication est justement ce qu'un exploitant
///     attend pour décider d'immobiliser un véhicule.
///
/// Il produit exactement le même contrat qu'un futur modèle ML
/// (<see cref="PredictionCalculee"/>), d'où la substituabilité.
/// </summary>
public class RuleBasedPredictionEngine : IPredictionEngine
{
    public string Version => "regles-v1";

    // ── Seuils métier (constantes nommées : lisibles et ajustables) ──────────
    private const double KmRevision           = 15_000;  // périodicité de révision
    private const double KmDureeVieMoteur     = 400_000; // fin de vie moteur typique
    private const int    AgeVieillissement    = 8;       // années avant usure accélérée
    private const double KmParJourEstime      = 120;     // roulage moyen d'un poids lourd

    // Kilométrage d'usure typique par organe (base des prédictions d'usure).
    private static readonly Dictionary<TypePanne, (double KmUsure, string Piece)> UsureOrganes = new()
    {
        [TypePanne.FREINS]          = (60_000,  "Plaquettes et disques de frein"),
        [TypePanne.PNEUMATIQUES]    = (70_000,  "Jeu de pneumatiques"),
        [TypePanne.TRANSMISSION]    = (180_000, "Kit d'embrayage"),
        [TypePanne.SUSPENSION]      = (120_000, "Amortisseurs"),
        [TypePanne.REFROIDISSEMENT] = (150_000, "Durites et thermostat"),
        [TypePanne.MOTEUR]          = (250_000, "Kit de distribution"),
    };

    public IEnumerable<PredictionCalculee> Predire(VehiculeFeatures f)
    {
        var predictions = new List<PredictionCalculee>();

        // La confiance dépend de la richesse de l'historique : prédire sur un
        // véhicule sans historique est possible, mais on l'assume mal assuré.
        var confiance = CalculerConfiance(f);

        // ── Règle 1 : usure par organe ───────────────────────────────────────
        foreach (var (organe, (kmUsure, piece)) in UsureOrganes)
        {
            var dejaVu   = f.HistoriqueParOrgane.GetValueOrDefault(organe, 0);
            // Km parcourus depuis la dernière intervention sur cet organe.
            // Sans historique de l'organe, on part du kilométrage total.
            var kmDepuis = dejaVu > 0
                ? f.KilometrageDepuisDerniereRevision
                : f.Kilometrage;

            var ratio = kmDepuis / kmUsure;
            if (ratio < 0.55) continue;   // pas encore de signal

            // Probabilité qui croît avec le dépassement, plafonnée à 0,95.
            var probabilite = Math.Min(0.95, ratio * 0.6);
            // Le vieillissement du véhicule aggrave l'usure mécanique.
            if (f.AgeAnnees > AgeVieillissement) probabilite = Math.Min(0.95, probabilite * 1.15);

            var kmRestant   = Math.Max(0, kmUsure - kmDepuis);
            var joursRestant = (int)Math.Max(1, kmRestant / KmParJourEstime);

            predictions.Add(new PredictionCalculee(
                TypePanne:    organe,
                NiveauRisque: RisqueDepuisProbabilite(probabilite),
                Probabilite:  Arrondi(probabilite),
                ScoreConfiance: confiance,
                DatePanneEstimee:           DateTime.UtcNow.AddDays(joursRestant),
                // On recommande d'intervenir à 80 % du délai restant : agir
                // avant la panne est tout l'objet du module.
                DateMaintenanceRecommandee: DateTime.UtcNow.AddDays(Math.Max(1, (int)(joursRestant * 0.8))),
                DureeVieRestanteJours: joursRestant,
                KilometrageRestant:    Math.Round(kmRestant),
                PieceARemplacer:       piece,
                Explication: $"{Libelle(organe)} : {kmDepuis:N0} km parcourus pour une usure " +
                             $"typique à {kmUsure:N0} km ({ratio * 100:N0} % du seuil)" +
                             (dejaVu > 0 ? $", {dejaVu} intervention(s) déjà enregistrée(s) sur cet organe" : "") +
                             (f.AgeAnnees > AgeVieillissement ? $", véhicule de {f.AgeAnnees} ans (usure accélérée)" : "") + ".",
                Recommandation: kmRestant <= 0
                    ? $"Seuil d'usure dépassé : planifier le remplacement ({piece.ToLowerInvariant()}) sans attendre."
                    : $"Planifier le remplacement ({piece.ToLowerInvariant()}) sous {joursRestant} jours (~{kmRestant:N0} km)."));
        }

        // ── Règle 2 : récurrence de pannes (fiabilité dégradée) ──────────────
        if (f.PannesRecentes >= 2)
        {
            // Organe le plus problématique de l'historique.
            var organeCritique = f.HistoriqueParOrgane.Count > 0
                ? f.HistoriqueParOrgane.OrderByDescending(kv => kv.Value).First().Key
                : TypePanne.AUTRE;

            var probabilite = Math.Min(0.95, 0.35 + f.PannesRecentes * 0.12);
            var jours = Math.Max(7, 90 - f.PannesRecentes * 10);

            predictions.Add(new PredictionCalculee(
                TypePanne:    organeCritique,
                NiveauRisque: RisqueDepuisProbabilite(probabilite),
                Probabilite:  Arrondi(probabilite),
                ScoreConfiance: Math.Min(0.9, confiance + 0.1), // beaucoup d'historique = plus sûr
                DatePanneEstimee:           DateTime.UtcNow.AddDays(jours),
                DateMaintenanceRecommandee: DateTime.UtcNow.AddDays(Math.Max(1, jours / 2)),
                DureeVieRestanteJours: jours,
                KilometrageRestant:    Math.Round(jours * KmParJourEstime),
                PieceARemplacer:       null,
                Explication: $"Fiabilité dégradée : {f.PannesRecentes} panne(s) curative(s) sur les " +
                             $"180 derniers jours, dont {f.HistoriqueParOrgane.GetValueOrDefault(organeCritique, 0)} " +
                             $"sur {Libelle(organeCritique).ToLowerInvariant()}. " +
                             $"Coût de maintenance cumulé : {f.CoutMaintenanceTotal:N0} TND.",
                Recommandation: "Diagnostic approfondi recommandé : la répétition des pannes suggère " +
                                "une cause racine non traitée."));
        }

        // ── Règle 3 : révision en retard ─────────────────────────────────────
        if (f.KilometrageDepuisDerniereRevision > KmRevision)
        {
            var depassement = f.KilometrageDepuisDerniereRevision - KmRevision;
            var probabilite = Math.Min(0.9, 0.3 + depassement / KmRevision * 0.3);

            predictions.Add(new PredictionCalculee(
                TypePanne:    TypePanne.MOTEUR,
                NiveauRisque: RisqueDepuisProbabilite(probabilite),
                Probabilite:  Arrondi(probabilite),
                ScoreConfiance: confiance,
                DatePanneEstimee:           DateTime.UtcNow.AddDays(60),
                DateMaintenanceRecommandee: DateTime.UtcNow.AddDays(7),
                DureeVieRestanteJours: 60,
                KilometrageRestant:    null,
                PieceARemplacer:       "Huile moteur et filtres",
                Explication: $"Révision en retard : {f.KilometrageDepuisDerniereRevision:N0} km depuis la " +
                             $"dernière intervention, soit {depassement:N0} km au-delà de la périodicité " +
                             $"de {KmRevision:N0} km.",
                Recommandation: "Programmer la révision sous 7 jours (vidange + filtres)."));
        }

        // ── Règle 4 : fin de vie du véhicule ─────────────────────────────────
        if (f.Kilometrage > KmDureeVieMoteur * 0.85 || f.AgeAnnees >= 15)
        {
            var probabilite = Math.Min(0.95, 0.5 + f.Kilometrage / KmDureeVieMoteur * 0.3);
            var kmRestant   = Math.Max(0, KmDureeVieMoteur - f.Kilometrage);

            predictions.Add(new PredictionCalculee(
                TypePanne:    TypePanne.MOTEUR,
                NiveauRisque: NiveauRisque.CRITIQUE,
                Probabilite:  Arrondi(probabilite),
                ScoreConfiance: confiance,
                DatePanneEstimee:           DateTime.UtcNow.AddDays((int)Math.Max(30, kmRestant / KmParJourEstime)),
                DateMaintenanceRecommandee: DateTime.UtcNow.AddDays(30),
                DureeVieRestanteJours: (int)Math.Max(30, kmRestant / KmParJourEstime),
                KilometrageRestant:    Math.Round(kmRestant),
                PieceARemplacer:       null,
                Explication: $"Véhicule en fin de cycle : {f.Kilometrage:N0} km et {f.AgeAnnees} ans " +
                             $"d'âge. Au-delà de {KmDureeVieMoteur:N0} km, le coût de maintenance " +
                             $"dépasse généralement la valeur résiduelle.",
                Recommandation: "Évaluer le remplacement du véhicule plutôt qu'une réparation lourde."));
        }

        // On ne garde que le risque le plus élevé par organe : afficher deux
        // prédictions pour le même organe n'aide pas l'exploitant à décider.
        return predictions
            .GroupBy(p => p.TypePanne)
            .Select(g => g.OrderByDescending(p => p.Probabilite).First())
            .OrderByDescending(p => p.Probabilite);
    }

    /// <summary>Plus l'historique est fourni, plus l'estimation est fiable.</summary>
    private static double CalculerConfiance(VehiculeFeatures f)
    {
        var confiance = 0.45;                                   // socle : peu de données
        if (f.NombreInterventions >= 3)  confiance += 0.15;
        if (f.NombreInterventions >= 10) confiance += 0.10;
        if (f.Kilometrage > 0)           confiance += 0.10;
        if (f.JoursDepuisDerniereIntervention < 180) confiance += 0.10;
        return Arrondi(Math.Min(0.9, confiance));               // jamais 100 % : ce sont des règles
    }

    private static NiveauRisque RisqueDepuisProbabilite(double p) => p switch
    {
        >= 0.80 => NiveauRisque.CRITIQUE,
        >= 0.60 => NiveauRisque.ELEVE,
        >= 0.40 => NiveauRisque.MODERE,
        _       => NiveauRisque.FAIBLE,
    };

    private static string Libelle(TypePanne t) => t switch
    {
        TypePanne.MOTEUR          => "Moteur",
        TypePanne.FREINS          => "Système de freinage",
        TypePanne.PNEUMATIQUES    => "Pneumatiques",
        TypePanne.TRANSMISSION    => "Transmission",
        TypePanne.SUSPENSION      => "Suspension",
        TypePanne.ELECTRIQUE      => "Circuit électrique",
        TypePanne.REFROIDISSEMENT => "Refroidissement",
        TypePanne.CLIMATISATION   => "Climatisation",
        _                         => "Organe non identifié",
    };

    private static double Arrondi(double d) => Math.Round(d, 2);
}
