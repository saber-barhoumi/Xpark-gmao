using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.GestionEquipements
{
    public class InspectionEquipement
    {
        public long IdInspection { get; set; }

        public long EquipementId { get; set; }
        public Equipement Equipement { get; set; } = null!;

        public long TechnicienId { get; set; }
        public Utilisateur Technicien { get; set; } = null!;

        public EtatEquipement EtatConstate { get; set; }

        /// <summary>Score de 1 (HS) à 10 (Neuf)</summary>
        public int ScoreEtat { get; set; }

        /// <summary>JSON : [{item, ok, commentaire}]</summary>
        public string? ChecklistJson { get; set; }

        public string? Observations { get; set; }

        public string? PhotosJson { get; set; }

        public decimal? CoutEstimeRemplacement { get; set; }

        public bool RecommandeRemplacement { get; set; } = false;

        public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    }
}
