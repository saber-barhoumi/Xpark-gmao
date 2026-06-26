using System.ComponentModel.DataAnnotations;
using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.Chat
{
    public class Conversation
    {
        [Key]
        public long IdConversation { get; set; }

        /// <summary>
        /// Titre (pour groupes uniquement, null pour conversations privées)
        /// </summary>
        [MaxLength(200)]
        public string? Titre { get; set; }

        [Required]
        public TypeConversation TypeConversation { get; set; }

        [Required]
        public DateTime DateCreation { get; set; }

        public DateTime? DernierMessageDate { get; set; }

        /// <summary>
        /// Créateur de la conversation
        /// </summary>
        [Required]
        public long CreatedByUserId { get; set; }
        public Utilisateur CreatedByUser { get; set; } = null!;

        /// <summary>
        /// Image de groupe (optionnel)
        /// </summary>
        [MaxLength(500)]
        public string? ImageGroupe { get; set; }

        /// <summary>
        /// Conversation archivée ?
        /// </summary>
        public bool EstArchivee { get; set; }

        // Relations
        public ICollection<Message> Messages { get; set; } = new List<Message>();
        public ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();
    }
}
