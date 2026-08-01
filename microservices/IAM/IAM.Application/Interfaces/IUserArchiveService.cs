using IAM.Application.DTOs;

namespace IAM.Application.Interfaces;

/// <summary>
/// Archivage intelligent des comptes : un compte porteur d'historique métier
/// est archivé (et restaurable) plutôt que détruit ; un compte sans aucune
/// trace métier est réellement supprimé. Voir UserArchiveService.
/// </summary>
public interface IUserArchiveService
{
    /// <summary>Données métier rattachées au compte (pour décider et expliquer).</summary>
    Task<UserDependenciesDto> GetDependenciesAsync(long userId);

    /// <summary>Archive si le compte a un historique, supprime définitivement sinon.</summary>
    Task<DeleteOrArchiveResultDto> DeleteOrArchiveAsync(long adminId, long userId);

    /// <summary>Comptes archivés, avec le volume d'historique conservé.</summary>
    Task<IEnumerable<ArchivedUserDto>> GetArchivedAsync();

    /// <summary>Sort le compte de l'archive (repasse en SUSPENDU, à réactiver).</summary>
    Task RestoreAsync(long userId);

    /// <summary>Suppression définitive d'un archivé — refusée s'il porte de l'historique.</summary>
    Task PurgeAsync(long userId);
}
