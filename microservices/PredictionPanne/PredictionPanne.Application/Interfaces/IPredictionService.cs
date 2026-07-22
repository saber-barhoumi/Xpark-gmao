using PredictionPanne.Application.DTOs;

namespace PredictionPanne.Application.Interfaces;

/// <summary>Cas d'usage du module de prédiction de pannes.</summary>
public interface IPredictionService
{
    /// <summary>KPIs, répartitions et classement pour le tableau de bord.</summary>
    Task<DashboardDto> GetDashboardAsync();

    /// <summary>Santé de tous les véhicules actifs, triée du plus risqué au moins risqué.</summary>
    Task<IEnumerable<SanteVehiculeDto>> GetSanteFlotteAsync();

    /// <summary>Santé détaillée d'un véhicule. Null si le véhicule n'existe pas.</summary>
    Task<SanteVehiculeDto?> GetSanteVehiculeAsync(long vehiculeId);

    /// <summary>Historique des prédictions d'un véhicule (les plus récentes d'abord).</summary>
    Task<IEnumerable<PredictionDto>> GetHistoriqueAsync(long vehiculeId, int limite = 50);

    /// <summary>
    /// Relance le moteur sur tout le parc et persiste les résultats.
    /// Idempotent par jour : deux appels le même jour remplacent les prédictions
    /// du jour au lieu de les empiler.
    /// </summary>
    Task<RecalculResultatDto> RecalculerAsync();
}
