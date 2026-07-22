using PredictionPanne.Application.DTOs;

namespace PredictionPanne.Application.Interfaces;

/// <summary>
/// ═══ POINT D'INTÉGRATION DU MODÈLE IA ═══
///
/// Contrat du moteur de prédiction. C'est la seule abstraction à réimplémenter
/// le jour où un modèle entraîné remplace les règles métier.
///
/// L'entrée (<see cref="VehiculeFeatures"/>) est déjà un vecteur de
/// caractéristiques : elle est pensée pour être sérialisée telle quelle vers un
/// service Python (comme CalculateurPrixTrajetIA / OptimisateurFlotteIA le font
/// déjà dans ce projet), sans toucher au reste du service.
///
/// Pour brancher un modèle :
///   1. écrire `MlPredictionEngine : IPredictionEngine` dans Infrastructure,
///      qui POSTe les features vers le service ML et désérialise la réponse ;
///   2. changer UNE ligne dans DependencyInjection ;
///   3. renseigner <see cref="Version"/> (ex. « xgboost-v1 ») — les prédictions
///      persistées gardent la version qui les a produites, ce qui permet de
///      comparer objectivement les deux générations sur l'historique.
///
/// Aucun contrôleur, DTO d'API ni schéma de base n'a besoin de changer.
/// </summary>
public interface IPredictionEngine
{
    /// <summary>Identifiant de version, stocké sur chaque prédiction produite.</summary>
    string Version { get; }

    /// <summary>
    /// Produit 0..n prédictions pour un véhicule. Retourner une liste vide est
    /// légitime : cela signifie « aucun signal de défaillance détecté ».
    /// </summary>
    IEnumerable<PredictionCalculee> Predire(VehiculeFeatures features);
}
