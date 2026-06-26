using System.ComponentModel.DataAnnotations;
using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.Chat
{
    public class ConversationParticipant
    {
        [Key]
        public long IdParticipant { get; set; }

        [Required]
        public long ConversationId { get; set; }
        public Conversation Conversation { get; set; } = null!;

        [Required]
        public long UtilisateurId { get; set; }
        public Utilisateur Utilisateur { get; set; } = null!;

        [Required]
        public DateTime DateAjout { get; set; }

        /// <summary>
        /// Date de dernière lecture des messages
        /// </summary>
        public DateTime? DerniereLecture { get; set; }

        /// <summary>
        /// Est administrateur du groupe ?
        /// </summary>
        public bool EstAdmin { get; set; }

        /// <summary>
        /// Conversation épinglée dans la liste ?
        /// </summary>
        public bool EstEpingle { get; set; }

        /// <summary>
        /// Notifications activées ?
        /// </summary>
        public bool NotificationsActivees { get; set; } = true;

        /// <summary>
        /// Pseudo/Nickname personnalisé dans cette conversation
        /// </summary>
        [MaxLength(100)]
        public string? Pseudonyme { get; set; }
    }
}
