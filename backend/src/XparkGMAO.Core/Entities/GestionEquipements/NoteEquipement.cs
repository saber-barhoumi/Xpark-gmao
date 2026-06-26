using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.GestionEquipements
{
    /// <summary>
    /// Note libre attachée à un équipement.
    /// Saisie par gestionnaire, technicien ou admin.
    /// </summary>
    public class NoteEquipement
    {
        public long IdNote { get; set; }

        public long EquipementId { get; set; }
        public Equipement Equipement { get; set; } = null!;

        public long AuteurId { get; set; }
        public Utilisateur Auteur { get; set; } = null!;

        /// <summary>"info" | "warning" | "danger" | "success"</summary>
        public string Priorite { get; set; } = "info";

        public string Contenu { get; set; } = string.Empty;

        /// <summary>Tags libres ex: ["incident","garantie","sav"]</summary>
        public string? TagsJson { get; set; }

        /// <summary>URLs pièces jointes (PDF, images)</summary>
        public string? PiecesJointesJson { get; set; }

        public bool IsEpingle { get; set; } = false;   // Note épinglée en haut

        public DateTime DateCreation { get; set; } = DateTime.UtcNow;
        public DateTime DateModification { get; set; } = DateTime.UtcNow;
    }
}
