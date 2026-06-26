using System.ComponentModel.DataAnnotations;
using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.Chat
{
    public class Message
    {
        [Key]
        public long IdMessage { get; set; }

        [Required]
        public string Contenu { get; set; } = string.Empty;

        [Required]
        public DateTime DateEnvoi { get; set; }

        [Required]
        public TypeMessage TypeMessage { get; set; }

        [Required]
        public long ExpediteurId { get; set; }
        public Utilisateur Expediteur { get; set; } = null!;

        [Required]
        public long ConversationId { get; set; }
        public Conversation Conversation { get; set; } = null!;

        /// <summary>
        /// Message lu par tous ?
        /// </summary>
        public bool EstLu { get; set; }

        /// <summary>
        /// Date de lecture
        /// </summary>
        public DateTime? DateLecture { get; set; }

        /// <summary>
        /// Message supprimé ?
        /// </summary>
        public bool EstSupprime { get; set; }

        /// <summary>
        /// Message modifié ?
        /// </summary>
        public bool EstModifie { get; set; }
        public DateTime? DateModification { get; set; }

        /// <summary>
        /// Message épinglé ?
        /// </summary>
        public bool Epingle { get; set; }

        // Fichiers
        [MaxLength(500)]
        public string? CheminFichier { get; set; }

        [MaxLength(200)]
        public string? NomFichier { get; set; }

        public long? TailleFichier { get; set; }

        /// <summary>
        /// ID du message parent (pour réponses/threads)
        /// </summary>
        public long? ReponseAMessageId { get; set; }
        public Message? MessageParent { get; set; }

        // Relations
        public ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();
        public ICollection<Message> Reponses { get; set; } = new List<Message>();
    }
}
