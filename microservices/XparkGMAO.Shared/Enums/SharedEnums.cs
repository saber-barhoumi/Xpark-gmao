namespace XparkGMAO.Shared.Enums;

// ─── User / IAM ───────────────────────────────────────────────────────────────
public enum Role { CLIENT = 1, CHAUFFEUR = 2, TECHNICIEN = 3, GESTIONNAIRE = 4, ADMINISTRATEUR = 5, ADMIN = 6 }
public enum StatutUtilisateur { EN_ATTENTE = 0, ACTIF = 1, SUSPENDU = 2, DESACTIVE = 3 }
public enum StatutChauffeur { DISPONIBLE, EN_MISSION, EN_CONGE, SUSPENDU, INACTIF }
public enum CategoriePermis { A, B, C, D, E, BE, CE }
public enum PostEmployee { CHAUFFEUR, TECHNICIEN, ADMINISTRATEUR, GESTIONNAIRE, DIRECTEUR, RESPONSABLE_MAINTENANCE }
public enum ServiceEmployee { TRANSPORT, MAINTENANCE, ADMINISTRATION, DIRECTION }
public enum StatutEmployee { DISPONIBLE, EN_MISSION, EN_CONGE, INACTIF }
public enum SpecialtyTechnician { MECANIQUE, ELECTRICITE, PNEUMATIQUE, HYDRAULIQUE }
public enum LevelTechnician { JUNIOR, SENIOR, EXPERT }

// ─── Fleet ────────────────────────────────────────────────────────────────────
public enum TypeCarburant { ESSENCE, DIESEL, HYBRIDE, ELECTRIQUE, GPL }
public enum TypeVehicule { BERLINE, SUV, UTILITAIRE, CAMION, MINIBUS, MOTO, VAN, BUS, AUTRE }
public enum StatutVehicule { DISPONIBLE, EN_MISSION, EN_MAINTENANCE, HORS_SERVICE, BESOIN_MAINTENANCE, INDISPONIBLE }
public enum TypeSource { STATION_EXTERNE = 0, DAC_INTERNE = 1, CARTE_CARBURANT = 2, CITERE_MOBILE = 3, STOCKAGE_PRIVE = 4 }
public enum TypeDocument { CARTE_GRISE, VIGNETTE, VISITE_TECHNIQUE, PERMIS_CIRCULER, CERTIFICAT_CONFORMITE, ASSURANCE, AUTRE }
public enum TypeEquipement { Fixe, Mobile, Obligatoire }
public enum CategorieEquipement { Securite, Mecanique, Electronique, Outillage, Informatique, Autre }
public enum EtatEquipement { Neuf, Bon, Use, ARemplacer, HorsService }

// ─── Mission ──────────────────────────────────────────────────────────────────
public enum StatutMission { EN_ATTENTE, EN_COURS, TERMINEE, ANNULEE }
public enum StatutReservation { EN_ATTENTE, CONFIRMEE, ANNULEE, TERMINEE }

// ─── Maintenance ──────────────────────────────────────────────────────────────
public enum TypeIntervention { PREVENTIVE, CURATIVE }
public enum StatutIntervention { EN_ATTENTE = 0, PLANIFIEE = 1, EN_COURS = 2, TERMINEE = 3, ANNULEE = 4 }
public enum StatutOrdreTravail { PLANIFIE, EN_COURS, TERMINE, ANNULE }
public enum PrioriteOrdreTravail { BASSE, MOYENNE, HAUTE, URGENT }
public enum CategoriePiece { MOTEUR, TRANSMISSION, FREINAGE, SUSPENSION, ELECTRICITE, CARROSSERIE, PNEUMATIQUE, FILTRATION, ECLAIRAGE, AUTRE }

// ─── Finance ──────────────────────────────────────────────────────────────────
public enum StatutFacture { BROUILLON, EMISE, PAYEE, ANNULEE, EN_RETARD }
public enum StatutDevis { BROUILLON, ENVOYE, ACCEPTE, REFUSE, EXPIRE }

// ─── Alerts ───────────────────────────────────────────────────────────────────
public enum TypeAlerte
{
    ASSURANCE, VISITE_TECHNIQUE, VIGNETTE, PERMIS_CONDUIRE,
    MAINTENANCE, STOCK_FAIBLE, DOCUMENT_EXPIRE, MISSION_EN_RETARD,
    EQUIPEMENT_HORS_SERVICE, KILOMETRAGE_REVISON, AUTRE
}
public enum Priorite { BASSE, MOYENNE, HAUTE, CRITIQUE }
public enum StatutAlerte { ACTIVE, LUE, TRAITEE, IGNOREE }

// ─── Chat ─────────────────────────────────────────────────────────────────────
public enum TypeConversation { PRIVEE, GROUPE }
public enum TypeMessage { TEXTE, FICHIER, IMAGE, VIDEO }

// ─── KPI ──────────────────────────────────────────────────────────────────────
public enum CategorieKPI { MISSIONS, FLOTTE, FINANCE, MAINTENANCE, CARBURANT, EQUIPEMENTS }
public enum TendanceKPI { HAUSSE, BAISSE, STABLE }
