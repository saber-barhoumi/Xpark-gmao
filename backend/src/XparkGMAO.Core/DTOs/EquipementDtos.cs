using XparkGMAO.Core.Entities.GestionEquipements;

namespace XparkGMAO.Core.DTOs
{
    public class CreateEquipementDto
    {
        public string Nom { get; set; } = string.Empty;
        public string CodeInventaire { get; set; } = string.Empty;
        public TypeEquipement Type { get; set; }
        public CategorieEquipement Categorie { get; set; }
        public EtatEquipement Etat { get; set; } = EtatEquipement.Neuf;
        public string? Marque { get; set; }
        public string? Modele { get; set; }
        public string? NumeroSerie { get; set; }
        public string? Fournisseur { get; set; }
        public string? ImageUrl { get; set; }
        public List<string>? DocumentsUrls { get; set; }
        public DateTime? DateAchat { get; set; }         // UTC
        public decimal? PrixAchat { get; set; }
        public DateTime? DateFinGarantie { get; set; }   // UTC
        public int DureeVieTheoriqueEnMois { get; set; }
        public int? SeuilUsureUtilisations { get; set; }
        public int? SeuilRemplacementUtilisations { get; set; }
        public long? VehiculeId { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateEquipementDto : CreateEquipementDto { }

    public class EquipementListItemDto
    {
        public long Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string CodeInventaire { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Categorie { get; set; } = string.Empty;
        public string Etat { get; set; } = string.Empty;
        public string? Marque { get; set; }
        public string? Modele { get; set; }
        public string? NomVehicule { get; set; }
        public string? ImmatriculationVehicule { get; set; }
        public string? Fournisseur { get; set; }
        public string? ImageUrl { get; set; }
        public int NombreUtilisations { get; set; }
        public decimal HeuresUtilisation { get; set; }
        public DateTime? DateFinGarantie { get; set; }
        public bool Actif { get; set; }
        public DateTime DateCreation { get; set; }
    }

    public class EquipementDetailDto : EquipementListItemDto
    {
        public string? NumeroSerie { get; set; }
        public string? Fournisseur { get; set; }
        public string? ImageUrl { get; set; }
        public List<string> DocumentsUrls { get; set; } = new();
        public DateTime? DateAchat { get; set; }
        public decimal? PrixAchat { get; set; }
        public int DureeVieTheoriqueEnMois { get; set; }
        public int? SeuilUsureUtilisations { get; set; }
        public int? SeuilRemplacementUtilisations { get; set; }
        public DateTime? DateEstimationRemplacement { get; set; } // Predictive maintenance
        public string? NotesGenerales { get; set; }
        public List<MouvementDto> Mouvements { get; set; } = new();
        public List<InspectionDto> Inspections { get; set; } = new();
        public List<NoteEquipementDto> Notes { get; set; } = new();
        public List<ContratFournisseurDto> Contrats { get; set; } = new();
    }

    public class MouvementDto
    {
        public long Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public long? MissionId { get; set; }
        public string? ReferenceMission { get; set; }
        public string? NomUtilisateur { get; set; }
        public DateTime DateDebutUtc { get; set; }
        public DateTime? DateFinUtc { get; set; }
        public string? EtatApresRetour { get; set; }
        public decimal? CoutReparation { get; set; }
        public string? Observations { get; set; }
    }

    public class InspectionDto
    {
        public long Id { get; set; }
        public string NomTechnicien { get; set; } = string.Empty;
        public string EtatConstate { get; set; } = string.Empty;
        public int ScoreEtat { get; set; }
        public string? Observations { get; set; }
        public bool RecommandeRemplacement { get; set; }
        public decimal? CoutEstimeRemplacement { get; set; }
        public DateTime DateCreation { get; set; }
    }

    public class CheckOutDto
    {
        public long EquipementId { get; set; }
        public long MissionId { get; set; }
        public long UserId { get; set; }
        public string? Observations { get; set; }
    }

    public class CheckInDto
    {
        public long MouvementId { get; set; }
        public string EtatApresRetour { get; set; } = string.Empty;  // "Bon" | "Use" | "Endommage" | "Perdu"
        public decimal? CoutReparation { get; set; }
        public string? Observations { get; set; }
        public List<string>? PhotosUrls { get; set; }
    }

    public class InspectionCreateDto
    {
        public EtatEquipement EtatConstate { get; set; }
        public int ScoreEtat { get; set; }
        public string? ChecklistJson { get; set; }
        public string? Observations { get; set; }
        public string? PhotosJson { get; set; }
        public decimal? CoutEstimeRemplacement { get; set; }
        public bool RecommandeRemplacement { get; set; }
    }

    public class VerificationMissionDto
    {
        public string Status { get; set; } = string.Empty;  // "OK" | "BLOCAGE"
        public List<EquipementListItemDto> EquipementsFixesOk { get; set; } = new();
        public List<EquipementListItemDto> EquipementsObligatoiresOk { get; set; } = new();
        public List<ProblemeEquipementDto> Problemes { get; set; } = new();
    }

    public class ProblemeEquipementDto
    {
        public EquipementListItemDto Equipement { get; set; } = null!;
        public string Raison { get; set; } = string.Empty;
        public bool Bloquant { get; set; }
    }

    public class FilterEquipementsDto
    {
        public string? Type { get; set; }           // "Fixe" | "Mobile" | "Obligatoire"
        public string? Etat { get; set; }           // "Neuf" | "Bon" | "Use" | "ARemplacer" | "HorsService"
        public string? Categorie { get; set; }
        public long? VehiculeId { get; set; }
        public bool? DisponiblePool { get; set; }   // Mobile non affecté à une mission active
        public string? Search { get; set; }         // nom, code, marque
        public string SortBy { get; set; } = "DateCreation";
        public string SortOrder { get; set; } = "DESC";
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 20;
    }

    public class PagedResult<T>
    {
        public List<T> Data { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
        public int TotalPages { get; set; }
    }

    public class KpiEquipementsDto
    {
        public double TauxDisponibilite { get; set; }
        public List<CoutCategorieDto> CoutRemplacementMoyenParCategorie { get; set; } = new();
        public List<DureeVieDto> DureeVieMoyenneVsTheorique { get; set; } = new();
    }

    public class CoutCategorieDto
    {
        public string Categorie { get; set; } = string.Empty;
        public decimal CoutMoyen { get; set; }
        public int NbEquipements { get; set; }
    }

    public class DureeVieDto
    {
        public string Categorie { get; set; } = string.Empty;
        public double DureeVieReelleMois { get; set; }
        public double DureeVieTheoriqueMois { get; set; }
        public double RatioPourcentage { get; set; }
    }

    public class NoteEquipementDto
    {
        public long Id { get; set; }
        public string NomAuteur { get; set; } = string.Empty;
        public string Priorite { get; set; } = "info";   // "info"|"warning"|"danger"|"success"
        public string Contenu { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public List<string> PiecesJointes { get; set; } = new();
        public bool IsEpingle { get; set; }
        public DateTime DateCreation { get; set; }
        public DateTime DateModification { get; set; }
    }

    public class CreateNoteEquipementDto
    {
        public long EquipementId { get; set; }
        public string Priorite { get; set; } = "info";
        public string Contenu { get; set; } = string.Empty;
        public List<string>? Tags { get; set; }
        public List<string>? PiecesJointes { get; set; }
        public bool IsEpingle { get; set; } = false;
    }

    public class ContratFournisseurDto
    {
        public long Id { get; set; }
        public string Type { get; set; } = string.Empty;       // "Garantie" | "MaintenancePreventive" ...
        public string NomFournisseur { get; set; } = string.Empty;
        public string? NumeroContrat { get; set; }
        public string? ContactFournisseur { get; set; }
        public string? TelephoneSAV { get; set; }
        public DateTime DateDebutUtc { get; set; }
        public DateTime DateFinUtc { get; set; }
        public decimal? MontantAnnuel { get; set; }
        public string? DocumentUrl { get; set; }
        public string? Notes { get; set; }
        public bool IsActif { get; set; }
        public bool EstExpire { get; set; }                    // DateFinUtc < UtcNow
        public int JoursRestants { get; set; }                 // Calculé côté serveur
        public DateTime DateCreation { get; set; }
    }

    public class CreateContratFournisseurDto
    {
        public long EquipementId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string NomFournisseur { get; set; } = string.Empty;
        public string? NumeroContrat { get; set; }
        public string? ContactFournisseur { get; set; }
        public string? TelephoneSAV { get; set; }
        public DateTime DateDebutUtc { get; set; }
        public DateTime DateFinUtc { get; set; }
        public decimal? MontantAnnuel { get; set; }
        public string? DocumentUrl { get; set; }
        public string? Notes { get; set; }
    }
}
