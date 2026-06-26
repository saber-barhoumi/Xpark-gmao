namespace Maintenance.API.Entities;

public enum TypeIntervention     { PREVENTIVE, CURATIVE }
public enum StatutIntervention   { EN_ATTENTE = 0, PLANIFIEE = 1, EN_COURS = 2, TERMINEE = 3, ANNULEE = 4 }
public enum StatutOrdreTravail   { PLANIFIE = 0, EN_COURS = 1, TERMINE = 2, ANNULE = 3 }
public enum PrioriteOrdreTravail { BASSE = 0, MOYENNE = 1, HAUTE = 2, URGENT = 3 }
public enum StatutVehicule       { DISPONIBLE, EN_MAINTENANCE, EN_MISSION, HORS_SERVICE, BESOIN_MAINTENANCE }
public enum CategoriePiece       { MOTEUR, TRANSMISSION, FREINAGE, SUSPENSION, ELECTRICITE, CARROSSERIE, PNEUMATIQUE, FILTRATION, ECLAIRAGE, AUTRE }
public enum Role                 { ADMIN = 6, ADMINISTRATEUR = 5, GESTIONNAIRE = 4, TECHNICIEN = 3, CHAUFFEUR = 2, CLIENT = 1 }
public enum StatutUtilisateur    { EN_ATTENTE = 0, ACTIF = 1, SUSPENDU = 2, DESACTIVE = 3 }
