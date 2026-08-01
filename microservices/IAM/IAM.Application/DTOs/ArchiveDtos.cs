namespace IAM.Application.DTOs;

/// <summary>
/// Détail des données métier rattachées à un compte. Sert à décider entre
/// suppression définitive et archivage, et à expliquer la décision à l'admin.
/// </summary>
public record UserDependencyDto(
    string Libelle,     // « Missions », « Factures »…
    int    Nombre
);

public record UserDependenciesDto(
    long                          UserId,
    bool                          ADesDonneesMetier,
    int                           TotalReferences,
    IEnumerable<UserDependencyDto> Details
);

/// <summary>Résultat d'une suppression : archivé ou réellement supprimé.</summary>
public record DeleteOrArchiveResultDto(
    long   UserId,
    bool   Archive,          // true = archivé (historique conservé), false = supprimé
    string Message,
    IEnumerable<UserDependencyDto> Details
);

/// <summary>Ligne du module Archives.</summary>
public record ArchivedUserDto(
    long      IdUtilisateur,
    string    Nom,
    string    Prenom,
    string    Email,
    string?   Telephone,
    string    Role,
    DateTime  DateCreation,
    DateTime? DateArchivage,
    int       TotalReferences
);
