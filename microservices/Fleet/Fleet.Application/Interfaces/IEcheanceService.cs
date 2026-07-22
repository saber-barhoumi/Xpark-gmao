using Fleet.Application.DTOs;

namespace Fleet.Application.Interfaces;

/// <summary>
/// Port de lecture des échéances de flotte. Volontairement séparé de
/// <see cref="IDocumentService"/> et <see cref="IAssuranceService"/> : ceux-ci
/// pilotent le cycle de vie d'un agrégat, alors qu'ici on ne fait qu'une
/// projection transverse en lecture seule destinée au calendrier métier.
/// </summary>
public interface IEcheanceService
{
    /// <param name="start">Borne basse d'expiration (incluse). Null = pas de borne.</param>
    /// <param name="end">Borne haute d'expiration (incluse). Null = pas de borne.</param>
    Task<IEnumerable<EcheanceDto>> GetEcheancesAsync(DateTime? start, DateTime? end);
}
