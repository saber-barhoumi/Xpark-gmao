using System.ComponentModel.DataAnnotations;
using XparkGMAO.Core.Entities.Security;

namespace XparkGMAO.Core.Entities.Chat
{
    public class MessageReaction
    {
        [Key]
        public long IdReaction { get; set; }

        [Required]
        public long MessageId { get; set; }
        public Message Message { get; set; } = null!;

        [Required]
        public long UtilisateurId { get; set; }
        public Utilisateur Utilisateur { get; set; } = null!;

        /// <summary>
        /// Type de réaction (emoji)
        /// </summary>
        [Required]
        [MaxLength(10)]
        public string TypeReaction { get; set; } = string.Empty;  // 👍 ❤️ 😂 😮 😢 👎

        [Required]
        public DateTime DateReaction { get; set; }
    }
}
