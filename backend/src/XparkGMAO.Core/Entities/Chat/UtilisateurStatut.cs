using System.ComponentModel.DataAnnotations;
using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.Chat
{
    public class UtilisateurStatut
    {
        [Key]
        public long IdStatut { get; set; }

        [Required]
        public long UtilisateurId { get; set; }
        public Utilisateur Utilisateur { get; set; } = null!;

        [Required]
        public StatutEnLigne Statut { get; set; }

        [Required]
        public DateTime DerniereActivite { get; set; }

        /// <summary>
        /// Message de statut personnalisé (ex: "En réunion", "En déplacement")
        /// </summary>
        [MaxLength(200)]
        public string? MessageCustom { get; set; }

        /// <summary>
        /// ID de connexion SignalR
        /// </summary>
        [MaxLength(100)]
        public string? ConnectionId { get; set; }
    }
}
