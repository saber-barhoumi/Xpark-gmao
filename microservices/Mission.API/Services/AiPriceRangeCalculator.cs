namespace Mission.API.Services;

/// <summary>
/// Dérive une fourchette de prix affichable au client à partir de l'estimation
/// ponctuelle de CalculateurPrixTrajetIA (predicted_cost_tnd). L'IA ne sert pas
/// nativement de fourchette — c'est un choix produit ("estimation, pas prix
/// final") appliqué ici, une seule fois, au moment de la soumission de la
/// demande ; la fourchette est ensuite persistée (TransportRequest) pour rester
/// identique côté client et côté admin, même si cette marge change plus tard.
/// </summary>
public static class AiPriceRangeCalculator
{
    public static (double Min, double Max) ComputeRange(double point, double marginPercent = 0.08)
    {
        var margin = Math.Max(0, marginPercent);
        return (Math.Round(point * (1 - margin), 2), Math.Round(point * (1 + margin), 2));
    }
}
