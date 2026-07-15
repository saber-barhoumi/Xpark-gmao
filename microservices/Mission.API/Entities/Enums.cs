namespace Mission.API.Entities;

public enum StatutMission  { EN_ATTENTE, EN_COURS, TERMINEE, ANNULEE }
public enum StatutVehicule { DISPONIBLE, EN_MAINTENANCE, EN_MISSION, HORS_SERVICE, BESOIN_MAINTENANCE }
public enum PostEmployee   { CHAUFFEUR, TECHNICIEN, ADMINISTRATEUR, GESTIONNAIRE, DIRECTEUR, RESPONSABLE_MAINTENANCE }
public enum StatutEmployee { DISPONIBLE, EN_MISSION, EN_CONGE, INACTIF }

/// <summary>Cycle de vie d'une demande de transport (devis), avant qu'elle ne devienne une Mission.</summary>
public enum StatutDemandeTransport { PENDING_QUOTATION, QUOTATION_SENT, ACCEPTED, REJECTED, CANCELLED }

/// <summary>Comment le prix final d'un devis a été déterminé.</summary>
public enum MethodePrix { AI_PRICE, MODIFIED, MANUAL }
