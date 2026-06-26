namespace XparkGMAO.Core.Entities.GestionFlotte;

/// <summary>
/// Statut d'un véhicule dans la flotte
/// </summary>
public enum StatutVehicule
{
    DISPONIBLE,
    EN_MAINTENANCE,
    EN_MISSION,
    HORS_SERVICE,
    BESOIN_MAINTENANCE
}

/// <summary>
/// Type de carburant du véhicule
/// </summary>
public enum TypeCarburant
{
    ESSENCE,
    DIESEL,
    HYBRIDE,
    ELECTRIQUE,
    GPL
}

/// <summary>
/// Type de véhicule
/// </summary>
public enum TypeVehicule
{
    BERLINE,
    SUV,
    UTILITAIRE,
    CAMION,
    MINIBUS,
    MOTO
}
