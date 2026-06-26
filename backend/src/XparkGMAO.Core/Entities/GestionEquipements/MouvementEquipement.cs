using XparkGMAO.Core.Entities.GestionOperations;
using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.GestionEquipements
{
    public class MouvementEquipement
    {
        public long IdMouvement { get; set; }

        public TypeMouvement Type { get; set; }

        public long EquipementId { get; set; }
        public Equipement Equipement { get; set; } = null!;

        public long? MissionId { get; set; }
        public Mission? Mission { get; set; }

        /// <summary>Utilisateur ayant réalisé le mouvement</summary>
        public long? IdUtilisateur { get; set; }
        public Utilisateur? Utilisateur { get; set; }

        public DateTime DateDebutUtc { get; set; }

        /// <summary>Null = mouvement encore ouvert (en mission)</summary>
        public DateTime? DateFinUtc { get; set; }

        public EtatApresRetour? EtatApresRetour { get; set; }

        public decimal? CoutReparation { get; set; }

        public string? Observations { get; set; }

        /// <summary>URLs photos séparées par virgule</summary>
        public string? PhotosJson { get; set; }

        public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    }
}
