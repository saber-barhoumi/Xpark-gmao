namespace PredictionPanne.Domain.Entities;

/// <summary>
/// Projection LECTURE SEULE du véhicule (propriété de Fleet.API).
///
/// Même parti pris que Finance avec UtilisateurRef/MissionRef : la base
/// PostgreSQL est partagée, et prédire une panne suppose par nature de lire
/// l'état réel du véhicule. On ne l'écrit JAMAIS depuis ce service.
/// </summary>
public class VehiculeRef
{
    public long      IdVehicule            { get; set; }
    public string    Immatriculation       { get; set; } = string.Empty;
    public string    Marque                { get; set; } = string.Empty;
    public string    Modele                { get; set; } = string.Empty;
    public int       AnneeConstruction     { get; set; }
    public double    Kilometrage           { get; set; }
    public bool      Actif                 { get; set; }
    public DateTime? DateDerniereRevision  { get; set; }
    public DateTime? DateProchaineRevision { get; set; }
}

/// <summary>
/// Projection LECTURE SEULE d'une intervention (propriété de Maintenance.API).
/// C'est l'historique de pannes : le signal le plus fort du moteur de prédiction.
/// </summary>
public class InterventionRef
{
    public long      IdIntervention          { get; set; }
    public DateTime  DateIntervention        { get; set; }
    public string    TypeIntervention        { get; set; } = string.Empty; // PREVENTIVE | CURATIVE
    public string    Description             { get; set; } = string.Empty;
    public double    Cout                    { get; set; }
    public double    KilometrageIntervention { get; set; }
    public string    Statut                  { get; set; } = string.Empty;
    public long      VehiculeId              { get; set; }
}
